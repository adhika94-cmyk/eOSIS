import React from 'react';
import type { CandidateTally } from '../../types/index.ts';
import { Award, Users } from 'lucide-react';

interface VoteBarChartProps {
  candidates: CandidateTally[];
  totalVotes: number;
}

export const VoteBarChart: React.FC<VoteBarChartProps> = ({ candidates, totalVotes }) => {
  const sorted = [...candidates].sort((a, b) => b.vote_count - a.vote_count);
  const maxVotes = Math.max(...candidates.map((c) => c.vote_count), 1);

  const colors = [
    { bar: 'bg-blue-600', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
    { bar: 'bg-indigo-600', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-800' },
    { bar: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
    { bar: 'bg-emerald-600', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
  ];

  if (candidates.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Belum ada kandidat aktif atau suara yang tercatat.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Leader banner */}
      {totalVotes > 0 && sorted[0].vote_count > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-blue-800 font-semibold uppercase tracking-wider">
                Perolehan Suara Tertinggi Sementara
              </p>
              <h5 className="text-sm font-bold text-slate-800">
                No. {sorted[0].ballot_number} — {sorted[0].chair_name} & {sorted[0].vice_chair_name}
              </h5>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-extrabold text-blue-700">
              {sorted[0].percentage}%
            </span>
            <p className="text-xs text-slate-500 font-medium">
              ({sorted[0].vote_count} suara)
            </p>
          </div>
        </div>
      )}

      {/* Candidate Bar rows */}
      <div className="space-y-5">
        {candidates.map((c, idx) => {
          const color = colors[idx % colors.length];
          const widthPercent = totalVotes > 0 ? (c.vote_count / maxVotes) * 100 : 0;

          return (
            <div key={c.candidate_id} className="group">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${color.badge}`}>
                    {c.ballot_number}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {c.chair_name} & {c.vice_chair_name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">
                    {c.vote_count} suara
                  </span>
                  <span className={`text-sm font-bold ${color.text}`}>
                    {c.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress bar container */}
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${color.bar}`}
                  style={{ width: `${Math.max(widthPercent, 0)}%` }}
                />
              </div>

              {c.slogan && (
                <p className="text-xs text-slate-400 italic mt-1 pl-8">
                  "{c.slogan}"
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
