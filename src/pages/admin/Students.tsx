import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import type { Student, ClassItem } from '../../types/index.ts';
import { Modal } from '../../components/common/Modal.tsx';
import {
  Users,
  Plus,
  Search,
  FileSpreadsheet,
  Download,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileText,
  Upload,
} from 'lucide-react';

export const Students: React.FC = () => {
  const { showToast } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [votedStatus, setVotedStatus] = useState<'all' | 'voted' | 'not_voted'>('all');

  // Single Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formNisn, setFormNisn] = useState('');
  const [formName, setFormName] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // CSV Import Modal
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvResults, setCsvResults] = useState<{ success_count: number; errors: string[] } | null>(null);

  // Delete State
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchClasses = async () => {
    try {
      const data = await api.getClasses();
      setClasses(data);
      if (data.length > 0 && !formClassId) {
        setFormClassId(data[0].id);
      }
    } catch (e) {
      console.warn('Could not load classes list');
    }
  };

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getStudents({
        search: searchQuery,
        class_id: selectedClass,
        voted_status: votedStatus,
        page: currentPage,
        limit: 12,
      });
      setStudents(res.students);
      setTotalStudents(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data siswa', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedClass, votedStatus, currentPage, showToast]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormNisn('');
    setFormName('');
    setFormBirthDate('2011-01-01');
    setFormClassId(classes[0]?.id || '');
    setFormIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setFormNisn(s.nisn);
    setFormName(s.full_name);
    setFormBirthDate(s.birth_date.split('T')[0]);
    setFormClassId(s.class_id);
    setFormIsActive(s.is_active);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(formNisn.trim())) {
      setFormError('NISN harus tepat 10 digit angka.');
      return;
    }
    if (!formName.trim()) {
      setFormError('Nama lengkap wajib diisi.');
      return;
    }
    if (!formBirthDate) {
      setFormError('Tanggal lahir wajib diisi.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, {
          nisn: formNisn.trim(),
          full_name: formName.trim(),
          birth_date: formBirthDate,
          class_id: formClassId,
          is_active: formIsActive,
        });
        showToast('Data siswa berhasil diperbarui.', 'success');
      } else {
        await api.addStudent({
          nisn: formNisn.trim(),
          full_name: formName.trim(),
          birth_date: formBirthDate,
          class_id: formClassId,
          is_active: formIsActive,
        });
        showToast('Siswa baru berhasil ditambahkan.', 'success');
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data siswa.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingStudent) return;
    setDeleteLoading(true);
    try {
      await api.deleteStudent(deletingStudent.id);
      showToast('Data siswa berhasil dihapus.', 'success');
      setDeletingStudent(null);
      fetchStudents();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus siswa.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleProcessCSV = async () => {
    if (!csvText.trim()) {
      showToast('Silakan tempel atau unggah data CSV terlebih dahulu.', 'error');
      return;
    }

    setCsvLoading(true);
    setCsvResults(null);

    try {
      // Split by line
      const lines = csvText.trim().split('\n');
      const rows: Array<{ nisn: string; full_name: string; birth_date: string; class_name: string }> = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        // Ignore header if present
        if (i === 0 && line.toLowerCase().includes('nisn')) continue;

        const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 4) {
          rows.push({
            nisn: parts[0],
            full_name: parts[1],
            birth_date: parts[2],
            class_name: parts[3],
          });
        }
      }

      if (rows.length === 0) {
        throw new Error('Format CSV tidak dikenali. Pastikan terdapat 4 kolom: NISN, Nama, Tanggal Lahir, Kelas');
      }

      const res = await api.importStudentsCSV(rows);
      setCsvResults(res);
      showToast(`Berhasil mengimpor ${res.success_count} data siswa!`, 'success');
      fetchStudents();
    } catch (err: any) {
      showToast(err.message || 'Gagal memproses data CSV.', 'error');
    } finally {
      setCsvLoading(false);
    }
  };

  const loadSampleCSV = () => {
    setCsvText(
      `nisn,full_name,birth_date,class_name\n` +
      `0082345601,Budi Santoso,2011-04-15,VII-A\n` +
      `0082345602,Cantika Aurelia,2011-09-20,VII-A\n` +
      `0082345603,Dimas Wicaksono,2010-06-11,VIII-B\n` +
      `0082345604,Erlina Putri,2009-12-05,IX-C`
    );
  };

  const exportCurrentData = () => {
    if (students.length === 0) {
      showToast('Tidak ada data siswa untuk diekspor.', 'error');
      return;
    }
    const headers = 'NISN,Nama Lengkap,Tanggal Lahir,Kelas,Status Memilih,Status Akun\n';
    const csvContent = students
      .map(
        (s) =>
          `"${s.nisn}","${s.full_name}","${s.birth_date.split('T')[0]}","${s.class_name}","${
            s.has_voted ? 'Sudah Memilih' : 'Belum Memilih'
          }","${s.is_active ? 'Aktif' : 'Nonaktif'}"`
      )
      .join('\n');

    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_siswa_eosis_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data CSV berhasil diunduh.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Data Siswa / Pemilih
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Total {totalStudents} siswa terdaftar dalam daftar pemilih tetap (DPT)
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={exportCurrentData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => {
              setCsvResults(null);
              setIsCsvModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Impor CSV Massal</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari NISN atau nama siswa..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Class Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Kelas:</span>
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="all">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Voting Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Status Hak Suara:</span>
          <select
            value={votedStatus}
            onChange={(e) => {
              setVotedStatus(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="all">Semua Status</option>
            <option value="voted">Sudah Memilih</option>
            <option value="not_voted">Belum Memilih</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold">Memuat daftar siswa...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-slate-700">Data siswa tidak ditemukan.</p>
            <p className="text-xs text-slate-400 mt-1">Sesuaikan filter atau tambahkan siswa baru.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-6">NISN</th>
                    <th className="py-3.5 px-6">Nama Siswa</th>
                    <th className="py-3.5 px-6">Tanggal Lahir</th>
                    <th className="py-3.5 px-6">Kelas</th>
                    <th className="py-3.5 px-6">Status Memilih</th>
                    <th className="py-3.5 px-6">Status Akun</th>
                    <th className="py-3.5 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">
                        {s.nisn}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {s.full_name}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {new Date(s.birth_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-bold text-[11px]">
                          {s.class_name}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {s.has_voted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Sudah Memilih
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Belum Memilih
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            s.is_active ? 'bg-slate-100 text-slate-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {s.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Data Siswa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingStudent(s)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Halaman <b>{currentPage}</b> dari <b>{totalPages}</b>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
                  title="Halaman Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !formLoading && setIsModalOpen(false)}
        title={editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Pemilih'}
        subtitle="NISN dan tanggal lahir digunakan siswa untuk masuk ke portal pemilihan"
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              NISN (10 Digit)
            </label>
            <input
              type="text"
              maxLength={10}
              value={formNisn}
              onChange={(e) => setFormNisn(e.target.value.replace(/\D/g, ''))}
              placeholder="Contoh: 0081234501"
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Lengkap Siswa
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Nama lengkap sesuai data raport"
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tanggal Lahir
              </label>
              <input
                type="date"
                value={formBirthDate}
                onChange={(e) => setFormBirthDate(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kelas
              </label>
              <select
                value={formClassId}
                onChange={(e) => setFormClassId(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="studentActiveCheck"
              checked={formIsActive}
              onChange={(e) => setFormIsActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="studentActiveCheck" className="text-xs font-semibold text-slate-700">
              Siswa berstatus aktif dan memiliki hak suara sah
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
              {formLoading ? 'Menyimpan...' : 'Simpan Siswa'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={isCsvModalOpen}
        onClose={() => !csvLoading && setIsCsvModalOpen(false)}
        title="Impor Data Siswa via CSV"
        subtitle="Format: NISN, Nama Lengkap, Tanggal Lahir (YYYY-MM-DD), Nama Kelas"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Tempel teks CSV atau gunakan template contoh:
            </span>
            <button
              type="button"
              onClick={loadSampleCSV}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Muat Format Contoh</span>
            </button>
          </div>

          <textarea
            rows={8}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="nisn,full_name,birth_date,class_name&#10;0081234501,Ahmad Pratama,2011-05-14,VII-A"
            className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition leading-relaxed"
          />

          {csvResults && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>Berhasil mengimpor {csvResults.success_count} data siswa!</span>
              </div>
              {csvResults.errors.length > 0 && (
                <div className="mt-2 text-xs text-rose-700 space-y-1 max-h-32 overflow-y-auto">
                  <p className="font-bold">Catatan Peringatan / Duplikasi ({csvResults.errors.length}):</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {csvResults.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCsvModalOpen(false)}
              disabled={csvLoading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleProcessCSV}
              disabled={csvLoading || !csvText.trim()}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
            >
              {csvLoading ? (
                <span>Memproses Data...</span>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Proses & Impor Sekarang</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Student Modal */}
      <Modal
        isOpen={!!deletingStudent}
        onClose={() => !deleteLoading && setDeletingStudent(null)}
        title="Hapus Data Siswa"
        subtitle="Konfirmasi penghapusan data pemilih"
      >
        {deletingStudent && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                Hapus siswa <b>{deletingStudent.full_name}</b> (NISN: {deletingStudent.nisn})?
                {deletingStudent.has_voted && (
                  <p className="mt-1 font-bold text-rose-900">
                    Siswa ini sudah memberikan suara! Penghapusan akan ditolak demi integritas dan audit data voting.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
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
                {deleteLoading ? 'Menghapus...' : 'Ya, Hapus Data'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
