'use client';
import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import { 
  DollarSign, Receipt, CreditCard, Sparkles, CheckCircle, 
  AlertCircle, Plus, RefreshCw, X, ClipboardList
} from 'lucide-react';

export default function BillingDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [activeTab, setActiveTab] = useState('invoices');

  // Billing states
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manual invoice builder states
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualPatientId, setManualPatientId] = useState('');
  const [manualPatientName, setManualPatientName] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Record payment states
  const [payInvoice, setPayInvoice] = useState(null);
  const [payMethod, setPayMethod] = useState('Cash');
  const [payLoading, setPayLoading] = useState(false);

  // Audit log state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchInvoices = async () => {
    try {
      const res = await axios.get('/api/billing/invoices');
      if (res.data.success) {
        setInvoices(res.data.invoices);
      }
    } catch (err) {
      console.error('Error fetching billing invoices:', err);
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
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab]);

  // Listen for real-time invoice generation/payment
  useEffect(() => {
    if (!socket) return;
    
    socket.on('billing_updated', () => {
      fetchInvoices();
    });

    socket.on('invoice_created', () => {
      fetchInvoices();
    });

    return () => {
      socket.off('billing_updated');
      socket.off('invoice_created');
    };
  }, [socket]);

  const handleManualInvoiceSubmit = async (e) => {
    e.preventDefault();
    if (!manualPatientId || !manualPatientName || !manualAmount || !manualDesc) return;
    setAddLoading(true);

    try {
      const res = await axios.post('/api/billing/invoices', {
        patientId: manualPatientId,
        patientName: manualPatientName,
        amount: Number(manualAmount),
        description: manualDesc
      });
      if (res.data.success) {
        setShowAddForm(false);
        setManualPatientId('');
        setManualPatientName('');
        setManualAmount('');
        setManualDesc('');
        fetchInvoices();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate manual invoice.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!payInvoice) return;
    setPayLoading(true);
    try {
      const res = await axios.post(`/api/billing/invoices/${payInvoice._id}/pay`, {
        paymentMethod: payMethod
      });
      if (res.data.success) {
        setPayInvoice(null);
        fetchInvoices();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to settle payment.');
    } finally {
      setPayLoading(false);
    }
  };

  const pendingAmount = invoices.filter((i) => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);
  const collectedAmount = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);

  return (
    <ProtectedRoute allowedRoles={['billing']}>
      <div className="flex flex-col flex-1 p-6 max-w-6xl mx-auto w-full font-sans">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs text-teal-400 font-mono font-bold tracking-widest block uppercase">Billing Ledger Desk</span>
            <h1 className="text-3xl font-extrabold text-white mt-1">Hello, {user?.name}</h1>
            <p className="text-zinc-500 text-xs mt-1">Process medical bills, record cash balances, and issue receipts.</p>
          </div>

          <div className="flex gap-3">
            {activeTab === 'invoices' && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 rounded-xl active:scale-95 transition-all text-xs font-bold cursor-pointer shadow-md shadow-teal-500/10"
              >
                <Plus size={14} />
                Manual Statement
              </button>
            )}
            <button
              onClick={() => activeTab === 'invoices' ? fetchInvoices() : fetchAuditLogs()}
              className="flex items-center gap-1.5 px-3 py-2 border border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:text-white rounded-lg active:scale-95 transition-all text-xs font-bold cursor-pointer"
            >
              <RefreshCw size={12} />
              Reload
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-2 bg-zinc-950 p-1 border border-zinc-800 rounded-xl w-fit mb-6">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'invoices' ? 'bg-teal-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Receipt className="inline mr-1" size={13} />
            Invoices Ledger
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'audit' ? 'bg-teal-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ClipboardList className="inline mr-1" size={13} />
            My Activity Logs
          </button>
        </div>

        {/* Tab: Invoices */}
        {activeTab === 'invoices' && (
          <>
            {/* Financial Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-5 text-center glass-panel">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Total Settled Revenue</span>
                <span className="text-2xl font-extrabold text-emerald-400 block mt-1">₹{collectedAmount}</span>
                <span className="text-[9px] text-zinc-600 block mt-1.5 font-mono">Cleared ledger balance</span>
              </div>

              <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-5 text-center glass-panel">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Pending Receivables</span>
                <span className="text-2xl font-extrabold text-red-400 block mt-1">₹{pendingAmount}</span>
                <span className="text-[9px] text-zinc-600 block mt-1.5 font-mono">Uncollected patient bills</span>
              </div>

              <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-5 text-center glass-panel">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Total Statements Issued</span>
                <span className="text-2xl font-extrabold text-white block mt-1">{invoices.length}</span>
                <span className="text-[9px] text-zinc-600 block mt-1.5 font-mono">Count of billing events</span>
              </div>
            </div>

            {/* Manual Invoice form drawer */}
            {showAddForm && (
              <div className="border border-teal-500/20 bg-teal-950/5 rounded-2xl p-6 glass-panel mb-8 animate-fadeIn">
                <h2 className="text-base font-bold text-white mb-2">Create Manual Invoice</h2>
                <p className="text-zinc-500 text-xs mb-4">Register a fee order directly against a patient account.</p>

                <form onSubmit={handleManualInvoiceSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5">Patient ID</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. patientId"
                      value={manualPatientId}
                      onChange={(e) => setManualPatientId(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5">Patient Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alice Cooper"
                      value={manualPatientName}
                      onChange={(e) => setManualPatientName(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5">Amount (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 150"
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5">Description</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ECG Test Scan charges"
                      value={manualDesc}
                      onChange={(e) => setManualDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      type="submit"
                      disabled={addLoading}
                      className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded text-xs active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-bold rounded text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Ledger Table */}
            <div className="border border-zinc-800/80 bg-zinc-950/20 rounded-2xl p-6 glass-panel">
              <h2 className="text-base font-bold text-white mb-4">Hospital Invoicing Ledger</h2>

              {loading ? (
                <p className="text-zinc-600 text-xs">Loading ledger logs...</p>
              ) : invoices.length === 0 ? (
                <p className="text-zinc-500 text-xs py-8 text-center bg-zinc-900/10 border border-zinc-850 rounded-xl">
                  No hospital invoices found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 uppercase font-bold tracking-wider">
                        <th className="py-3 px-3">Patient Name</th>
                        <th className="py-3 px-3">Details / Charges</th>
                        <th className="py-3 px-3">Invoice Date</th>
                        <th className="py-3 px-3">Amount</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Settlement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850">
                      {invoices.map((inv) => (
                        <tr key={inv._id} className="hover:bg-zinc-900/30">
                          <td className="py-3.5 px-3 font-semibold text-white">{inv.patientName}</td>
                          <td className="py-3.5 px-3 text-zinc-300">{inv.description}</td>
                          <td className="py-3.5 px-3 text-zinc-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                          <td className="py-3.5 px-3 font-mono font-bold text-teal-400">₹{inv.amount}</td>
                          <td className="py-3.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400 animate-pulse'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            {inv.status === 'pending' ? (
                              <button
                                onClick={() => {
                                  setPayInvoice(inv);
                                  setPayMethod('Cash');
                                }}
                                className="px-3 py-1 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded text-[10px] active:scale-95 transition-all cursor-pointer"
                              >
                                Record Pay
                              </button>
                            ) : (
                              <span className="text-zinc-500 text-[10px] font-mono capitalize">
                                {inv.paymentMethod}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Tab: My Audit Logs */}
        {activeTab === 'audit' && (
          <div className="border border-zinc-800/80 bg-zinc-950/20 rounded-2xl p-6 glass-panel">
            <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold tracking-wider mb-1">
              <ClipboardList size={14} />
              MY BILLING ACTIVITY AUDIT TRAIL
            </div>
            <p className="text-zinc-500 text-xs mb-6">Payments recorded, invoices settled — your personal activity log.</p>

            {auditLoading ? (
              <p className="text-zinc-600 text-xs">Loading your activity logs...</p>
            ) : auditLogs.length === 0 ? (
              <p className="text-zinc-500 text-xs py-8 text-center bg-zinc-900/10 border border-zinc-850 rounded-xl">
                No billing activity recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log, idx) => (
                  <div key={log._id || idx} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-start gap-4">
                    <div className="px-2.5 py-1 rounded text-[9px] font-bold uppercase font-sans whitespace-nowrap bg-amber-500/10 text-amber-300">
                      {log.action}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-300 leading-relaxed">{log.details}</p>
                      <p className="text-[10px] text-zinc-600 mt-1 font-mono">
                        {new Date(log.timestamp || log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settle Invoice Modal */}
        {payInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm border border-zinc-850 bg-zinc-950 p-6 rounded-2xl shadow-2xl relative">
              <h3 className="text-lg font-bold text-white mb-1">Confirm Bill Settlement</h3>
              <p className="text-zinc-500 text-xs mb-5">Recording payment for <span className="text-white font-bold">{payInvoice.patientName}</span></p>

              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl text-center mb-5">
                <span className="text-xs text-zinc-500 uppercase block">Settlement Amount</span>
                <span className="text-3xl font-mono font-extrabold text-teal-400 block mt-1">₹{payInvoice.amount}</span>
                <span className="text-[10px] text-zinc-400 block mt-1.5">{payInvoice.description}</span>
              </div>

              <div className="mb-4">
                <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="Cash">Received Cash</option>
                  <option value="UPI">Direct UPI QR Scan</option>
                  <option value="Card">Card Swipe Terminal</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setPayInvoice(null)}
                  className="flex-1 py-2 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs cursor-pointer active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordPayment}
                  disabled={payLoading}
                  className="flex-1 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-xs rounded cursor-pointer active:scale-95 transition-all"
                >
                  {payLoading ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
