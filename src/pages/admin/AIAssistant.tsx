import React, { useState } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  BrainCircuit,
  Sparkles,
  Send,
  Copy,
  Check,
  HelpCircle,
  Lightbulb,
  FileQuestion,
  Scale,
} from 'lucide-react';

export const AIAssistant: React.FC = () => {
  const { showToast } = useAuth();
  const [queryType, setQueryType] = useState<'comparative_analysis' | 'debate_questions' | 'custom'>('comparative_analysis');
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (selectedType?: 'comparative_analysis' | 'debate_questions' | 'custom') => {
    const typeToUse = selectedType || queryType;
    if (typeToUse === 'custom' && !customPrompt.trim()) {
      showToast('Silakan ketikkan pertanyaan atau topik analisis terlebih dahulu.', 'error');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const analysis = await api.analyzeWithAI(typeToUse, customPrompt);
      setResult(analysis);
      showToast('Analisis AI berhasil diproses!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menghasilkan analisis AI.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    showToast('Teks analisis disalin ke clipboard.', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-2">
            <BrainCircuit className="w-4 h-4 text-indigo-600" />
            <span>Gemini AI with High Thinking Mode</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Asisten AI Kepemimpinan & Debat OSIS
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gunakan penalaran mendalam (high thinking) untuk menganalisis manifesto calon dan menyusun pertanyaan debat resmi
          </p>
        </div>
      </div>

      {/* Preset Quick Prompts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => {
            setQueryType('comparative_analysis');
            handleGenerate('comparative_analysis');
          }}
          disabled={loading}
          className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
            queryType === 'comparative_analysis'
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/80 hover:border-blue-200 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2 text-blue-700 font-bold text-xs mb-2">
            <Scale className="w-4 h-4" />
            <span>Analisis Komparatif Visi & Misi</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Perbandingan komparatif dan konstruktif terhadap kelebihan masing-masing calon kandidat.
          </p>
        </button>

        <button
          onClick={() => {
            setQueryType('debate_questions');
            handleGenerate('debate_questions');
          }}
          disabled={loading}
          className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
            queryType === 'debate_questions'
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200/80 hover:border-indigo-200 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs mb-2">
            <FileQuestion className="w-4 h-4" />
            <span>Daftar Pertanyaan Debat Terbuka</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Menyusun 6 pertanyaan studi kasus kepemimpinan, teknologi, anti-bullying, dan lingkungan.
          </p>
        </button>

        <button
          onClick={() => setQueryType('custom')}
          className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
            queryType === 'custom'
              ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20'
              : 'bg-white border-slate-200/80 hover:border-purple-200 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2 text-purple-700 font-bold text-xs mb-2">
            <Lightbulb className="w-4 h-4" />
            <span>Pertanyaan Analisis Kustom</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tanyakan analisis khusus atau ide program kerja sesuai kebutuhan sekolah.
          </p>
        </button>
      </div>

      {/* Custom prompt input when custom is selected */}
      {queryType === 'custom' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Tuliskan Instruksi atau Pertanyaan Khusus untuk AI:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Contoh: Buatkan pidato pembukaan ketua panitia pemilihan OSIS..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate('custom')}
            />
            <button
              onClick={() => handleGenerate('custom')}
              disabled={loading || !customPrompt.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Analisis</span>
            </button>
          </div>
        </div>
      )}

      {/* Result Display Box */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Hasil Penalaran AI (Thinking Output)</h3>
              <p className="text-[11px] text-slate-500">
                Didukung oleh model penalaran Google Gemini berkecepatan tinggi
              </p>
            </div>
          </div>

          {result && (
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>
          )}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-700">Gemini sedang menalar secara mendalam...</p>
              <p className="text-[11px] text-slate-400">
                Mengkaji seluruh visi, misi, dan slogan calon pasangan OSIS
              </p>
            </div>
          ) : result ? (
            <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
              {result}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <HelpCircle className="w-10 h-10 mx-auto opacity-30 text-indigo-600" />
              <p className="text-xs font-semibold text-slate-600">
                Pilih salah satu tombol analisis di atas untuk memulai
              </p>
              <p className="text-[11px] text-slate-400">
                Hasil analisis dapat digunakan sebagai bahan debat atau penyusunan materi publikasi panitia
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
