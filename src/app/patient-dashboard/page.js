'use client';
import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import { 
  Heart, Activity, Brain, Clock, ShieldAlert, FileText, 
  DollarSign, Receipt, CreditCard, Sparkles, CheckCircle, HelpCircle, ClipboardList, RefreshCw, QrCode, Banknote 
} from 'lucide-react';

export default function PatientDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState('triage');

  // State lists
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labRequests, setLabRequests] = useState([]);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // AI Triage states
  const [symptoms, setSymptoms] = useState('');
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);

  // Booking states
  const [bookingDocId, setBookingDocId] = useState('');
  const [bookingSlot, setBookingSlot] = useState('09:00 AM - 09:30 AM');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState('');

  // Payment Modal states
  const [payInvoice, setPayInvoice] = useState(null);
  const [payMethod, setPayMethod] = useState('UPI');
  const [paying, setPaying] = useState(false);

  const fetchData = async () => {
    try {
      const docsRes = await axios.get('/api/queue/doctors');
      if (docsRes.data.success) setDoctors(docsRes.data.doctors);

      const apptRes = await axios.get('/api/queue/my-appointments');
      if (apptRes.data.success) setAppointments(apptRes.data.appointments);

      const invRes = await axios.get('/api/billing/invoices');
      if (invRes.data.success) setInvoices(invRes.data.invoices);

      const rxRes = await axios.get('/api/pharmacy/prescriptions');
      if (rxRes.data.success) setPrescriptions(rxRes.data.prescriptions);

      const labRes = await axios.get('/api/lab/requests');
      if (labRes.data.success) setLabRequests(labRes.data.requests);
    } catch (err) {
      console.error('Error fetching patient data:', err);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      // For patients, backend automatically restricts logs to their own user ID
      const res = await axios.get('/api/logs');
      if (res.data.success) setAuditLogs(res.data.logs);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab]);

  // Listen for real-time queue or medical changes
  useEffect(() => {
    if (!socket) return;

    socket.on('queue_updated', () => fetchData());
    socket.on('invoice_created', () => fetchData());
    socket.on('invoice_paid', () => fetchData());
    socket.on('prescription_created', () => fetchData());
    socket.on('prescription_dispensed', () => fetchData());
    socket.on('lab_request_created', () => fetchData());
    socket.on('lab_completed', () => fetchData());

    return () => {
      socket.off('queue_updated');
      socket.off('invoice_created');
      socket.off('invoice_paid');
      socket.off('prescription_created');
      socket.off('prescription_dispensed');
      socket.off('lab_request_created');
      socket.off('lab_completed');
    };
  }, [socket]);

  // Run AI Triage Diagnosis
  const handleTriageSubmit = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) return;
    setTriageLoading(true);
    setTriageResult(null);
    try {
      const res = await axios.post('/api/ai/triage', { symptoms });
      if (res.data.success) {
        setTriageResult(res.data.triage);
        const matchingDoc = doctors.find(
          (d) => d.department.toLowerCase() === res.data.triage.department.toLowerCase()
        );
        if (matchingDoc) setBookingDocId(matchingDoc._id);
        else if (doctors.length > 0) setBookingDocId(doctors[0]._id);
      }
    } catch (err) {
      console.error(err);
      alert('Triage check failed');
    } finally {
      setTriageLoading(false);
    }
  };

  // Register appointment
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!bookingDocId) return;
    try {
      const res = await axios.post('/api/queue/book', {
        doctorId: bookingDocId,
        date: new Date().toISOString().split('T')[0],
        timeSlot: bookingSlot,
        triageData: triageResult ? {
          symptoms,
          severity: triageResult.severity,
          aiAdvice: triageResult.aiAdvice
        } : { symptoms, severity: 'Low', aiAdvice: 'Direct Booking' }
      });
      if (res.data.success) {
        setBookingSuccess(true);
        setSymptoms('');
        setTriageResult(null);
        fetchData();
        setTimeout(() => setBookingSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to register appointment');
    }
  };

  // pay invoice
  const handlePayment = async () => {
    if (!payInvoice) return;
    setPaying(true);
    try {
      const res = await axios.post(`/api/billing/invoices/${payInvoice._id}/pay`, {
        paymentMethod: payMethod
      });
      if (res.data.success) {
        setPayInvoice(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert('Payment failed.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <div className="flex flex-col flex-1 p-6 max-w-6xl mx-auto w-full font-sans">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs text-teal-400 font-mono font-bold tracking-widest block uppercase">Patient Hub</span>
            <h1 className="text-3xl font-extrabold text-white mt-1">Hello, {user?.name}</h1>
            <p className="text-zinc-500 text-xs mt-1">Monitor your queues, AI symptoms advice, and medical files.</p>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex flex-wrap gap-2 bg-zinc-950 p-1 border border-zinc-800 rounded-xl w-fit mb-8">
          <button
            onClick={() => setActiveTab('triage')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'triage' ? 'bg-teal-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Brain className="inline mr-1" size={14} />
            AI Triage & Booking
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tickets' ? 'bg-teal-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock className="inline mr-1" size={14} />
            My Queue Tickets
          </button>
          <button
            onClick={() => setActiveTab('medical')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'medical' ? 'bg-teal-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="inline mr-1" size={14} />
            Medical Records
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'billing' ? 'bg-teal-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <DollarSign className="inline mr-1" size={14} />
            Payments
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'audit' ? 'bg-teal-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ClipboardList className="inline mr-1" size={14} />
            My Activity Log
          </button>
        </div>

        {/* Tab 1: AI Triage */}
        {activeTab === 'triage' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <div className="border border-zinc-800/80 bg-zinc-950/20 rounded-2xl p-6 glass-panel relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 text-teal-500/5 pointer-events-none">
                  <Brain size={120} />
                </div>
                
                <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold tracking-wider mb-2">
                  <Sparkles size={14} />
                  AI SYMPTOM CHECKER & ROUTING
                </div>
                <h2 className="text-xl font-bold text-white">Gemini Clinical Triage</h2>
                <p className="text-zinc-400 text-xs mt-1">Describe your symptoms to receive severity assessments and department mapping.</p>

                {bookingSuccess && (
                  <div className="mt-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 text-xs font-semibold">
                    Appointment booked! Check the "My Queue Tickets" tab to monitor your ticket live.
                  </div>
                )}

                <form onSubmit={handleTriageSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-2">
                      Describe what you are feeling
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. I have a sharp pain in my chest that started 30 mins ago, along with mild sweat and nausea..."
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-teal-500 transition-colors"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={triageLoading}
                    className="py-2.5 px-6 bg-teal-500 hover:bg-teal-400 active:scale-[0.98] transition-all font-bold text-zinc-950 rounded-lg text-xs cursor-pointer shadow-md shadow-teal-500/10"
                  >
                    {triageLoading ? 'Running AI Assessment...' : 'Run Symptom Triage'}
                  </button>
                </form>

                {triageResult && (
                  <div className="mt-6 border-t border-zinc-800/80 pt-6 animate-fadeIn">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Brain size={16} className="text-teal-400" />
                      AI Diagnostic Assessment
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mt-4 mb-4">
                      <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block">Assessed Severity</span>
                        <span className={`text-sm font-extrabold capitalize mt-0.5 block ${
                          triageResult.severity === 'Emergency' || triageResult.severity === 'High' ? 'text-red-400' : 
                          triageResult.severity === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {triageResult.severity}
                        </span>
                      </div>
                      <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block">Target Ward</span>
                        <span className="text-sm font-extrabold text-white mt-0.5 block">{triageResult.department}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-xs leading-relaxed text-zinc-300">
                      <span className="text-zinc-400 block font-bold mb-1">Triage Recommendations:</span>
                      {triageResult.aiAdvice}
                    </div>

                    <form onSubmit={handleBookAppointment} className="mt-6 space-y-4 p-4 rounded-xl border border-teal-500/10 bg-teal-950/5">
                      <div className="text-xs font-bold text-white uppercase tracking-wide">
                        Instant Doctor Assignment
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5">Search & Select Specialist</label>
                          <input 
                            type="text" 
                            placeholder="Search by name or department (e.g. Dermatology)..." 
                            value={doctorSearch} 
                            onChange={(e) => setDoctorSearch(e.target.value)} 
                            className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-teal-500 mb-1"
                          />
                          <select
                            value={bookingDocId}
                            onChange={(e) => setBookingDocId(e.target.value)}
                            className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-teal-500"
                          >
                            <option value="">-- Choose Doctor --</option>
                            {doctors.filter(doc => doc.name.toLowerCase().includes(doctorSearch.toLowerCase()) || doc.department.toLowerCase().includes(doctorSearch.toLowerCase())).slice(0, 100).map((doc) => (
                              <option key={doc._id} value={doc._id}>
                                {doc.name} ({doc.department}) - {doc.hospital || 'Main Hospital'} - Cabin {doc.cabin || doc.room}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5">Time Schedule</label>
                          <select
                            value={bookingSlot}
                            onChange={(e) => setBookingSlot(e.target.value)}
                            className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-teal-500"
                          >
                            <option value="09:00 AM - 09:30 AM">09:00 AM - 09:30 AM</option>
                            <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                            <option value="11:00 AM - 11:30 AM">11:00 AM - 11:30 AM</option>
                            <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
                            <option value="03:00 PM - 03:30 PM">03:00 PM - 03:30 PM</option>
                            <option value="Walk-in">Walk-in Queue ticket</option>
                          </select>
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="py-2 px-5 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded text-xs active:scale-[0.98] transition-all cursor-pointer w-full"
                      >
                        Book Urgently & Join Queue
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="border border-zinc-800/80 bg-zinc-950/20 rounded-2xl p-6 glass-panel">
                <h3 className="text-base font-bold text-white mb-4">Doctor Board Status</h3>
                
                {doctors.length === 0 ? (
                  <p className="text-zinc-600 text-xs">No active doctors on duty.</p>
                ) : (
                  <div className="space-y-4">
                    {doctors.map((doc) => (
                      <div 
                        key={doc._id}
                        className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-between hover:border-zinc-700 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-bold text-zinc-100">{doc.name}</p>
                          <p className="text-[10px] text-zinc-500 font-medium capitalize">
                            {doc.department} • {doc.hospital || 'Main Hospital'} • Cabin {doc.cabin || doc.room}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Serving Token</p>
                          <span className="px-2.5 py-1 rounded bg-teal-500/15 text-teal-400 text-xs font-bold font-mono">
                            #{doc.currentToken || '0'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: My Queue Tickets */}
        {activeTab === 'tickets' && (
          <div className="border border-zinc-800/80 bg-zinc-950/20 rounded-2xl p-6 glass-panel">
            <h2 className="text-xl font-bold text-white mb-4">Your Active Tickets</h2>
            
            {appointments.length === 0 ? (
              <div className="text-center py-12 border border-zinc-850 rounded-xl bg-zinc-900/20">
                <Clock className="mx-auto text-zinc-700 mb-3" size={32} />
                <p className="text-zinc-500 text-xs">No active queue tickets registered.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider font-bold">
                      <th className="py-3 px-4">Doctor</th>
                      <th className="py-3 px-4">Token</th>
                      <th className="py-3 px-4">Slot</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {appointments.map((appt) => (
                      <tr key={appt._id} className="hover:bg-zinc-900/30">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {appt.doctorName}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-teal-400">
                          #{appt.tokenNumber}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-400">{appt.timeSlot}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            appt.priority === 2 ? 'bg-red-500/15 text-red-400' :
                            appt.priority === 1 ? 'bg-amber-500/15 text-amber-400' :
                            'bg-zinc-800 text-zinc-400'
                          }`}>
                            {appt.priority === 2 ? 'Emergency' : appt.priority === 1 ? 'High' : 'Normal'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                            appt.status === 'calling' ? 'bg-teal-500 text-zinc-950 animate-pulse' :
                            appt.status === 'waiting' ? 'bg-zinc-800 text-zinc-400' :
                            appt.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                            'bg-red-500/10 text-red-400'
                          }`}>
                            {appt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Medical Records & Prescriptions */}
        {activeTab === 'medical' && (
          <div className="space-y-8">
            <div className="border border-zinc-800/80 bg-zinc-950/20 rounded-2xl p-6 glass-panel">
              <h2 className="text-lg font-bold text-white mb-4">Medication Prescriptions</h2>
              {prescriptions.length === 0 ? (
                <p className="text-zinc-600 text-xs">No prescription orders found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {prescriptions.map((rx) => (
                    <div key={rx._id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                      <div className="flex justify-between items-start mb-3 border-b border-zinc-800 pb-3">
                        <div>
                          <p className="text-xs text-zinc-500">Diagnosis</p>
                          <p className="text-sm font-bold text-white capitalize">{rx.diagnosis}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          rx.status === 'dispensed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {rx.status === 'dispensed' ? 'Dispensed' : 'Preparing Packing'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {rx.medications.map((med, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-zinc-300">
                            <div>
                              <p className="font-bold text-zinc-200">{med.name}</p>
                              <p className="text-[10px] text-zinc-500">{med.frequency} • {med.duration}</p>
                            </div>
                            <span className="font-mono text-zinc-400 text-[10px]">{med.dosage}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-zinc-800/80 bg-zinc-950/20 rounded-2xl p-6 glass-panel">
              <h2 className="text-lg font-bold text-white mb-4">Laboratory Scans & Diagnostics</h2>
              {labRequests.length === 0 ? (
                <p className="text-zinc-600 text-xs">No laboratory scan orders found.</p>
              ) : (
                <div className="space-y-4">
                  {labRequests.map((lab) => (
                    <div key={lab._id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] text-teal-400 font-mono font-bold uppercase">{lab.testType}</span>
                        <p className="text-xs text-zinc-500 mt-1">Requested by Dr. {lab.doctorName}</p>
                      </div>
                      <div className="flex-1 max-w-md bg-zinc-950/60 p-3 rounded-lg border border-zinc-850">
                        <span className="text-[9px] text-zinc-600 block uppercase font-bold">Report findings</span>
                        <span className="text-xs text-zinc-300 mt-0.5 block">
                          {lab.status === 'completed' ? lab.result : 'Awaiting clinical technician report...'}
                        </span>
                        {lab.attachmentData && (
                          <a 
                            href={lab.attachmentData} 
                            download={lab.attachmentName || 'report'}
                            target="_blank" 
                            rel="noreferrer"
                            className="py-1.5 px-3 mt-3 w-fit bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-400 font-bold rounded-lg text-[10px] cursor-pointer flex items-center transition-all"
                          >
                            <FileText size={12} className="mr-1.5" />
                            Download Attached Report
                          </a>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase w-fit h-fit ${
                        lab.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {lab.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Payments / Invoices */}
        {activeTab === 'billing' && (
          <div className="border border-zinc-800/80 bg-zinc-950/20 rounded-2xl p-6 glass-panel">
            <h2 className="text-xl font-bold text-white mb-4">Hospital Invoices</h2>
            {invoices.length === 0 ? (
              <p className="text-zinc-600 text-xs">No invoicing statements found.</p>
            ) : (
              <div className="space-y-4">
                {invoices.map((inv) => (
                  <div key={inv._id} className="p-4 rounded-xl border border-zinc-850 bg-zinc-900/30 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-500">Service Charges</p>
                      <p className="text-sm font-bold text-white">{inv.description}</p>
                      <span className="text-[10px] text-zinc-600 block mt-1">Date: {new Date(inv.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-zinc-500">Total Bill</p>
                        <span className="text-base font-extrabold text-teal-400">₹{inv.amount}</span>
                      </div>
                      {inv.status === 'pending' ? (
                        <button
                          onClick={() => {
                            setPayInvoice(inv);
                            setPayMethod('UPI');
                          }}
                          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 active:scale-[0.98] transition-all font-bold text-zinc-950 text-xs rounded-lg cursor-pointer shadow-md shadow-teal-500/10"
                        >
                          Settle Bill
                        </button>
                      ) : (
                        <span className="px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1">
                          <CheckCircle size={12} />
                          Paid ({inv.paymentMethod})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: My Audit Logs */}
        {activeTab === 'audit' && (
          <div className="border border-zinc-800/80 bg-zinc-950/20 rounded-2xl p-6 glass-panel">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold tracking-wider mb-1">
                  <ClipboardList size={14} />
                  MY PERSONAL HEALTH & ACTIVITY LOGS
                </div>
                <p className="text-zinc-500 text-xs">Complete timeline of your activities, queue tickets, and health events.</p>
              </div>
              <button
                onClick={fetchAuditLogs}
                className="flex items-center gap-1.5 px-3 py-2 border border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:text-white rounded-lg active:scale-95 transition-all text-xs font-bold cursor-pointer"
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>

            {auditLoading ? (
              <p className="text-zinc-600 text-xs">Loading your activity logs...</p>
            ) : auditLogs.length === 0 ? (
              <p className="text-zinc-500 text-xs py-8 text-center bg-zinc-900/10 border border-zinc-850 rounded-xl">
                No activity recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log, idx) => (
                  <div key={log._id || idx} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-start gap-4">
                    <div className="px-2.5 py-1 rounded text-[9px] font-bold uppercase font-sans whitespace-nowrap bg-teal-500/10 text-teal-300">
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

        {/* Simulated Payment Modal */}
        {payInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-sm border border-zinc-800 bg-zinc-950 p-6 rounded-2xl shadow-2xl relative">
              <h3 className="text-lg font-bold text-white mb-1">UPI / Cash Gateway</h3>
              <p className="text-zinc-500 text-xs mb-4">Select payment mechanism for Invoice #{payInvoice._id}</p>
              <div className="bg-zinc-900 p-4 rounded-xl mb-4 border border-zinc-800 text-center">
                <span className="text-xs text-zinc-400 uppercase">Amount Due</span>
                <p className="text-3xl font-extrabold text-teal-400 mt-1">₹{payInvoice.amount}</p>
                <p className="text-[10px] text-zinc-500 mt-1.5">{payInvoice.description}</p>
              </div>
              <div className="mb-4">
                <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-teal-500"
                >
                  <option value="UPI">Mock UPI (QR Code)</option>
                  <option value="Card">Mock Card Swipe</option>
                  <option value="Cash">Cash at Counter</option>
                </select>
              </div>
              {payMethod === 'UPI' && (
                <div className="flex flex-col items-center p-4 rounded-xl bg-white mb-4 border border-zinc-200">
                  <div className="h-32 w-32 bg-zinc-100 flex items-center justify-center border border-zinc-300 rounded-lg relative overflow-hidden shadow-inner">
                    <QrCode size={80} className="text-zinc-800" />
                    <div className="absolute inset-x-0 bottom-1/2 h-1 bg-teal-500 shadow-[0_0_8px_2px_rgba(20,184,166,0.6)] animate-pulse"></div>
                  </div>
                  <span className="text-zinc-600 text-[10px] mt-3 font-mono font-bold uppercase">Scan with BHIM / GPay / PhonePe</span>
                </div>
              )}
              {payMethod === 'Card' && (
                <div className="flex flex-col gap-3 p-4 rounded-xl bg-zinc-900 mb-4 border border-zinc-800">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard size={16} className="text-teal-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Credit / Debit Card</span>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Card Number</label>
                    <input type="text" placeholder="1234 5678 9101 1121" className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-teal-500 font-mono tracking-widest" />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">Expiry</label>
                      <input type="text" placeholder="MM/YY" className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-teal-500 font-mono" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">CVV</label>
                      <input type="password" placeholder="•••" className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-teal-500 font-mono" />
                    </div>
                  </div>
                </div>
              )}
              {payMethod === 'Cash' && (
                <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-amber-500/10 mb-4 border border-amber-500/30 text-center">
                  <Banknote size={24} className="text-amber-400 mb-2" />
                  <span className="text-amber-400 font-bold text-xs mb-1 uppercase tracking-wider">Pay at Counter</span>
                  <span className="text-zinc-400 text-[10px] leading-relaxed">
                    Please proceed to the main hospital billing counter on the ground floor. Present Invoice <strong className="text-zinc-200">#{payInvoice._id}</strong> to the cashier to settle your bill.
                  </span>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setPayInvoice(null)}
                  className="flex-1 py-2 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs cursor-pointer active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={paying}
                  className="flex-1 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-xs rounded cursor-pointer active:scale-95 transition-all"
                >
                  {paying ? 'Verifying...' : 'Settle Now'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
