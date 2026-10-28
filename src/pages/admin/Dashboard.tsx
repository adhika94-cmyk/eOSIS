import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import type { ElectionStats } from '../../types/index.ts';
import { StatCard } from '../../components/common/StatCard.tsx';
import { VoteBarChart } from '../../components/common/VoteBarChart.tsx';
import { AdminTab } from '../../components/common/AdminSidebar.tsx';
import {
  Users,
  GraduationCap,
  Award,
  CheckCircle2,
  Clock,
  Percent,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Calendar,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: AdminTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { showToast } = useAuth();
  const [stats, setStats] = useState<ElectionStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchStats = useCallback(async (isManual: boolean = false) => {
    try {
      if (isManual) setRefreshing(true);
      const data = await api.getStats();
      setStats(data);
      if (isManual) showToast('Data statistik berhasil diperbarui.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat statistik.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchStats();
    // Auto refresh every 20 seconds for live monitoring
    const interval = setInterval(() => {
      fetchStats();
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-1/4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Beranda & Statistik Pemilihan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Ringkasan kehadiran pemilih dan rekapitulasi suara secara real-time
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden md:inline">
            Terakhir diperbarui: {new Date(stats.last_updated).toLocaleTimeString('id-ID')}
          </span>

          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* 6 Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          title="Total Siswa Terdaftar"
          value={stats.total_students}
          subtitle="Siswa dengan status hak pilih aktif"
          icon={Users}
          colorScheme="blue"
        />

        <StatCard
          title="Total Kelas"
          value={stats.total_classes}
          subtitle="Tingkat VII, VIII, dan IX"
          icon={GraduationCap}
          colorScheme="indigo"
        />

        <StatCard
          title="Pasangan Calon Aktif"
          value={stats.total_candidates}
          subtitle="Kandidat Ketua & Wakil Ketua OSIS"
          icon={Award}
          colorScheme="purple"
        />

        <StatCard
          title="Siswa Sudah Memilih"
          value={stats.voted_count}
          subtitle="Suara sah yang telah masuk"
          icon={CheckCircle2}
          colorScheme="emerald"
          badge={{ text: `${stats.participation_rate}%`, variant: 'success' }}
        />

        <StatCard
          title="Siswa Belum Memilih"
          value={stats.not_voted_count}
          subtitle="Siswa yang belum menggunakan hak pilih"
          icon={Clock}
          colorScheme="amber"
        />

        <StatCard
          title="Persentase Partisipasi"
          value={`${stats.participation_rate}%`}
          subtitle="Dari total kuota pemilih sah"
          icon={Percent}
          colorScheme="rose"
          badge={{
            text: stats.participation_rate >= 50 ? 'Memenuhi Kuorum' : 'Proses Berjalan',
            variant: stats.participation_rate >= 50 ? 'success' : 'warning',
          }}
        />
      </div>

      {/* Main Charts & Quick Action Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Vote Distribution Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Grafik Perolehan Suara Pasangan Calon
              </h3>
              <p className="text-xs text-slate-500">
                Total Suara Masuk: <b className="text-slate-800">{stats.total_valid_votes}</b> suara
              </p>
            </div>

            <button
              onClick={() => onNavigate('results')}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
            >
              <span>Laporan Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <VoteBarChart
            candidates={stats.candidates_tally}
            totalVotes={stats.total_valid_votes}
          />
        </div>

        {/* Right 1 Col: Quick Navigation & Election Timeline */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100">
              Aksi Cepat Panitia
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => onNavigate('students')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-semibold text-xs transition group border border-slate-100"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Kelola Siswa & Impor CSV</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                onClick={() => onNavigate('candidates')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-semibold text-xs transition group border border-slate-100"
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>Kelola Pasangan Calon</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                onClick={() => onNavigate('classes')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-purple-50 hover:text-purple-700 text-slate-700 font-semibold text-xs transition group border border-slate-100"
              >
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  <span>Daftar Kelas & Tingkat</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                onClick={() => onNavigate('ai-assistant')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-900 font-semibold text-xs transition group border border-indigo-100"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Asisten AI Debat & Visi-Misi</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition" />
              </button>
            </div>
          </div>

          {/* Election Schedule Card */}
          <div className="bg-gradient-to-br from-slate-900 to-[#0F284E] text-white rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>Periode Pemilihan</span>
            </div>

            <div className="text-xs space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span>Mulai:</span>
                <span className="font-semibold text-white">
                  {new Date(stats.settings.starts_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Selesai:</span>
                <span className="font-semibold text-white">
                  {new Date(stats.settings.ends_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-400">Publikasi Hasil:</span>
              <span className="font-bold text-emerald-400">
                {stats.settings.publish_results ? 'Terbuka Umum' : 'Khusus Admin'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
