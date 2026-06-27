'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, Mail, Sparkles, Activity } from 'lucide-react';

export default function Login() {
  const { user, login, loading } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [btnLoading, setBtnLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push(`/${user.role}-dashboard`);
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBtnLoading(true);
    
    const res = await login(email, password);
    setBtnLoading(false);
    if (!res.success) {
      setError(res.error || 'Login failed');
    }
  };



  return (
    <div className="flex flex-col flex-1 items-center justify-center py-12 px-6 font-sans">
      <div className="w-full max-w-md border border-slate-200 bg-white/90 p-8 rounded-2xl shadow-lg backdrop-blur-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-12 -left-12 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl"></div>

        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold mb-3 shadow-md shadow-blue-500/20">
            <Activity size={20} className="stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-wide">Sign In to SmartCare</h1>
          <p className="text-slate-500 text-xs mt-1">Access your hospital portal</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg font-medium relative z-10">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1.5">
              Secret Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 text-slate-400" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={btnLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all font-bold text-white rounded-lg shadow-md shadow-blue-500/20 cursor-pointer text-sm"
          >
            {btnLoading ? 'Signing In...' : 'Access Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500 relative z-10">
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-600 font-semibold hover:underline">
            Register as a patient
          </Link>
        </p>


      </div>
    </div>
  );
}
