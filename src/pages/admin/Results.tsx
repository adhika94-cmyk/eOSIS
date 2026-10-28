import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import type { ElectionStats } from '../../types/index.ts';
import { VoteBarChart } from '../../components/common/VoteBarChart.tsx';
import {
  BarChart3,
  RefreshCw,
  Printer,
  Users,
  Percent,
  CheckCircle2,
  Trophy,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';

export const Results: React.FC = () => {
  const { showToast } = useAuth();
  const [stats, setStats] = useState<ElectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchResults = useCallback(async (isManual: boolean = false) => {
    try {
      if (isManual) setRefreshing(true);
      const data = await api.getStats();
      setStats(data);
      if (isManual) showToast('Hasil suara berhasil dimutakhirkan.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengambil data perolehan suara.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchResults();
    const interval = setInterval(() => {
      fetchResults();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchResults]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !stats) {
    return (
      <div className="p-16 text-center text-slate-400">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold">Memuat rekapitulasi perolehan suara...</p>
      </div>
    );
  }

  const sortedCandidates = [...stats.candidates_tally].sort((a, b) => b.vote_count - a.vote_count);
  const winner = sortedCandidates.length > 0 && stats.total_valid_votes > 0 ? sortedCandidates[0] : null;

  return (
    <div className="space-y-8">
      {/* Printable Official Header (Only shown during print) */}
      <div className="hidden print:block text-center pb-6 border-b-2 border-slate-900 mb-6">
        <h1 className="text-xl font-black uppercase tracking-wider">
          BERITA ACARA REKAPITULASI HASIL PEMILIHAN KETUA & WAKIL KETUA OSIS
        </h1>
        <h2 className="text-base font-bold mt-1">{stats.settings.school_name}</h2>
        <p className="text-xs text-slate-600 mt-1">
          {stats.settings.election_name} • Dicetak pada: {new Date().toLocaleString('id-ID')}
        </p>
      </div>

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span>Perolehan Suara & Rekapitulasi</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Hasil penghitungan suara masuk secara live, transparan, dan terverifikasi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Cetak Berita Acara</span>
          </button>

          <button
            onClick={() => fetchResults(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Muat Ulang Suara</span>
          </button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Suara Sah Masuk
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3">
            {stats.total_valid_votes} <span className="text-sm font-semibold text-slate-500">suara</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Dari total {stats.total_students} siswa pemilih terdaftar
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Partisipasi Pemilih
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-700 mt-3">
            {stats.participation_rate}%
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {stats.voted_count} siswa sudah memberikan suara
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Status Penghitungan
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-base font-extrabold text-slate-900 mt-3 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Akumulasi Real-Time
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Pembaruan terakhir: {new Date(stats.last_updated).toLocaleTimeString('id-ID')}
          </p>
        </div>
      </div>

      {/* Winner Spotlight Banner if votes exist */}
      {winner && winner.vote_count > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-[#0B192C] text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center font-black text-2xl shrink-0 shadow-lg border-2 border-white/20">
              <Trophy className="w-8 h-8 text-amber-950" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30 text-[11px] font-bold uppercase tracking-wider">
                Suara Terbanyak Sementara (Peringkat 1)
              </span>
              <h3 className="text-xl font-extrabold mt-1">
                No. {winner.ballot_number} — {winner.chair_name} & {winner.vice_chair_name}
              </h3>
              {winner.slogan && (
                <p className="text-xs text-slate-300 italic mt-0.5">"{winner.slogan}"</p>
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 text-center border border-white/10 shrink-0">
            <span className="text-3xl font-black text-amber-300">{winner.percentage}%</span>
            <p className="text-xs text-slate-300 mt-0.5">{winner.vote_count} Suara Masuk</p>
          </div>
        </div>
      )}

      {/* Bar Chart Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100">
          Grafik Persentase Perolehan Suara
        </h3>
        <VoteBarChart
          candidates={stats.candidates_tally}
          totalVotes={stats.total_valid_votes}
        />
      </div>

      {/* Tabular Results */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">
            Tabel Rekapitulasi Suara Per Pasangan Calon
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Data terurut berdasarkan perolehan suara terbanyak
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Peringkat</th>
                <th className="py-3.5 px-6">No. Urut</th>
                <th className="py-3.5 px-6">Pasangan Calon (Ketua & Wakil)</th>
                <th className="py-3.5 px-6 text-right">Jumlah Suara</th>
                <th className="py-3.5 px-6 text-right">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {sortedCandidates.map((c, index) => (
                <tr key={c.candidate_id} className="hover:bg-slate-50/60 transition">
                  <td className="py-4 px-6 font-bold text-slate-900">
                    <span
                      className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                        index === 0
                          ? 'bg-amber-100 text-amber-800'
                          : index === 1
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold inline-flex items-center justify-center text-xs shadow-xs">
                      {c.ballot_number}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={c.photo_path}
                        alt={c.chair_name}
                        className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200"
                      />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{c.chair_name}</p>
                        <p className="text-xs text-slate-500">& {c.vice_chair_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right font-extrabold text-sm text-slate-900">
                    {c.vote_count} suara
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="inline-block px-3 py-1 rounded-full font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200">
                      {c.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-800">
              <tr>
                <td colSpan={3} className="py-4 px-6 uppercase tracking-wider text-xs">
                  Total Seluruh Suara Sah Masuk
                </td>
                <td className="py-4 px-6 text-right text-sm">
                  {stats.total_valid_votes} suara
                </td>
                <td className="py-4 px-6 text-right text-sm">
                  {stats.total_valid_votes > 0 ? '100%' : '0%'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Privacy Guarantee Note */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <b>Prinsip Kerahasiaan Pemilihan:</b> Sesuai standar eOSIS dan asas LUBER (Langsung, Umum, Bebas, Rahasia), database memisahkan status partisipasi siswa dengan pilihan kandidat. Administrator sekolah dapat memantau perolehan total suara dan daftar siapa yang sudah/belum memilih, namun tidak memiliki akses teknis untuk mengaitkan identitas siswa dengan pilihan kandidat tertentu.
        </div>
      </div>

      {/* Signature Area for Printing */}
      <div className="hidden print:grid grid-cols-2 pt-12 text-center text-xs text-slate-800">
        <div>
          <p>Mengetahui,</p>
          <p className="font-bold mt-1">Kepala Sekolah / Pembina OSIS</p>
          <div className="h-20" />
          <p className="font-bold underline">(...................................................)</p>
          <p className="text-[10px] text-slate-500">NIP. ................................................</p>
        </div>

        <div>
          <p>Bogor, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p className="font-bold mt-1">Ketua Panitia Pemilihan OSIS</p>
          <div className="h-20" />
          <p className="font-bold underline">(...................................................)</p>
          <p className="text-[10px] text-slate-500">NISN. ................................................</p>
        </div>
      </div>
    </div>
  );
};
