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

  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  const demoAccounts = [
    { label: 'Patient', email: 'patient@smartcare.com' },
    { label: 'Doctor', email: 'doctor@smartcare.com' },
    { label: 'Reception', email: 'receptionist@smartcare.com' },
    { label: 'Billing', email: 'billing@smartcare.com' },
    { label: 'Lab Tech', email: 'lab@smartcare.com' },
    { label: 'Pharmacy', email: 'pharmacy@smartcare.com' }
  ];

  return (
    <div className="flex flex-col flex-1 items-center justify-center py-12 px-6 bg-[#07090e] font-sans">
      <div className="w-full max-w-md border border-zinc-800 bg-zinc-950/40 p-8 rounded-2xl shadow-xl glass-panel relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-12 -left-12 h-24 w-24 rounded-full bg-teal-500/10 blur-2xl"></div>

        <div className="flex flex-col items-center mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-zinc-950 font-bold mb-3 shadow-md shadow-teal-500/10">
            <Activity size={20} className="stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Sign In to SmartCare</h1>
          <p className="text-zinc-500 text-xs mt-1">Access your hospital portal</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded-lg font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-zinc-600" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5">
              Secret Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 text-zinc-600" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={btnLoading}
            className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 active:scale-[0.98] transition-all font-bold text-zinc-950 rounded-lg shadow-md shadow-teal-500/10 cursor-pointer text-sm"
          >
            {btnLoading ? 'Signing In...' : 'Access Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Don't have an account?{' '}
          <Link href="/register" className="text-teal-400 hover:underline">
            Register as a patient
          </Link>
        </p>

        {/* Quick Demo Logins Section */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-teal-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles size={12} />
            Quick Demo Logins
          </div>
          <div className="grid grid-cols-3 gap-2">
            {demoAccounts.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickLogin(item.email)}
                className="py-1.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 transition-all cursor-pointer active:scale-95"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
