'use client';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import axios from 'axios';
import { 
  Activity, Users, User, ShieldAlert, HeartHandshake, Stethoscope, 
  Receipt, Beaker, Pill, AlertTriangle, ChevronRight, CheckCircle2 
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [sosSymptoms, setSosSymptoms] = useState('');
  const [sosLocation, setSosLocation] = useState('Main Reception');
  const [sosSuccess, setSosSuccess] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);

  const handleSOSTrigger = async (e) => {
    e.preventDefault();
    if (!sosSymptoms) return;
    setSosLoading(true);
    try {
      await axios.post('/api/sos/trigger', {
        symptoms: sosSymptoms,
        location: sosLocation,
        patientName: user ? user.name : 'Guest Emergency Patient'
      });
      setSosSuccess(true);
      setSosSymptoms('');
      setTimeout(() => setSosSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to trigger SOS alert.');
    } finally {
      setSosLoading(false);
    }
  };

  const roles = [
    {
      title: 'Patient Portal',
      description: 'AI symptom checker, real-time token tracking, and billing payment.',
      role: 'patient',
      color: 'from-emerald-500/20 to-teal-500/5',
      borderColor: 'group-hover:border-emerald-500/40',
      icon: <User className="text-emerald-400" size={24} />
    },
    {
      title: 'Doctor Panel',
      description: 'Call next patient, room token serving, prescription & scan orders.',
      role: 'doctor',
      color: 'from-teal-500/20 to-cyan-500/5',
      borderColor: 'group-hover:border-teal-500/40',
      icon: <Stethoscope className="text-teal-400" size={24} />
    },
    {
      title: 'Reception Board',
      description: 'Doctor check-ins, walk-in ticket printing, queue prioritization.',
      role: 'receptionist',
      color: 'from-blue-500/20 to-indigo-500/5',
      borderColor: 'group-hover:border-blue-500/40',
      icon: <Users className="text-blue-400" size={24} />
    },
    {
      title: 'Billing Terminal',
      description: 'Invoice verification, cash/card/UPI mock payments ledger.',
      role: 'billing',
      color: 'from-amber-500/20 to-yellow-500/5',
      borderColor: 'group-hover:border-amber-500/40',
      icon: <Receipt className="text-amber-400" size={24} />
    },
    {
      title: 'Laboratory Hub',
      description: 'Scan report templates, pathology files, technician uploads.',
      role: 'lab',
      color: 'from-purple-500/20 to-fuchsia-500/5',
      borderColor: 'group-hover:border-purple-500/40',
      icon: <Beaker className="text-purple-400" size={24} />
    },
    {
      title: 'Pharmacy Dispatch',
      description: 'Prescription dispensing, medication packing status telemetry.',
      role: 'pharmacy',
      color: 'from-rose-500/20 to-pink-500/5',
      borderColor: 'group-hover:border-rose-500/40',
      icon: <Pill className="text-rose-400" size={24} />
    }
  ];

  return (
    <div className="flex flex-col flex-1 items-center justify-start py-12 px-6 max-w-7xl mx-auto w-full font-sans">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mt-8 mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/20 text-teal-400 text-xs font-mono font-semibold mb-6">
          <Activity size={14} className="animate-pulse" />
          SYSTEM LIVE & OPERATIONAL
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          SmartCare Hospital <br />
          <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-500 bg-clip-text text-transparent">
            Management Ecosystem
          </span>
        </h1>
        <p className="mt-6 text-base md:text-lg text-zinc-400 leading-relaxed">
          A brand new, fully integrated Next.js hospital suite powered by Gemini AI triage, 
          real-time queue syncing, and localized offline database proxies. Seamless coordination 
          across 6 operational roles.
        </p>

        {user ? (
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link
              href={`/${user.role}-dashboard`}
              className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2 cursor-pointer"
            >
              Go to Your Dashboard
              <ChevronRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link
              href="/register"
              className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20 cursor-pointer"
            >
              Initialize Workspace
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 font-bold rounded-xl transition-all cursor-pointer"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>

      {/* Role Navigation Grid */}
      <div className="w-full mb-20">
        <div className="flex flex-col items-center mb-10 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Choose Your Access Portal</h2>
          <p className="text-zinc-500 text-sm mt-2">Log in or register an account to interact with specific dashboards</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((item, idx) => (
            <Link 
              key={idx} 
              href={user ? `/${item.role}-dashboard` : '/login'}
              className="group"
            >
              <div className={`h-full border border-zinc-800/80 bg-zinc-900/10 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:bg-gradient-to-br ${item.color} ${item.borderColor} glass-panel relative flex flex-col justify-between`}>
                <div>
                  <div className="p-3 bg-zinc-950 rounded-xl w-fit mb-4 border border-zinc-800/60">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-teal-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1 text-xs text-teal-500 font-semibold group-hover:underline">
                  Access Portal
                  <ChevronRight size={12} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Urgent Emergency Test Tool */}
      <div className="w-full max-w-4xl border border-red-500/20 bg-red-950/5 rounded-3xl p-6 md:p-10 glass-panel relative overflow-hidden mb-12">
        <div className="absolute top-0 right-0 p-8 text-red-500/10 pointer-events-none hidden md:block">
          <ShieldAlert size={128} />
        </div>
        
        <div className="max-w-xl">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm tracking-wide uppercase mb-3">
            <AlertTriangle size={16} />
            Ecosystem SOS Telemetry Test
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Trigger Emergency Alarm
          </h2>
          <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
            Submit mock acute cardiac or respiratory distress symptoms. This broadcasts a real-time 
            alarm that instantly flashes all operational dashboards red, plays sirens, and queues 
            an emergency ticket.
          </p>

          {sosSuccess ? (
            <div className="mt-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 size={18} />
              SOS Broadcast Dispatched. All active dashboards are now flashing alert.
            </div>
          ) : (
            <form onSubmit={handleSOSTrigger} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2">
                  Emergency Symptoms / Complications
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chest pain radiating to left arm, severe shortness of breath"
                  value={sosSymptoms}
                  onChange={(e) => setSosSymptoms(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2">
                    Patient Ward / Location
                  </label>
                  <select
                    value={sosLocation}
                    onChange={(e) => setSosLocation(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 text-white focus:outline-none focus:border-red-500 text-sm"
                  >
                    <option value="Main Reception Desk">Main Reception Desk</option>
                    <option value="Cardiology Waiting Area">Cardiology Waiting Area</option>
                    <option value="Outpatient Ward Block A">Outpatient Ward Block A</option>
                    <option value="Pharmacy Counter 2">Pharmacy Counter 2</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={sosLoading}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 active:scale-[0.98] transition-all font-bold text-white rounded-xl shadow-lg shadow-red-600/20 cursor-pointer text-sm"
                  >
                    {sosLoading ? 'Broadcasting...' : 'Trigger Global SOS'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
