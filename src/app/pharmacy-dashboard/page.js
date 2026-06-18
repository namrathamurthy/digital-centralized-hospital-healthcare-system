'use client';
import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import { 
  Pill, CheckCircle, Clock, Sparkles, RefreshCw, 
  PackageCheck, ArchiveRestore, ClipboardList 
} from 'lucide-react';

export default function PharmacyDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [activeTab, setActiveTab] = useState('prescriptions');
  const [activeSubTab, setActiveSubTab] = useState('pending');

  // Pharmacy states
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispenseLoading, setDispenseLoading] = useState(false);

  // Audit log state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchPrescriptions = async () => {
    try {
      const res = await axios.get('/api/pharmacy/prescriptions');
      if (res.data.success) {
        setPrescriptions(res.data.prescriptions);
      }
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await axios.get('/api/logs?filter=mine');
      if (res.data.success) setAuditLogs(res.data.logs);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab]);

  // Listen for real-time prescriptions
  useEffect(() => {
    if (!socket) return;
    socket.on('pharmacy_updated', () => {
      fetchPrescriptions();
    });
    return () => {
      socket.off('pharmacy_updated');
    };
  }, [socket]);

  const handleDispense = async (prescriptionId) => {
    setDispenseLoading(true);
    try {
      const res = await axios.post(`/api/pharmacy/prescriptions/${prescriptionId}`);
      if (res.data.success) {
        fetchPrescriptions();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to dispense medicines.');
    } finally {
      setDispenseLoading(false);
    }
  };

  const pendingPrescriptions = prescriptions.filter((p) => p.status === 'pending');
  const dispensedPrescriptions = prescriptions.filter((p) => p.status === 'dispensed');

  return (
    <ProtectedRoute allowedRoles={['pharmacy']}>
      <div className="flex flex-col flex-1 p-6 max-w-6xl mx-auto w-full font-sans">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs text-rose-400 font-mono font-bold tracking-widest block uppercase">Pharmacy Dispatch Counter</span>
            <h1 className="text-3xl font-extrabold text-slate-800 mt-1">Hello, {user?.name}</h1>
            <p className="text-slate-500 text-xs mt-1">Fulfill patient medication prescriptions and monitor pack status.</p>
          </div>
        </div>

        {/* Main Tab Bar */}
        <div className="flex gap-2 bg-white p-1 border border-slate-200 rounded-xl w-fit mb-6">
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'prescriptions' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Pill className="inline mr-1" size={13} />
            Prescriptions Deck
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'audit' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <ClipboardList className="inline mr-1" size={13} />
            My Activity Logs
          </button>
        </div>

        {/* Tab: Prescriptions Deck */}
        {activeTab === 'prescriptions' && (
          <div className="border border-slate-200 bg-white/80 rounded-2xl p-6 glass-panel">
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-3 bg-white p-1 border border-slate-200 rounded-xl w-fit">
                <button
                  onClick={() => setActiveSubTab('pending')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeSubTab === 'pending' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <Clock className="inline mr-1" size={14} />
                  Pending ({pendingPrescriptions.length})
                </button>
                <button
                  onClick={() => setActiveSubTab('completed')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeSubTab === 'completed' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <CheckCircle className="inline mr-1" size={14} />
                  Dispensed ({dispensedPrescriptions.length})
                </button>
              </div>

              <button
                onClick={fetchPrescriptions}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-800 rounded-lg active:scale-95 transition-all text-xs font-bold cursor-pointer"
              >
                <RefreshCw size={12} />
                Refresh
              </button>
            </div>

            {loading ? (
              <p className="text-slate-500 text-xs">Loading pharmacy registry...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeSubTab === 'pending' ? (
                  pendingPrescriptions.length === 0 ? (
                    <div className="md:col-span-2 text-center py-12 bg-slate-50 border border-slate-200 rounded-xl">
                      <ClipboardList className="mx-auto text-slate-400 mb-3" size={32} />
                      <p className="text-slate-500 text-xs">No pending medications to package.</p>
                    </div>
                  ) : (
                    pendingPrescriptions.map((rx) => (
                      <div 
                        key={rx._id}
                        className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3 border-b border-slate-200 pb-3">
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase">Patient Profile</span>
                              <p className="text-sm font-bold text-slate-800">{rx.patientName}</p>
                            </div>
                            <div className="flex gap-2">
                              {rx.invoiceStatus === 'paid' ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase">
                                  Bill Paid
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-400 text-[9px] font-bold uppercase">
                                  Bill Unpaid
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 text-[9px] font-bold uppercase animate-pulse">
                                Pending
                              </span>
                            </div>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs leading-relaxed text-slate-600 mb-4">
                            <span className="text-slate-500 font-bold block mb-1">Diagnosis: {rx.diagnosis}</span>
                            <div className="space-y-2.5 mt-2">
                              {rx.medications.map((m, idx) => (
                                <div key={idx} className="flex justify-between items-center text-slate-600">
                                  <div>
                                    <p className="font-bold text-slate-800">{m.name}</p>
                                    <p className="text-[9px] text-slate-500">{m.frequency} • {m.duration}</p>
                                  </div>
                                  <span className="font-mono text-slate-600 text-[9px]">{m.dosage}</span>
                                </div>
                              ))}
                            </div>
                            {rx.attachmentData && (
                              <div className="mt-3 pt-3 border-t border-slate-200">
                                <a 
                                  href={rx.attachmentData} 
                                  download={rx.attachmentName || "prescription.png"} 
                                  className="text-[10px] text-blue-600 font-bold hover:text-blue-500 flex items-center gap-1"
                                >
                                  📄 View Handwritten Photocopy
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        {rx.invoiceStatus === 'paid' ? (
                          <button
                            onClick={() => handleDispense(rx._id)}
                            disabled={dispenseLoading}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-blue-500/20"
                          >
                            <PackageCheck size={14} />
                            Dispense & Pack
                          </button>
                        ) : (
                          <div className="w-full py-2 bg-slate-50 border border-amber-200 text-amber-500/70 font-bold rounded text-xs flex items-center justify-center gap-1">
                            <Clock size={14} />
                            Awaiting Payment Verification
                          </div>
                        )}
                      </div>
                    ))
                  )
                ) : (
                  dispensedPrescriptions.length === 0 ? (
                    <div className="md:col-span-2 text-center py-12 bg-slate-50 border border-slate-200 rounded-xl">
                      <ClipboardList className="mx-auto text-slate-400 mb-3" size={32} />
                      <p className="text-slate-500 text-xs">No dispensed prescriptions logged.</p>
                    </div>
                  ) : (
                    dispensedPrescriptions.map((rx) => (
                      <div 
                        key={rx._id}
                        className="p-5 rounded-xl border border-slate-200 bg-zinc-905/30"
                      >
                        <div className="flex justify-between items-start mb-3 border-b border-slate-200 pb-3">
                          <div>
                            <span className="text-[10px] text-slate-500">Patient Profile</span>
                            <p className="text-sm font-bold text-slate-800">{rx.patientName}</p>
                          </div>
                          <div className="flex gap-2">
                            {rx.invoiceStatus === 'paid' && (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase">
                                Bill Paid
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-600 text-[9px] font-bold uppercase">
                              Dispensed
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs leading-relaxed text-slate-600">
                          <span className="text-slate-500 font-bold block mb-1">Diagnosis: {rx.diagnosis}</span>
                          <div className="space-y-2 mt-2">
                            {rx.medications.map((m, idx) => (
                              <div key={idx} className="flex justify-between items-center text-slate-600">
                                <div>
                                  <p className="font-bold text-slate-800">{m.name}</p>
                                  <p className="text-[9px] text-slate-500">{m.frequency}</p>
                                </div>
                                <span className="font-mono text-slate-600 text-[9px]">{m.dosage}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {rx.attachmentData && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <a 
                              href={rx.attachmentData} 
                              download={rx.attachmentName || "prescription.png"} 
                              className="text-[10px] text-blue-600 font-bold hover:text-blue-500 flex items-center gap-1"
                            >
                              📄 View Handwritten Photocopy
                            </a>
                          </div>
                        )}
                      </div>
                    ))
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab: My Audit Logs */}
        {activeTab === 'audit' && (
          <div className="border border-slate-200 bg-white/80 rounded-2xl p-6 glass-panel">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 text-blue-600 text-xs font-mono font-bold tracking-wider mb-1">
                  <ClipboardList size={14} />
                  MY PHARMACY ACTIVITY AUDIT TRAIL
                </div>
                <p className="text-slate-500 text-xs">Medications dispensed, packets processed — your personal pharmacy log.</p>
              </div>
              <button
                onClick={fetchAuditLogs}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-800 rounded-lg active:scale-95 transition-all text-xs font-bold cursor-pointer"
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>

            {auditLoading ? (
              <p className="text-slate-500 text-xs">Loading your activity logs...</p>
            ) : auditLogs.length === 0 ? (
              <p className="text-slate-500 text-xs py-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                No pharmacy activity recorded yet. Dispense medicines to see logs here.
              </p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log, idx) => (
                  <div key={log._id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-4">
                    <div className="px-2.5 py-1 rounded text-[9px] font-bold uppercase font-sans whitespace-nowrap bg-rose-50 text-rose-600">
                      {log.action}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-600 leading-relaxed">{log.details}</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">
                        {new Date(log.timestamp || log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
