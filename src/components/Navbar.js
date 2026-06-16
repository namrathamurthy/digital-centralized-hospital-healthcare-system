'use client';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut, LayoutDashboard, Terminal } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between font-sans">
      <Link href="/" className="flex items-center gap-3 cursor-pointer">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-zinc-950 font-extrabold shadow-md shadow-teal-500/10">
          <Activity size={20} className="stroke-[2.5]" />
        </div>
        <div>
          <span className="text-lg font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent tracking-wide block">
            SmartCare
          </span>
          <span className="text-[9px] text-teal-400 font-mono font-bold block -mt-0.5 leading-none">
            ECOSYSTEM V3
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-6">
        {user ? (
          <>
            <Link
              href={`/${user.role}-dashboard`}
              className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors text-sm font-semibold"
            >
              <LayoutDashboard size={14} />
              Dashboard
            </Link>

            {user.role !== 'patient' && (
              <Link
                href="/system-logs"
                className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors text-sm font-semibold"
              >
                <Terminal size={14} />
                Audit Logs
              </Link>
            )}

            <div className="hidden sm:flex flex-col items-end leading-none border-l border-zinc-800 pl-4">
              <span className="text-xs font-bold text-zinc-100">{user.name}</span>
              <span className="text-[10px] text-teal-400 capitalize mt-0.5 font-bold">{user.role}</span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 active:scale-[0.98] transition-all text-xs font-bold text-zinc-400 hover:text-red-400 cursor-pointer"
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-zinc-300 hover:text-white text-sm font-semibold transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 active:scale-[0.98] text-zinc-950 text-sm font-bold tracking-wide transition-all shadow-md shadow-teal-500/10 cursor-pointer"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
