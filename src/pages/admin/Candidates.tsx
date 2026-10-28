import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import type { Candidate } from '../../types/index.ts';
import { Modal } from '../../components/common/Modal.tsx';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Image as ImageIcon,
  Quote,
} from 'lucide-react';

export const Candidates: React.FC = () => {
  const { showToast } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [formBallotNumber, setFormBallotNumber] = useState<number>(1);
  const [formChairName, setFormChairName] = useState('');
  const [formViceChairName, setFormViceChairName] = useState('');
  const [formPhotoPath, setFormPhotoPath] = useState('');
  const [formVision, setFormVision] = useState('');
  const [formMission, setFormMission] = useState('');
  const [formSlogan, setFormSlogan] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Preview Modal
  const [previewCandidate, setPreviewCandidate] = useState<Candidate | null>(null);

  // Delete Confirm State
  const [deletingCandidate, setDeletingCandidate] = useState<Candidate | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getCandidates(false);
      setCandidates(data);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat kandidat', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleOpenAdd = () => {
    const nextBallotNumber =
      candidates.length > 0 ? Math.max(...candidates.map((c) => c.ballot_number)) + 1 : 1;
    setEditingCandidate(null);
    setFormBallotNumber(nextBallotNumber);
    setFormChairName('');
    setFormViceChairName('');
    setFormPhotoPath('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80');
    setFormVision('');
    setFormMission('');
    setFormSlogan('');
    setFormIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Candidate) => {
    setEditingCandidate(c);
    setFormBallotNumber(c.ballot_number);
    setFormChairName(c.chair_name);
    setFormViceChairName(c.vice_chair_name);
    setFormPhotoPath(c.photo_path);
    setFormVision(c.vision);
    setFormMission(c.mission);
    setFormSlogan(c.slogan);
    setFormIsActive(c.is_active);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formChairName.trim() || !formViceChairName.trim() || !formVision.trim() || !formMission.trim()) {
      setFormError('Nama ketua, wakil, visi, dan misi wajib diisi.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      if (editingCandidate) {
        await api.updateCandidate(editingCandidate.id, {
          ballot_number: Number(formBallotNumber),
          chair_name: formChairName.trim(),
          vice_chair_name: formViceChairName.trim(),
          photo_path: formPhotoPath.trim(),
          vision: formVision.trim(),
          mission: formMission.trim(),
          slogan: formSlogan.trim(),
          is_active: formIsActive,
        });
        showToast('Data calon berhasil diperbarui.', 'success');
      } else {
        await api.addCandidate({
          ballot_number: Number(formBallotNumber),
          chair_name: formChairName.trim(),
          vice_chair_name: formViceChairName.trim(),
          photo_path: formPhotoPath.trim(),
          vision: formVision.trim(),
          mission: formMission.trim(),
          slogan: formSlogan.trim(),
          is_active: formIsActive,
        });
        showToast('Pasangan calon baru berhasil didaftarkan.', 'success');
      }
      setIsModalOpen(false);
      fetchCandidates();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan calon kandidat.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCandidate) return;
    setDeleteLoading(true);
    try {
      await api.deleteCandidate(deletingCandidate.id);
      showToast('Kandidat berhasil dihapus.', 'success');
      setDeletingCandidate(null);
      fetchCandidates();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus kandidat.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Calon Kandidat Ketua & Wakil Ketua OSIS
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Daftar resmi pasangan calon, nomor urut, foto, visi, misi, dan slogan
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pasangan Calon</span>
        </button>
      </div>

      {/* Candidate Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold">Memuat data kandidat...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-40 text-blue-600" />
          <p className="text-base font-bold text-slate-800">Belum ada pasangan calon.</p>
          <p className="text-xs text-slate-400 mt-1">Daftarkan pasangan calon pertama untuk memulai pemilihan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              {/* Photo & Number Banner */}
              <div className="relative h-48 bg-slate-900">
                <img
                  src={c.photo_path}
                  alt={c.chair_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
                  }}
                />
                <div className="absolute top-3 left-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-lg border border-white/50">
                    {c.ballot_number}
                  </div>
                </div>

                <div className="absolute top-3 right-3">
                  {c.is_active ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
                      <CheckCircle2 className="w-3 h-3" />
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-600 text-white shadow-xs">
                      <XCircle className="w-3 h-3" />
                      Nonaktif
                    </span>
                  )}
                </div>

                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent text-white">
                  <h3 className="text-base font-bold truncate">{c.chair_name}</h3>
                  <p className="text-xs text-slate-300 truncate">& {c.vice_chair_name}</p>
                </div>
              </div>

              {/* Slogan & Vision Preview */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                {c.slogan ? (
                  <p className="text-xs italic text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center font-medium">
                    "{c.slogan}"
                  </p>
                ) : (
                  <div className="h-6" />
                )}

                <div className="space-y-1.5 text-xs text-slate-600">
                  <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">
                    Visi Singkat:
                  </span>
                  <p className="line-clamp-2 leading-relaxed">{c.vision}</p>
                </div>

                {/* Vote stats pill */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Perolehan Suara:</span>
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    {c.vote_count || 0} suara
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setPreviewCandidate(c)}
                    className="flex-1 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Pratinjau</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                    title="Edit Kandidat"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeletingCandidate(c)}
                    className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Hapus Kandidat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Candidate Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !formLoading && setIsModalOpen(false)}
        title={editingCandidate ? 'Edit Data Calon' : 'Daftarkan Pasangan Calon Baru'}
        subtitle="Nomor urut harus unik dan foto dapat menggunakan tautan publik"
        maxWidth="xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nomor Urut
              </label>
              <input
                type="number"
                min={1}
                value={formBallotNumber}
                onChange={(e) => setFormBallotNumber(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Slogan Kampanye
              </label>
              <input
                type="text"
                value={formSlogan}
                onChange={(e) => setFormSlogan(e.target.value)}
                placeholder="Contoh: Bersama Berkarya, Nyata Menginspirasi!"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Calon Ketua OSIS
              </label>
              <input
                type="text"
                value={formChairName}
                onChange={(e) => setFormChairName(e.target.value)}
                placeholder="Nama lengkap ketua"
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Calon Wakil Ketua OSIS
              </label>
              <input
                type="text"
                value={formViceChairName}
                onChange={(e) => setFormViceChairName(e.target.value)}
                placeholder="Nama lengkap wakil ketua"
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              URL Foto Pasangan Calon (Supabase Storage / Web URL)
            </label>
            <div className="relative">
              <input
                type="text"
                value={formPhotoPath}
                onChange={(e) => setFormPhotoPath(e.target.value)}
                placeholder="https://..."
                required
                className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <ImageIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Visi
            </label>
            <textarea
              rows={2}
              value={formVision}
              onChange={(e) => setFormVision(e.target.value)}
              placeholder="Tuliskan rumusan visi pasangan calon..."
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Misi (Poin-poin program kerja)
            </label>
            <textarea
              rows={4}
              value={formMission}
              onChange={(e) => setFormMission(e.target.value)}
              placeholder="1. Program penguatan karakter...&#10;2. Penyelenggaraan pekan inovasi..."
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="candidateActiveCheck"
              checked={formIsActive}
              onChange={(e) => setFormIsActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="candidateActiveCheck" className="text-xs font-semibold text-slate-700">
              Kandidat aktif dan akan tampil pada bilik suara siswa
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={formLoading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
            >
              {formLoading ? 'Menyimpan...' : 'Simpan Data Calon'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewCandidate}
        onClose={() => setPreviewCandidate(null)}
        title="Pratinjau Kartu Suara Kandidat"
        subtitle="Tampilan kartu sebagaimana dilihat oleh siswa pemilih"
        maxWidth="md"
      >
        {previewCandidate && (
          <div className="space-y-4">
            <div className="relative h-56 rounded-2xl overflow-hidden bg-slate-900 shadow-md">
              <img
                src={previewCandidate.photo_path}
                alt={previewCandidate.chair_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-lg border-2 border-white">
                {previewCandidate.ballot_number}
              </div>
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent text-white">
                <p className="text-xs text-blue-300 font-semibold uppercase">
                  Paslon Nomor Urut {previewCandidate.ballot_number}
                </p>
                <h4 className="text-base font-extrabold">{previewCandidate.chair_name}</h4>
                <p className="text-xs text-slate-300">& {previewCandidate.vice_chair_name}</p>
              </div>
            </div>

            {previewCandidate.slogan && (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center italic text-xs text-slate-700 font-semibold flex items-center justify-center gap-1.5">
                <Quote className="w-3.5 h-3.5 text-blue-500 inline" />
                <span>"{previewCandidate.slogan}"</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Visi:
                </span>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {previewCandidate.vision}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Misi:
                </span>
                <div className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line">
                  {previewCandidate.mission}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Safe Delete Modal */}
      <Modal
        isOpen={!!deletingCandidate}
        onClose={() => !deleteLoading && setDeletingCandidate(null)}
        title="Hapus Pasangan Calon"
        subtitle="Perlindungan Integritas Pemilihan"
      >
        {deletingCandidate && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                Apakah Anda yakin ingin menghapus kandidat No. {deletingCandidate.ballot_number} (
                <b>{deletingCandidate.chair_name} & {deletingCandidate.vice_chair_name}</b>)?
                {deletingCandidate.vote_count && deletingCandidate.vote_count > 0 ? (
                  <p className="mt-1.5 font-bold text-rose-900">
                    Kandidat ini sudah mengantongi {deletingCandidate.vote_count} suara sah! Penghapusan dilarang untuk menjaga integritas hasil. Anda dapat menonaktifkan kandidat melalui menu Edit.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingCandidate(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition flex items-center gap-1.5"
              >
                {deleteLoading ? 'Menghapus...' : 'Ya, Hapus Kandidat'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
