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
    <div className="flex flex-col flex-1 items-center justify-center py-12 px-6 font-sans">
      <div className="w-full max-w-md border border-slate-200 bg-white/90 p-8 rounded-2xl shadow-lg backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -top-12 -left-12 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl"></div>

        <div className="flex flex-col items-center mb-6 relative z-10">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold mb-3 shadow-md shadow-blue-500/20">
            <Activity size={20} className="stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-wide">Register Account</h1>
          <p className="text-slate-500 text-xs mt-1">Join the SmartCare network</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg font-medium relative z-10">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg font-semibold relative z-10">
            Registration successful! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400" size={16} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
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
            <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
              Secret Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 text-slate-400" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
              Choose System Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
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
            <div className="flex flex-col gap-3 p-4 rounded-lg bg-slate-50/80 border border-slate-200 animate-fadeIn duration-200">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                  Hospital Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 text-slate-400" size={14} />
                  <input
                    type="text"
                    required
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    placeholder="e.g. SmartCare Neuro Center"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                    Department
                  </label>
                  <div className="relative">
                    <Activity className="absolute left-3 top-3 text-slate-400" size={14} />
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Cardiology"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                    Cabin Number
                  </label>
                  <div className="relative">
                    <DoorOpen className="absolute left-3 top-3 text-slate-400" size={14} />
                    <input
                      type="text"
                      required
                      value={cabin}
                      onChange={(e) => setCabin(e.target.value)}
                      placeholder="e.g. 203"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all font-bold text-white rounded-lg shadow-md shadow-blue-500/20 cursor-pointer text-sm"
          >
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500 relative z-10">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
