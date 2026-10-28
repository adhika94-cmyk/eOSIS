import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { LogOut, Vote, Menu, ShieldCheck, Clock, UserCheck } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, title }) => {
  const { role, student, admin, settings, logout } = useAuth();

  const getStatusBadge = () => {
    if (!settings) return null;
    const now = new Date();
    const starts = new Date(settings.starts_at);
    const ends = new Date(settings.ends_at);

    if (settings.election_status !== 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          Pemilihan Ditutup
        </span>
      );
    }

    if (now < starts) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5" />
          Segera Dibuka
        </span>
      );
    }

    if (now > ends) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          Waktu Berakhir
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Pemilihan Aktif
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {role === 'admin' && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden transition"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                  eOSIS
                </h1>
                <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {settings?.school_name || 'SMP NEGERI 2 BOGOR'}
                </span>
              </div>
              {title && (
                <p className="text-xs text-slate-500 font-medium sm:hidden">
                  {title}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge()}

          {role === 'student' && student && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {student.full_name}
                </p>
                <p className="text-[11px] text-slate-500">
                  Kelas {student.class_name} • NISN {student.nisn_masked}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                <UserCheck className="w-4 h-4" />
              </div>
              <button
                onClick={logout}
                title="Keluar"
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {role === 'admin' && admin && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {admin.display_name}
                </p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 justify-end">
                  <ShieldCheck className="w-3 h-3 text-blue-600 inline" />
                  Administrator
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                A
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
