'use client';
import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Terminal, RefreshCw, Sparkles } from 'lucide-react';

export default function SystemLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/logs');
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Allowed staff roles only (patients excluded)
  const staffRoles = ['doctor', 'receptionist', 'billing', 'lab', 'pharmacy'];

  return (
    <ProtectedRoute allowedRoles={staffRoles}>
      <div className="flex flex-col flex-1 p-6 max-w-6xl mx-auto w-full font-sans">
        
        {/* Header Telemetry */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs text-teal-400 font-mono font-bold tracking-widest block uppercase">Hospital Audit Deck</span>
            <h1 className="text-3xl font-extrabold text-white mt-1">Ecosystem Audit Logs</h1>
            <p className="text-zinc-500 text-xs mt-1">Audit administrative operations, queue updates, prescriptions, and invoice payments.</p>
          </div>

          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-2 border border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:text-white rounded-lg active:scale-95 transition-all text-xs font-bold cursor-pointer"
          >
            <RefreshCw size={12} />
            Refurbish Registry
          </button>
        </div>

        {/* Logs Deck */}
        <div className="border border-zinc-800/80 bg-zinc-950/20 rounded-2xl p-6 glass-panel relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 text-teal-500/5 pointer-events-none">
            <Terminal size={120} />
          </div>

          <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold tracking-wider mb-6">
            <Terminal size={14} />
            CENTRALIZED SYSTEM AUDIT TELEMETRY
          </div>

          {loading ? (
            <p className="text-zinc-600 text-xs">Loading audit registry...</p>
          ) : logs.length === 0 ? (
            <p className="text-zinc-500 text-xs py-8 text-center bg-zinc-900/10 border border-zinc-850 rounded-xl">
              No audit logs captured yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Responder ID</th>
                    <th className="py-3 px-3 text-teal-400">Action / Method</th>
                    <th className="py-3 px-3">Log Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/60 text-[11px] text-zinc-400">
                  {logs.map((log, idx) => (
                    <tr key={log._id || idx} className="hover:bg-zinc-900/30">
                      <td className="py-3 px-3 text-zinc-500">
                        {new Date(log.timestamp || log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-sans capitalize ${
                          log.userRole === 'doctor' ? 'bg-teal-500/10 text-teal-400' :
                          log.userRole === 'receptionist' ? 'bg-blue-500/10 text-blue-400' :
                          log.userRole === 'billing' ? 'bg-amber-500/10 text-amber-400' :
                          log.userRole === 'lab' ? 'bg-purple-500/10 text-purple-400' :
                          log.userRole === 'pharmacy' ? 'bg-rose-500/10 text-rose-400' :
                          'bg-zinc-850 text-zinc-500'
                        }`}>
                          {log.userRole || 'SYSTEM'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-600 break-all max-w-[80px]">
                        {log.userId || 'system_service'}
                      </td>
                      <td className="py-3 px-3 font-bold text-zinc-200">
                        {log.action}
                      </td>
                      <td className="py-3 px-3 text-zinc-300 font-sans leading-relaxed">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
