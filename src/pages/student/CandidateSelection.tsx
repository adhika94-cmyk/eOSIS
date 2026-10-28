import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import type { Candidate } from '../../types/index.ts';
import { Modal } from '../../components/common/Modal.tsx';
import {
  Vote,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface CandidateSelectionProps {
  onBack: () => void;
  onVoteSuccess: () => void;
}

export const CandidateSelection: React.FC<CandidateSelectionProps> = ({
  onBack,
  onVoteSuccess,
}) => {
  const { showToast } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        setLoading(true);
        const data = await api.getCandidates(true);
        setCandidates(data);
      } catch (err: any) {
        showToast(err.message || 'Gagal memuat kandidat.', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadCandidates();
  }, [showToast]);

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);

  const handleOpenConfirm = () => {
    if (!selectedCandidateId) {
      showToast('Silakan pilih salah satu pasangan calon terlebih dahulu.', 'error');
      return;
    }
    setSubmitError('');
    setShowConfirmModal(true);
  };

  const handleConfirmVote = async () => {
    if (!selectedCandidateId || submitting) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      await api.castVote(selectedCandidateId);
      setShowConfirmModal(false);
      onVoteSuccess();
    } catch (err: any) {
      setSubmitError(err.message || 'Gagal menyimpan suara.');
      showToast(err.message || 'Gagal menyimpan suara.', 'error');
      setSubmitting(false);
    }
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-28">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Biodata</span>
          </button>

          <div className="text-center">
            <h1 className="text-sm sm:text-base font-extrabold text-slate-800">
              Surat Suara Elektronik OSIS
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Pilih 1 (satu) pasangan calon yang Anda dukung
            </p>
          </div>

          <div className="w-20 text-right">
            <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {candidates.length} Paslon
            </span>
          </div>
        </div>
      </div>

      {/* Main Candidate Grid */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">Memuat profil calon kandidat...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8">
            <p className="text-sm font-semibold text-slate-500">
              Belum ada calon kandidat aktif yang ditetapkan panitia.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((c) => {
              const isSelected = selectedCandidateId === c.id;
              const isExpanded = expandedId === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCandidateId(c.id)}
                  className={`relative cursor-pointer bg-white rounded-3xl overflow-hidden border-2 transition-all duration-200 flex flex-col ${
                    isSelected
                      ? 'border-blue-600 shadow-xl shadow-blue-500/15 ring-4 ring-blue-500/10'
                      : 'border-slate-200/80 hover:border-blue-300 shadow-xs hover:shadow-md'
                  }`}
                >
                  {/* Ballot Number Header Ribbon */}
                  <div className="relative h-48 bg-gradient-to-t from-slate-900/80 to-transparent">
                    <img
                      src={c.photo_path}
                      alt={`Foto Paslon No ${c.ballot_number}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
                      }}
                    />

                    {/* Number Badge */}
                    <div className="absolute top-3 left-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-lg border-2 border-white">
                        {c.ballot_number}
                      </div>
                    </div>

                    {/* Selection Indicator check */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 bg-emerald-500 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Pilihan Anda</span>
                      </div>
                    )}

                    {/* Names Overlay */}
                    <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent text-white">
                      <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider">
                        Pasangan Calon No. {c.ballot_number}
                      </p>
                      <h3 className="text-base font-extrabold leading-snug truncate">
                        {c.chair_name}
                      </h3>
                      <p className="text-xs text-slate-300 truncate">
                        & {c.vice_chair_name}
                      </p>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    {c.slogan && (
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700 italic text-center">
                        "{c.slogan}"
                      </div>
                    )}

                    {/* Vision & Mission preview */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block mb-1">
                          Visi:
                        </span>
                        <p className={`text-slate-600 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                          {c.vision}
                        </p>
                      </div>

                      {isExpanded && (
                        <div className="pt-2 border-t border-slate-100 animate-in fade-in duration-200">
                          <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block mb-1">
                            Misi:
                          </span>
                          <div className="text-slate-600 whitespace-pre-line leading-relaxed">
                            {c.mission}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={(e) => toggleExpand(c.id, e)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 pt-1"
                      >
                        <span>{isExpanded ? 'Tutup Detail Visi & Misi' : 'Baca Visi & Misi Lengkap'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Select Action Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedCandidateId(c.id)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Pasangan Telah Dipilih</span>
                        </>
                      ) : (
                        <span>Pilih Pasangan Ini</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 z-30 shadow-2xl">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            {selectedCandidate ? (
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                  {selectedCandidate.ballot_number}
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Kandidat Terpilih:</p>
                  <p className="text-sm font-bold text-slate-900 leading-tight">
                    {selectedCandidate.chair_name} & {selectedCandidate.vice_chair_name}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-medium">
                Belum ada pasangan calon yang dipilih. Ketuk salah satu kartu kandidat di atas.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onBack}
              className="flex-1 sm:flex-none px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Batal
            </button>

            <button
              onClick={handleOpenConfirm}
              disabled={!selectedCandidateId}
              className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition"
            >
              <Vote className="w-4 h-4" />
              <span>Lanjutkan & Kirim Suara</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => !submitting && setShowConfirmModal(false)}
        title="Konfirmasi Pilihan Suara Anda"
        subtitle="Pastikan pilihan Anda sudah benar sebelum disimpan ke database"
        maxWidth="md"
      >
        {selectedCandidate && (
          <div className="space-y-5">
            {/* Warning Callout */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 leading-relaxed font-medium">
                <b>PENTING:</b> Suara yang sudah dikirim bersifat final dan <b>tidak dapat diubah kembali</b>. Setiap siswa hanya memiliki 1 kali kesempatan memilih.
              </div>
            </div>

            {/* Candidate Card Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md">
                {selectedCandidate.ballot_number}
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Pasangan Calon No. {selectedCandidate.ballot_number}
                </span>
                <h4 className="text-sm font-bold text-slate-800 truncate">
                  {selectedCandidate.chair_name}
                </h4>
                <p className="text-xs text-slate-500 truncate">
                  Wakil: {selectedCandidate.vice_chair_name}
                </p>
              </div>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Kembali & Ubah Pilihan
              </button>

              <button
                type="button"
                onClick={handleConfirmVote}
                disabled={submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menyimpan Suara...</span>
                  </>
                ) : (
                  <>
                    <Vote className="w-4 h-4" />
                    <span>Ya, Kirim Suara Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
