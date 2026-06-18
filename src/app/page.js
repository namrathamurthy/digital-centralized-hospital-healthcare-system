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
      color: 'from-blue-500/10 to-blue-500/5',
      borderColor: 'group-hover:border-blue-500/30',
      iconBg: 'bg-blue-50',
      icon: <User className="text-blue-600" size={24} />
    },
    {
      title: 'Doctor Panel',
      description: 'Call next patient, room token serving, prescription & scan orders.',
      role: 'doctor',
      color: 'from-cyan-500/10 to-cyan-500/5',
      borderColor: 'group-hover:border-cyan-500/30',
      iconBg: 'bg-cyan-50',
      icon: <Stethoscope className="text-cyan-600" size={24} />
    },
    {
      title: 'Reception Board',
      description: 'Doctor check-ins, walk-in ticket printing, queue prioritization.',
      role: 'receptionist',
      color: 'from-emerald-500/10 to-emerald-500/5',
      borderColor: 'group-hover:border-emerald-500/30',
      iconBg: 'bg-emerald-50',
      icon: <Users className="text-emerald-600" size={24} />
    },
    {
      title: 'Billing Terminal',
      description: 'Invoice verification, cash/card/UPI mock payments ledger.',
      role: 'billing',
      color: 'from-indigo-500/10 to-indigo-500/5',
      borderColor: 'group-hover:border-indigo-500/30',
      iconBg: 'bg-indigo-50',
      icon: <Receipt className="text-indigo-600" size={24} />
    },
    {
      title: 'Laboratory Hub',
      description: 'Scan report templates, pathology files, technician uploads.',
      role: 'lab',
      color: 'from-purple-500/10 to-purple-500/5',
      borderColor: 'group-hover:border-purple-500/30',
      iconBg: 'bg-purple-50',
      icon: <Beaker className="text-purple-600" size={24} />
    },
    {
      title: 'Pharmacy Dispatch',
      description: 'Prescription dispensing, medication packing status telemetry.',
      role: 'pharmacy',
      color: 'from-rose-500/10 to-rose-500/5',
      borderColor: 'group-hover:border-rose-500/30',
      iconBg: 'bg-rose-50',
      icon: <Pill className="text-rose-600" size={24} />
    }
  ];

  return (
    <div className="flex flex-col flex-1 items-center justify-start py-12 px-6 max-w-7xl mx-auto w-full font-sans">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mt-8 mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-50 text-blue-600 text-xs font-mono font-semibold mb-6 shadow-sm">
          <Activity size={14} className="animate-pulse" />
          AI-POWERED HEALTHCARE
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          SmartCare Healthcare <br />
          <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
            Management Platform
          </span>
        </h1>
        <p className="mt-6 text-base md:text-lg text-slate-500 leading-relaxed">
          A comprehensive, AI-driven healthcare management platform designed to streamline hospital operations, enhance patient care, and coordinate seamlessly across all clinical departments.
        </p>

        {user ? (
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link
              href={`/${user.role}-dashboard`}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
            >
              Access Dashboard
              <ChevronRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link
              href="/register"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              Create an Account
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>

      {/* Role Navigation Grid */}
      <div className="w-full mb-20">
        <div className="flex flex-col items-center mb-10 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Clinical & Administrative Portals</h2>
          <p className="text-slate-500 text-sm mt-2">Securely access specialized tools designed for each role within the hospital ecosystem.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((item, idx) => (
            <Link 
              key={idx} 
              href={user ? `/${item.role}-dashboard` : '/login'}
              className="group"
            >
              <div className={`h-full border border-slate-200 bg-white shadow-sm rounded-2xl p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:bg-gradient-to-br ${item.color} ${item.borderColor} relative flex flex-col justify-between`}>
                <div>
                  <div className={`p-3 rounded-xl w-fit mb-4 border border-slate-100 ${item.iconBg}`}>
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1 text-xs text-blue-600 font-semibold group-hover:underline">
                  Access Portal
                  <ChevronRight size={12} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Urgent Emergency Test Tool */}
      <div className="w-full max-w-4xl border border-red-100 bg-white shadow-md rounded-3xl p-6 md:p-10 relative overflow-hidden mb-12">
        <div className="absolute top-0 right-0 p-8 text-red-50 pointer-events-none hidden md:block">
          <ShieldAlert size={128} />
        </div>
        
        <div className="max-w-xl relative z-10">
          <div className="flex items-center gap-2 text-red-500 font-bold text-sm tracking-wide uppercase mb-3">
            <AlertTriangle size={16} />
            Ecosystem SOS Telemetry Test
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
            Trigger Emergency Alarm
          </h2>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Submit mock acute cardiac or respiratory distress symptoms. This broadcasts a real-time 
            alarm that instantly flashes all operational dashboards red, plays sirens, and queues 
            an emergency ticket.
          </p>

          {sosSuccess ? (
            <div className="mt-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 size={18} />
              SOS Broadcast Dispatched. All active dashboards are now flashing alert.
            </div>
          ) : (
            <form onSubmit={handleSOSTrigger} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">
                  Emergency Symptoms / Complications
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chest pain radiating to left arm, severe shortness of breath"
                  value={sosSymptoms}
                  onChange={(e) => setSosSymptoms(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 text-sm transition-shadow"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">
                    Patient Ward / Location
                  </label>
                  <select
                    value={sosLocation}
                    onChange={(e) => setSosLocation(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 text-sm transition-shadow"
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
                    className="w-full py-3 bg-red-500 hover:bg-red-600 active:scale-[0.98] transition-all font-bold text-white rounded-xl shadow-md cursor-pointer text-sm"
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
