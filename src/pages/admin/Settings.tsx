import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import type { ElectionSettings, ElectionState } from '../../types/index.ts';
import {
  Settings as SettingsIcon,
  School,
  Calendar,
  Lock,
  Database,
  Save,
  CheckCircle2,
  ShieldAlert,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { showToast, refreshSettings } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'period' | 'admin' | 'database'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // General Settings state
  const [schoolName, setSchoolName] = useState('');
  const [schoolLogo, setSchoolLogo] = useState('');
  const [electionName, setElectionName] = useState('');

  // Period Settings state
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [electionStatus, setElectionStatus] = useState<ElectionState>('active');
  const [publishResults, setPublishResults] = useState(true);

  // Admin Credentials state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [credLoading, setCredLoading] = useState(false);
  const [credError, setCredError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getSettings();
        setSchoolName(data.school_name);
        setSchoolLogo(data.school_logo_path || '');
        setElectionName(data.election_name);
        setStartsAt(data.starts_at.slice(0, 16));
        setEndsAt(data.ends_at.slice(0, 16));
        setElectionStatus(data.election_status);
        setPublishResults(data.publish_results);
      } catch (err: any) {
        showToast(err.message || 'Gagal memuat pengaturan', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showToast]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings({
        school_name: schoolName.trim(),
        school_logo_path: schoolLogo.trim(),
        election_name: electionName.trim(),
      });
      await refreshSettings();
      showToast('Identitas sekolah berhasil diperbarui.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan pengaturan.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(endsAt) <= new Date(startsAt)) {
      showToast('Waktu selesai harus lebih besar dari waktu mulai.', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.updateSettings({
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        election_status: electionStatus,
        publish_results: publishResults,
      });
      await refreshSettings();
      showToast('Periode dan jadwal pemilihan berhasil diperbarui.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan periode.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredError('');

    if (!currentPassword) {
      setCredError('Password saat ini wajib diisi.');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setCredError('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setCredError('Konfirmasi password tidak cocok.');
      return;
    }

    setCredLoading(true);
    try {
      await api.updateAdminCredentials(currentPassword, newUsername || undefined, newPassword || undefined);
      showToast('Kredensial admin berhasil diperbarui!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setCredError(err.message || 'Gagal memperbarui kredensial.');
    } finally {
      setCredLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold">Memuat konfigurasi sistem...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-blue-600" />
          <span>Pengaturan Sistem eOSIS</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Atur identitas sekolah, periode pemungutan suara, akun administrator, dan skema Supabase
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 whitespace-nowrap transition ${
            activeTab === 'general'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Identitas Sekolah</span>
        </button>

        <button
          onClick={() => setActiveTab('period')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 whitespace-nowrap transition ${
            activeTab === 'period'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Periode & Status Pemilihan</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 whitespace-nowrap transition ${
            activeTab === 'admin'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Keamanan Admin</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 whitespace-nowrap transition ${
            activeTab === 'database'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database & Supabase RLS</span>
        </button>
      </div>

      {/* Tab 1: General School Identity */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Identitas Sekolah & Aplikasi</h3>
            <p className="text-xs text-slate-500">
              Nama sekolah dan logo akan ditampilkan di bilik suara siswa dan lembar rekapitulasi resmi
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Sekolah Resmi
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Agenda Pemilihan
            </label>
            <input
              type="text"
              value={electionName}
              onChange={(e) => setElectionName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              URL Logo Sekolah (Supabase Storage / Web)
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={schoolLogo}
                onChange={(e) => setSchoolLogo(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              {schoolLogo && (
                <img
                  src={schoolLogo}
                  alt="Logo"
                  className="w-10 h-10 rounded-xl object-contain border p-1 bg-white"
                  onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                />
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Period & Status */}
      {activeTab === 'period' && (
        <form onSubmit={handleSavePeriod} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Periode & Kebijakan Pemilihan</h3>
            <p className="text-xs text-slate-500">
              Waktu menggunakan zona waktu <b>Asia/Jakarta (WIB)</b> dan divalidasi ketat oleh server
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tanggal & Waktu Mulai (Buka TPS)
              </label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tanggal & Waktu Selesai (Tutup TPS)
              </label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Status Operasional Pemilihan
            </label>
            <select
              value={electionStatus}
              onChange={(e) => setElectionStatus(e.target.value as ElectionState)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="active">🟢 Aktif (Siswa dapat memberikan suara bila jadwal sesuai)</option>
              <option value="paused">🟡 Ditunda Sementara (Bilik suara ditutup sementara)</option>
              <option value="closed">🔴 Ditutup Resmi (Pemilihan berakhir)</option>
              <option value="draft">⚪ Draf (Hanya persiapan data)</option>
            </select>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">Publikasikan Hasil ke Siswa</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Jika diaktifkan, hasil persentase perolehan suara dapat dilihat oleh siswa setelah pemilihan selesai
              </p>
            </div>
            <input
              type="checkbox"
              id="pubToggle"
              checked={publishResults}
              onChange={(e) => setPublishResults(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Perbarui Jadwal & Status'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Admin Credentials */}
      {activeTab === 'admin' && (
        <form onSubmit={handleSaveCredentials} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5 max-w-xl">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Keamanan Akun Administrator</h3>
            <p className="text-xs text-slate-500">
              Ganti username atau password admin. Perubahan membutuhkan verifikasi password lama.
            </p>
          </div>

          {credError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{credError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password Saat Ini (Wajib)
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Masukkan password admin saat ini"
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username Baru (Opsional)
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Kosongkan jika tidak ingin mengubah username"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password Baru (Opsional)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {newPassword && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={credLoading}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{credLoading ? 'Menyimpan...' : 'Perbarui Kredensial Admin'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Database & Supabase Info */}
      {activeTab === 'database' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Skema Supabase & Keamanan Database</h3>
            <p className="text-xs text-slate-500">
              Spesifikasi lengkap tabel relasional, PostgreSQL RPC, Row Level Security (RLS), dan integritas data
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Tabel Database (UUID Primary Keys):
              </span>
              <ul className="list-disc pl-5 text-slate-600 space-y-1 font-mono text-[11px]">
                <li><b>classes</b>: id, name, grade, is_active</li>
                <li><b>students</b>: id, nisn (unique), full_name, birth_date, class_id</li>
                <li><b>candidates</b>: id, ballot_number (unique), chair_name, vice_chair_name, vision, mission</li>
                <li><b>election_settings</b>: id, school_name, starts_at, ends_at, election_status</li>
                <li><b>voter_participation</b>: election_id, student_id, cast_at (NO candidate link!)</li>
                <li><b>election_tallies</b>: election_id, candidate_id, vote_count</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Integritas & Keamanan Voting:
              </span>
              <ul className="list-disc pl-5 text-slate-600 space-y-1 text-xs">
                <li><b>Fungsi RPC Atomik</b>: cast_vote() mengeksekusi penulisan voter_participation dan increment tallies dalam 1 transaksi.</li>
                <li><b>Anti-Double Voting</b>: Constraint UNIQUE(election_id, student_id) dan database lock menjamin 1 siswa hanya 1 suara sah.</li>
                <li><b>Kerahasiaan Pemilihan</b>: Tidak ada relasi foreign key antara identitas siswa dan kandidat pilihan.</li>
                <li><b>RLS</b>: Akses baca tabel siswa diproteksi, siswa hanya dapat mengakses token terverifikasi.</li>
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
            <p className="font-bold mb-1">Lokasi File Migration Supabase:</p>
            <p className="font-mono text-[11px] bg-white p-2 rounded-lg border border-blue-200 text-blue-800">
              /supabase/migrations/20261028_eosis_init.sql & /supabase/seed.sql
            </p>
            <p className="mt-2 text-slate-600">
              File migration telah disiapkan secara lengkap dan dapat dijalankan langsung di Supabase SQL Editor untuk deployment multi-sekolah atau lingkungan produksi.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
