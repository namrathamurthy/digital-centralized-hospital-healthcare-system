'use client';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut, LayoutDashboard, Terminal } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 flex items-center justify-between font-sans shadow-sm">
      <Link href="/" className="flex items-center gap-3 cursor-pointer">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-500/20">
          <Activity size={20} className="stroke-[2.5]" />
        </div>
        <div>
          <span className="text-lg font-bold text-slate-800 tracking-wide block">
            SmartCare
          </span>
          <span className="text-[9px] text-blue-600 font-mono font-bold block -mt-0.5 leading-none">
            ECOSYSTEM V3
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-6">
        {user ? (
          <>
            <Link
              href={`/${user.role}-dashboard`}
              className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition-colors text-sm font-semibold"
            >
              <LayoutDashboard size={14} />
              Dashboard
            </Link>

            {user.role !== 'patient' && (
              <Link
                href="/system-logs"
                className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition-colors text-sm font-semibold"
              >
                <Terminal size={14} />
                Audit Logs
              </Link>
            )}

            <div className="hidden sm:flex flex-col items-end leading-none border-l border-slate-200 pl-4">
              <span className="text-xs font-bold text-slate-800">{user.name}</span>
              <span className="text-[10px] text-blue-600 capitalize mt-0.5 font-bold">{user.role}</span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] transition-all text-xs font-bold text-slate-600 hover:text-red-600 cursor-pointer"
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-slate-600 hover:text-blue-600 text-sm font-semibold transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-sm font-bold tracking-wide transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
