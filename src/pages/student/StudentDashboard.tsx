import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Vote,
  CheckCircle2,
  AlertCircle,
  Clock,
  LogOut,
  Shield,
  GraduationCap,
  Calendar,
  ArrowRight,
  Info,
} from 'lucide-react';

interface StudentDashboardProps {
  onStartVoting: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onStartVoting }) => {
  const { student, settings, logout } = useAuth();

  if (!student) return null;

  const now = new Date();
  const starts = settings ? new Date(settings.starts_at) : null;
  const ends = settings ? new Date(settings.ends_at) : null;

  const isBeforeStart = starts && now < starts;
  const isAfterEnd = ends && now > ends;
  const isElectionClosed = settings?.election_status !== 'active';
  const hasVoted = student.has_voted;

  const canVote = !hasVoted && !isBeforeStart && !isAfterEnd && !isElectionClosed;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#0F284E] to-[#1E3E62] text-white py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg border border-blue-400/30">
              <Vote className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {settings?.school_name || 'SMP NEGERI 2 BOGOR'}
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                Portal Pemilihan OSIS
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                {settings?.election_name || 'Masa Bakti 2026/2027'}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition border border-white/10"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Status Callout Banner */}
        {hasVoted ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-4 shadow-xs">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-emerald-900">
                Anda sudah menggunakan hak suara
              </h2>
              <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                Suara Anda telah tercatat dengan aman dan terenkripsi pada sistem pemilihan. Hak suara setiap siswa berlaku 1 (satu) kali dan tidak dapat diubah kembali.
              </p>
            </div>
          </div>
        ) : isBeforeStart ? (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-4 shadow-xs">
            <div className="p-2.5 rounded-xl bg-amber-600 text-white shrink-0 mt-0.5">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-amber-900">
                Pemilihan Belum Dibuka
              </h2>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Periode pemungutan suara belum dimulai. Jadwal buka: {starts?.toLocaleString('id-ID')}. Silakan periksa kembali nanti.
              </p>
            </div>
          </div>
        ) : isAfterEnd || isElectionClosed ? (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-4 shadow-xs">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0 mt-0.5">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-rose-900">
                Pemilihan Telah Ditutup
              </h2>
              <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                Waktu pemungutan suara telah berakhir atau telah dinonaktifkan oleh panitia pemilihan.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-4 shadow-xs">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
              <Vote className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-blue-900">
                Pemilihan Sedang Berlangsung!
              </h2>
              <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                Gunakan hak pilih Anda dengan bijak dan jujur. Pilihlah pasangan calon Ketua & Wakil Ketua OSIS yang menurut Anda memiliki visi terbaik untuk memajukan sekolah.
              </p>
            </div>
          </div>
        )}

        {/* Biodata Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Biodata Siswa / Pemilih
              </h2>
              <p className="text-xs text-slate-500">
                Data resmi yang terdaftar pada sistem eOSIS
              </p>
            </div>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                hasVoted
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {hasVoted ? 'Sudah Memilih' : 'Belum Memilih'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Nama Lengkap
              </p>
              <p className="text-base font-bold text-slate-800 mt-1">
                {student.full_name}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                NISN (Tersamar)
              </p>
              <p className="text-base font-bold text-slate-800 mt-1 font-mono">
                {student.nisn_masked}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Kelas
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {student.class_name}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Status Hak Suara
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {hasVoted ? 'Sudah Digunakan' : '1 Suara Sah Tersedia'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Area */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Pilihan Anda dijamin rahasia oleh sistem eOSIS dan bebas dari intervensi siapapun.</span>
            </div>

            {canVote && (
              <button
                onClick={onStartVoting}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2.5 transition transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Vote className="w-5 h-5" />
                <span>Berikan Suara</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-xs text-slate-600 space-y-2">
          <p className="font-bold text-slate-800 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-600" />
            Panduan Pemberian Suara:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-500">
            <li>Tekan tombol <b>Berikan Suara</b> untuk melihat seluruh profil pasangan calon kandidat.</li>
            <li>Pelajari visi, misi, dan slogan setiap pasangan calon.</li>
            <li>Pilih 1 (satu) pasangan calon, lalu konfirmasi pilihan Anda pada jendela konfirmasi.</li>
            <li>Setelah terkirim, sesi Anda akan otomatis keluar dan suara tersimpan secara anonim.</li>
          </ul>
        </div>
      </main>
    </div>
  );
};
