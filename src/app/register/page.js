'use client';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, KeyRound, Activity, Building2, DoorOpen } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [department, setDepartment] = useState('General Medicine');
  const [hospital, setHospital] = useState('SmartCare Main Hospital');
  const [cabin, setCabin] = useState('101');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    const payload = { name, email, password, role };
    if (role === 'doctor') {
      payload.department = department;
      payload.hospital = hospital;
      payload.cabin = cabin;
    }

    const res = await register(payload);
    setLoading(false);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } else {
      setError(res.error || 'Registration failed');
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center py-12 px-6 bg-[#07090e] font-sans">
      <div className="w-full max-w-md border border-zinc-800 bg-zinc-950/40 p-8 rounded-2xl shadow-xl glass-panel relative overflow-hidden">
        <div className="absolute -top-12 -left-12 h-24 w-24 rounded-full bg-teal-500/10 blur-2xl"></div>

        <div className="flex flex-col items-center mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-zinc-950 font-bold mb-3 shadow-md shadow-teal-500/10">
            <Activity size={20} className="stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Register Account</h1>
          <p className="text-zinc-500 text-xs mt-1">Join the SmartCare network</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded-lg font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg font-semibold">
            Registration successful! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-zinc-600" size={16} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">
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
            <label className="block text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">
              Secret Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 text-zinc-600" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">
              Choose System Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-white text-sm focus:outline-none focus:border-teal-500 transition-colors cursor-pointer"
            >
              <option value="patient">Patient Portal</option>
              <option value="doctor">Medical Doctor</option>
              <option value="receptionist">Receptionist staff</option>
              <option value="billing">Billing coordinator</option>
              <option value="lab">Lab Technician</option>
              <option value="pharmacy">Pharmacist staff</option>
            </select>
          </div>

          {role === 'doctor' && (
            <div className="flex flex-col gap-3 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 animate-fadeIn duration-200">
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">
                  Hospital Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 text-zinc-600" size={14} />
                  <input
                    type="text"
                    required
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    placeholder="e.g. SmartCare Neuro Center"
                    className="w-full pl-9 pr-3 py-2 rounded border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">
                    Department
                  </label>
                  <div className="relative">
                    <Activity className="absolute left-3 top-3 text-zinc-600" size={14} />
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Cardiology"
                      className="w-full pl-9 pr-3 py-2 rounded border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">
                    Cabin Number
                  </label>
                  <div className="relative">
                    <DoorOpen className="absolute left-3 top-3 text-zinc-600" size={14} />
                    <input
                      type="text"
                      required
                      value={cabin}
                      onChange={(e) => setCabin(e.target.value)}
                      placeholder="e.g. 203"
                      className="w-full pl-9 pr-3 py-2 rounded border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 active:scale-[0.98] transition-all font-bold text-zinc-950 rounded-lg shadow-md shadow-teal-500/10 cursor-pointer text-sm"
          >
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="text-teal-400 hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
