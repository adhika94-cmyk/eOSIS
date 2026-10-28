import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, ShieldCheck, Heart } from 'lucide-react';

interface VoteSuccessProps {
  onComplete: () => void;
}

export const VoteSuccess: React.FC<VoteSuccessProps> = ({ onComplete }) => {
  const [secondsLeft, setSecondsLeft] = useState(4);

  useEffect(() => {
    // Launch celebratory confetti burst
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#10b981', '#f59e0b', '#6366f1'],
      });
    } catch (e) {
      // Ignore if confetti not supported
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete]);

  const progressPercentage = ((4 - secondsLeft) / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B192C] via-[#0F284E] to-[#0A1829] flex flex-col items-center justify-center px-4 py-8 text-center">
      <div className="relative max-w-lg w-full bg-white/95 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
        {/* Animated Check Icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20 animate-bounce">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        {/* Required Prompt Text */}
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-snug">
          Suara Anda berhasil dicatat, terima kasih telah berpartisipasi
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
          Hak suara Anda telah tersimpan secara anonim dan aman di dalam database eOSIS. Sesi Anda akan otomatis ditutup demi menjaga integritas dan kerahasiaan pemilihan.
        </p>

        {/* Security badge */}
        <div className="my-6 py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Transaksi Hak Suara Terverifikasi & Anonim</span>
        </div>

        {/* 4-second Countdown Bar */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Mengalihkan ke halaman login...</span>
            <span className="font-bold text-slate-800">{secondsLeft} detik</span>
          </div>

          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1">
          <span>Dibuat dengan rasa bangga untuk OSIS</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
        </div>
      </div>
    </div>
  );
};
