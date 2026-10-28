import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Vote, ArrowRight, Shield, Calendar, User, KeyRound, Sparkles } from 'lucide-react';

interface StudentLoginProps {
  onSwitchToAdmin: () => void;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({ onSwitchToAdmin }) => {
  const { loginStudent, settings } = useAuth();
  const [nisn, setNisn] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!nisn.trim()) {
      setErrorMessage('NISN wajib diisi.');
      return;
    }
    if (!birthDate) {
      setErrorMessage('Tanggal lahir wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      await loginStudent(nisn.trim(), birthDate);
    } catch (err: any) {
      setErrorMessage(err.message || 'NISN atau tanggal lahir tidak sesuai.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoNisn: string, demoBirth: string) => {
    setNisn(demoNisn);
    setBirthDate(demoBirth);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0F284E] to-[#0A1829] flex flex-col justify-center items-center px-4 py-8">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* School & App Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/30 mb-4 border border-blue-400/30">
            <Vote className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            eOSIS
          </h1>
          <p className="text-sm font-semibold text-blue-300 mt-1">
            {settings?.school_name || 'SMP NEGERI 2 BOGOR'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {settings?.election_name || 'Pemilihan Ketua dan Wakil Ketua OSIS'}
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              Masuk sebagai Siswa / Pemilih
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan NISN (10 digit) dan tanggal lahir Anda yang terdaftar pada dapodik sekolah.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 leading-relaxed flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nomor Induk Siswa Nasional (NISN)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  maxLength={10}
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value.replace(/\D/g, ''))}
                  placeholder="Contoh: 0081234501"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Tepat 10 angka sesuai kartu NISN
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tanggal Lahir
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition duration-150 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Identitas...</span>
                </>
              ) : (
                <>
                  <span>Masuk & Berikan Suara</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Acccount Helper */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Coba Cepat Akun Uji Coba (Demo):
            </p>
            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => fillDemo('0081234507', '2010-03-30')}
                className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-[11px] transition text-slate-700"
              >
                <span className="font-bold block text-blue-900">Gita (Belum Memilih)</span>
                <span className="text-[10px] text-slate-500">NISN: 0081234507</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('0081234501', '2011-05-14')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] transition text-slate-700"
              >
                <span className="font-bold block text-slate-800">Ahmad (Sudah Memilih)</span>
                <span className="text-[10px] text-slate-500">NISN: 0081234501</span>
              </button>
            </div>
          </div>

          {/* Switch to Admin */}
          <div className="mt-6 text-center">
            <button
              onClick={onSwitchToAdmin}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Masuk sebagai Panitia / Administrator
            </button>
          </div>
        </div>

        {/* Security Assurance */}
        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Sistem Pemilihan Terenkripsi & Menjamin Kerahasiaan Hak Suara</span>
        </div>
      </div>
    </div>
  );
};
