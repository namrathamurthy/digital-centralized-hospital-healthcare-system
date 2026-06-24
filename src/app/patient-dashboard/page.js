'use client';
import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import { FileText, DollarSign, Brain, HeartPulse, Clock, Search, ClipboardList, Activity, ActivitySquare, ShieldAlert, BadgeInfo, Sparkles, AlertTriangle, Thermometer, Droplets, TestTube, ArrowRight, Play, CheckCircle, CheckCircle2, Star, RefreshCw, Banknote, CreditCard, QrCode } from 'lucide-react';
import AIChatbot from '../components/AIChatbot';
import WearableTrendChart from '../../components/WearableTrendChart';
import FeedbackForm from '../../components/FeedbackForm';

export default function PatientDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState('triage');
  const [loading, setLoading] = useState(true);

  // State lists
  const [doctors, setDoctors] = useState([]);
  const [doctorRatings, setDoctorRatings] = useState([]);
  const [pendingFeedback, setPendingFeedback] = useState([]);
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

  // Settings states
  const [reminders, setReminders] = useState({
    channel: 'WhatsApp',
    phoneNumber: '',
    emailAddress: '',
    language: 'English',
    medication: true,
    labTest: true,
    appointment: true,
    dnd: false
  });
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Daily Health Log State
  const [syncingWearable, setSyncingWearable] = useState(false);
  const [dailyLog, setDailyLog] = useState({
    heart_rate: '',
    spo2: '',
    sleep_hours: '',
    steps: ''
  });
  const [hasLoggedToday, setHasLoggedToday] = useState(false);
  const [lastLogTime, setLastLogTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [refreshChart, setRefreshChart] = useState(0);

  // Live countdown timer for the lock
  useEffect(() => {
    if (!lastLogTime) return;
    
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const diff = lastLogTime + (24 * 60 * 60 * 1000) - now;
      
      if (diff <= 0) {
        setHasLoggedToday(false);
        setLastLogTime(null);
        return false;
      }
      
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${h}h ${m}m ${s}s`);
      return true;
    };

    calculateTimeLeft();
    const interval = setInterval(() => {
      if (!calculateTimeLeft()) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastLogTime]);

  const handleSyncWearable = async (e) => {
    e.preventDefault();
    if (!dailyLog.heart_rate || !dailyLog.spo2 || !dailyLog.sleep_hours || !dailyLog.steps) {
      alert('Please fill out all vitals for today.');
      return;
    }

    setSyncingWearable(true);
    try {
      const readings = [];
      const d = new Date().toISOString();
      
      readings.push({ metric: 'heart_rate', value: Number(dailyLog.heart_rate), unit: 'bpm', recorded_at: d, source: 'Manual Entry' });
      readings.push({ metric: 'spo2', value: Number(dailyLog.spo2), unit: '%', recorded_at: d, source: 'Manual Entry' });
      readings.push({ metric: 'sleep_hours', value: Number(dailyLog.sleep_hours), unit: 'hours', recorded_at: d, source: 'Manual Entry' });
      readings.push({ metric: 'steps', value: Number(dailyLog.steps), unit: 'count', recorded_at: d, source: 'Manual Entry' });

      const res = await axios.post('/api/health-sync', {
        patientId: user._id,
        readings
      });

      if (res.data.success) {
        alert('Daily health vitals successfully logged!');
        setHasLoggedToday(true);
        setLastLogTime(new Date().getTime());
        setRefreshChart(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to log daily vitals');
    } finally {
      setSyncingWearable(false);
    }
  };

  const fetchData = async () => {
    try {
      const docRes = await axios.get('/api/queue/doctors');
      if (docRes.data.success) {
        setDoctors(docRes.data.doctors);
      }

      try {
        const settingsRes = await axios.get('/api/patient/settings');
        if (settingsRes.data.success && settingsRes.data.settings) {
          setReminders(settingsRes.data.settings);
        }
      } catch (err) {
        console.warn('Could not fetch settings', err);
      }

      const res = await axios.get('/api/queue/my-appointments');
      if (res.data.success) {
        setAppointments(res.data.appointments);
      }
      const labRes = await axios.get('/api/lab/requests');
      if (labRes.data.success) {
        setLabRequests(labRes.data.requests);
      }
      const rxRes = await axios.get('/api/pharmacy/prescriptions');
      if (rxRes.data.success) {
        setPrescriptions(rxRes.data.prescriptions);
      }
      const invoiceRes = await axios.get('/api/billing/invoices');
      if (invoiceRes.data.success) {
        setInvoices(invoiceRes.data.invoices);
      }
      
      const lbRes = await axios.get('/api/admin/leaderboard');
      if (lbRes?.data?.success) {
        setDoctorRatings(lbRes.data.leaderboard);
      }
      
      const pfRes = await axios.get('/api/feedback/pending');
      if (pfRes?.data?.success) {
        setPendingFeedback(pfRes.data.pending);
      }

      // Check if logged within last 24 hours
      if (user?._id) {
        const histRes = await axios.get(`/api/vitals/history/${user._id}?t=${Date.now()}`);
        if (histRes.data.success && histRes.data.history && histRes.data.history.length > 0) {
          const lastReading = histRes.data.history[histRes.data.history.length - 1];
          const lastTime = new Date(lastReading.fullDate).getTime();
          const now = new Date().getTime();
          const hoursSinceLastLog = (now - lastTime) / (1000 * 60 * 60);
          
          if (hoursSinceLastLog < 24) {
            setHasLoggedToday(true);
            setLastLogTime(lastTime);
          } else {
            setHasLoggedToday(false);
            setLastLogTime(null);
          }
        }
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
    if (user?._id) {
      const load = async () => { await fetchData(); };
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  useEffect(() => {
    if (activeTab === 'audit') {
      const loadAudit = async () => { await fetchAuditLogs(); };
      loadAudit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    socket.on('lab_completed', () => { const update = async () => { await fetchData(); }; update(); });

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
            <span className="text-xs text-blue-600 font-mono font-bold tracking-widest block uppercase">Patient Hub</span>
            <h1 className="text-3xl font-extrabold text-slate-800 mt-1">Hello, {user?.name}</h1>
            <p className="text-slate-500 text-xs mt-1">Monitor your queues, AI symptoms advice, and medical files.</p>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex flex-wrap gap-2 bg-white p-1 border border-slate-200 rounded-xl w-fit mb-8">
          <button
            onClick={() => setActiveTab('triage')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'triage' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Brain className="inline mr-1" size={14} />
            AI Triage & Booking
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tickets' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Clock className="inline mr-1" size={14} />
            My Queue Tickets
          </button>
          <button
            onClick={() => setActiveTab('medical')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'medical' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <FileText className="inline mr-1" size={14} />
            Medical Records
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'billing' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <DollarSign className="inline mr-1" size={14} />
            Payments
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'audit' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <ClipboardList className="inline mr-1" size={14} />
            My Activity Log
          </button>
          <button
            onClick={() => setActiveTab('ratings')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ratings' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Star className="inline mr-1" size={14} />
            Doctor Rating
          </button>
        </div>

        {/* Tab 1: AI Triage */}
        {activeTab === 'triage' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <div className="border border-slate-200 bg-white/80 rounded-2xl p-6 glass-panel relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 text-blue-600/5 pointer-events-none">
                  <Brain size={120} />
                </div>
                
                <div className="flex items-center gap-2 text-blue-600 text-xs font-mono font-bold tracking-wider mb-2">
                  <Sparkles size={14} />
                  AI SYMPTOM CHECKER & ROUTING
                </div>
                <h2 className="text-xl font-bold text-slate-800">Gemini Clinical Triage</h2>
                <p className="text-slate-600 text-xs mt-1">Describe your symptoms to receive severity assessments and department mapping.</p>

                {bookingSuccess && (
                  <div className="mt-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 text-xs font-semibold">
                    Appointment booked! Check the &quot;My Queue Tickets&quot; tab to monitor your ticket live.
                  </div>
                )}

                <form onSubmit={handleTriageSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">
                      Describe what you are feeling
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. I have a sharp pain in my chest that started 30 mins ago, along with mild sweat and nausea..."
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={triageLoading}
                    className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all font-bold text-white rounded-lg text-xs cursor-pointer shadow-md shadow-blue-500/20"
                  >
                    {triageLoading ? 'Running AI Assessment...' : 'Run Symptom Triage'}
                  </button>
                </form>

                {triageResult && (
                  <div className="mt-6 border-t border-slate-200 pt-6 animate-fadeIn">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Brain size={16} className="text-blue-600" />
                      AI Diagnostic Assessment
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mt-4 mb-4">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Assessed Severity</span>
                        <span className={`text-sm font-extrabold capitalize mt-0.5 block ${
                          triageResult.severity === 'Emergency' || triageResult.severity === 'High' ? 'text-red-600' : 
                          triageResult.severity === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {triageResult.severity}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Target Ward</span>
                        <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">{triageResult.department}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-600">
                      <span className="text-slate-600 block font-bold mb-1">Triage Recommendations:</span>
                      {triageResult.aiAdvice}
                    </div>

                    <form onSubmit={handleBookAppointment} className="mt-6 space-y-4 p-4 rounded-xl border border-blue-200 bg-blue-50">
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Instant Doctor Assignment
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1.5">Search & Select Specialist</label>
                          <input 
                            type="text" 
                            placeholder="Search by name or department (e.g. Dermatology)..." 
                            value={doctorSearch} 
                            onChange={(e) => setDoctorSearch(e.target.value)} 
                            className="w-full px-3 py-2 rounded bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500 mb-1"
                          />
                          <div className="max-h-64 overflow-y-auto space-y-2 p-1">
                            {doctors.filter(doc => doc.name.toLowerCase().includes(doctorSearch.toLowerCase()) || doc.department.toLowerCase().includes(doctorSearch.toLowerCase()))
                              .map(doc => {
                                const ratingData = doctorRatings.find(r => r.id === doc._id) || { avg_overall: 0, total_reviews: 0, top_tags: [] };
                                return { ...doc, ...ratingData };
                              })
                              .sort((a, b) => b.avg_overall - a.avg_overall || b.total_reviews - a.total_reviews)
                              .slice(0, 50).map((doc) => (
                              <div 
                                key={doc._id} 
                                onClick={() => setBookingDocId(doc._id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${bookingDocId === doc._id ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500' : 'border-slate-200 bg-white hover:border-blue-300'}`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-bold text-sm text-slate-800">{doc.name}</div>
                                    <div className="text-[10px] text-slate-500 uppercase font-semibold">{doc.department} • Cabin {doc.cabin || doc.room}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded">
                                      <Star size={12} className="fill-amber-500" /> {doc.avg_overall > 0 ? doc.avg_overall : 'New'}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">{doc.total_reviews} reviews</div>
                                  </div>
                                </div>
                                {doc.top_tags && doc.top_tags.length > 0 && (
                                  <div className="flex gap-1 mt-2 flex-wrap">
                                    {doc.top_tags.slice(0, 2).map(t => (
                                      <span key={t.tag} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">✓ {t.tag}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                            {doctors.length === 0 && <div className="text-xs text-slate-500 text-center py-4">No doctors found</div>}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1.5">Time Schedule</label>
                          <select
                            value={bookingSlot}
                            onChange={(e) => setBookingSlot(e.target.value)}
                            className="w-full px-3 py-2 rounded bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500"
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
                        className="py-2 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs active:scale-[0.98] transition-all cursor-pointer w-full"
                      >
                        Book Urgently & Join Queue
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="border border-slate-200 bg-white/80 rounded-2xl p-6 glass-panel">
                <h3 className="text-base font-bold text-slate-800 mb-4">Doctor Board Status</h3>
                
                {doctors.length === 0 ? (
                  <p className="text-slate-500 text-xs">No active doctors on duty.</p>
                ) : (
                  <div className="space-y-4">
                    {doctors.map((doc) => (
                      <div 
                        key={doc._id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between hover:border-slate-300 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-800">{doc.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium capitalize">
                            {doc.department} • {doc.hospital || 'Main Hospital'} • Cabin {doc.cabin || doc.room}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Serving Token</p>
                          <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-600 text-xs font-bold font-mono">
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
          <div className="space-y-6">
            <div className="border border-slate-200 bg-white/80 rounded-2xl p-6 glass-panel">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Your Active Tickets</h2>
              
              {appointments.length === 0 ? (
                <div className="text-center py-12 border border-slate-200 rounded-xl bg-slate-50">
                  <Clock className="mx-auto text-slate-400 mb-3" size={32} />
                  <p className="text-slate-500 text-xs">No active queue tickets registered.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                        <th className="py-3 px-4">Doctor</th>
                        <th className="py-3 px-4">Token</th>
                        <th className="py-3 px-4">Slot</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {appointments.map((appt) => (
                        <tr key={appt._id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {appt.doctorName}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                            #{appt.tokenNumber}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">{appt.timeSlot}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              appt.priority === 2 ? 'bg-red-50 text-red-600' :
                              appt.priority === 1 ? 'bg-amber-50 text-amber-600' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {appt.priority === 2 ? 'Emergency' : appt.priority === 1 ? 'High' : 'Normal'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                              appt.status === 'calling' ? 'bg-blue-600 text-white animate-pulse' :
                              appt.status === 'waiting' ? 'bg-slate-100 text-slate-600' :
                              appt.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                              'bg-red-50 text-red-600'
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
          </div>
        )}

        {/* Tab 3: Medical Records & Prescriptions */}
        {activeTab === 'medical' && (
          <div className="space-y-8">
            
            {/* Daily Manual Vitals Log */}
            <div className="border border-slate-200 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 glass-panel relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 text-indigo-600/5 pointer-events-none">
                <Activity size={120} />
              </div>
              <div className="flex items-center gap-2 text-indigo-600 text-xs font-mono font-bold tracking-wider mb-2">
                <Sparkles size={14} />
                DAILY HEALTH LOG
              </div>
              <h2 className="text-xl font-bold text-slate-800">Log Your Vitals</h2>
              <p className="text-slate-600 text-xs mt-1 mb-4">Upload your daily health metrics manually so your doctor can track your 7-day health trend.</p>
              
              {hasLoggedToday ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex flex-col gap-2 text-sm font-bold shadow-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} />
                    You have recently logged your vitals.
                  </div>
                  <div className="text-emerald-600 font-medium ml-[26px]">
                    You can submit your next health log in {timeRemaining}.
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSyncWearable} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Heart Rate (bpm)</label>
                    <input type="number" required min="30" max="250" placeholder="e.g. 75"
                      value={dailyLog.heart_rate} onChange={e => setDailyLog({...dailyLog, heart_rate: e.target.value})}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-indigo-200 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Blood O2 (%)</label>
                    <input type="number" required min="50" max="100" placeholder="e.g. 98"
                      value={dailyLog.spo2} onChange={e => setDailyLog({...dailyLog, spo2: e.target.value})}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-indigo-200 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Sleep (hrs)</label>
                    <input type="number" required step="0.1" min="0" max="24" placeholder="e.g. 7.5"
                      value={dailyLog.sleep_hours} onChange={e => setDailyLog({...dailyLog, sleep_hours: e.target.value})}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-indigo-200 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Steps Count</label>
                    <input type="number" required min="0" placeholder="e.g. 8500"
                      value={dailyLog.steps} onChange={e => setDailyLog({...dailyLog, steps: e.target.value})}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-indigo-200 focus:outline-none focus:border-indigo-500" />
                  </div>
                  
                  <div className="col-span-2 md:col-span-4 mt-2">
                    <button
                      type="submit"
                      disabled={syncingWearable}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all font-bold text-white rounded-lg text-sm cursor-pointer shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
                    >
                      <Activity size={16} />
                      {syncingWearable ? 'Saving...' : 'Submit Daily Log'}
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-6 border-t border-indigo-100 pt-6">
                <WearableTrendChart patientId={user?._id} refreshTrigger={refreshChart} />
              </div>
            </div>

            <div className="border border-slate-200 bg-white/80 rounded-2xl p-6 glass-panel">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Medication Prescriptions</h2>
              {prescriptions.length === 0 ? (
                <p className="text-slate-500 text-xs">No prescription orders found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {prescriptions.map((rx) => (
                    <div key={rx._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="flex justify-between items-start mb-3 border-b border-slate-200 pb-3">
                        <div>
                          <p className="text-xs text-slate-500">Diagnosis</p>
                          <p className="text-sm font-bold text-slate-800 capitalize">{rx.diagnosis}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          rx.status === 'dispensed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {rx.status === 'dispensed' ? 'Dispensed' : 'Preparing Packing'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {rx.medications.map((med, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-slate-600">
                            <div>
                              <p className="font-bold text-slate-800">{med.name}</p>
                              <p className="text-[10px] text-slate-500">{med.frequency} • {med.duration}</p>
                            </div>
                            <span className="font-mono text-slate-600 text-[10px]">{med.dosage}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-slate-200 bg-white/80 rounded-2xl p-6 glass-panel">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Laboratory Scans & Diagnostics</h2>
              {labRequests.length === 0 ? (
                <p className="text-slate-500 text-xs">No laboratory scan orders found.</p>
              ) : (
                <div className="space-y-4">
                  {labRequests.map((lab) => (
                    <div key={lab._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] text-blue-600 font-mono font-bold uppercase">{lab.testType}</span>
                        <p className="text-xs text-slate-500 mt-1">Requested by Dr. {lab.doctorName}</p>
                      </div>
                      <div className="flex-1 max-w-md bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">Report findings</span>
                        <span className="text-xs text-slate-600 mt-0.5 block">
                          {lab.status === 'completed' ? lab.result : 'Awaiting clinical technician report...'}
                        </span>
                        {lab.attachmentData && (
                          <a 
                            href={lab.attachmentData} 
                            download={lab.attachmentName || 'report'}
                            target="_blank" 
                            rel="noreferrer"
                            className="py-1.5 px-3 mt-3 w-fit bg-blue-50 hover:bg-blue-50 border border-blue-200 text-blue-600 font-bold rounded-lg text-[10px] cursor-pointer flex items-center transition-all"
                          >
                            <FileText size={12} className="mr-1.5" />
                            Download Attached Report
                          </a>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase w-fit h-fit ${
                        lab.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
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
          <div className="border border-slate-200 bg-white/80 rounded-2xl p-6 glass-panel">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Hospital Invoices</h2>
            {invoices.length === 0 ? (
              <p className="text-slate-500 text-xs">No invoicing statements found.</p>
            ) : (
              <div className="space-y-4">
                {invoices.map((inv) => (
                  <div key={inv._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Service Charges</p>
                      <p className="text-sm font-bold text-slate-800">{inv.description}</p>
                      <span className="text-[10px] text-slate-500 block mt-1">Date: {new Date(inv.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Total Bill</p>
                        <span className="text-base font-extrabold text-blue-600">₹{inv.amount}</span>
                      </div>
                      {inv.status === 'pending' ? (
                        <button
                          onClick={() => {
                            setPayInvoice(inv);
                            setPayMethod('UPI');
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all font-bold text-slate-800 text-xs rounded-lg cursor-pointer shadow-md shadow-blue-500/20"
                        >
                          Settle Bill
                        </button>
                      ) : (
                        <span className="px-3 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold flex items-center gap-1">
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
          <div className="border border-slate-200 bg-white/80 rounded-2xl p-6 glass-panel">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 text-blue-600 text-xs font-mono font-bold tracking-wider mb-1">
                  <ClipboardList size={14} />
                  MY PERSONAL HEALTH & ACTIVITY LOGS
                </div>
                <p className="text-slate-500 text-xs">Complete timeline of your activities, queue tickets, and health events.</p>
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
                No activity recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log, idx) => (
                  <div key={log._id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-4">
                    <div className="px-2.5 py-1 rounded text-[9px] font-bold uppercase font-sans whitespace-nowrap bg-blue-50 text-blue-500">
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



        {/* Simulated Payment Modal */}
        {payInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-sm border border-slate-200 bg-white p-6 rounded-2xl shadow-2xl relative">
              <h3 className="text-lg font-bold text-slate-800 mb-1">UPI / Cash Gateway</h3>
              <p className="text-slate-500 text-xs mb-4">Select payment mechanism for Invoice #{payInvoice._id}</p>
              <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-200 text-center">
                <span className="text-xs text-slate-600 uppercase">Amount Due</span>
                <p className="text-3xl font-extrabold text-blue-600 mt-1">₹{payInvoice.amount}</p>
                <p className="text-[10px] text-slate-500 mt-1.5">{payInvoice.description}</p>
              </div>
              <div className="mb-4">
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1.5">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500"
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
                    <div className="absolute inset-x-0 bottom-1/2 h-1 bg-blue-600 shadow-[0_0_8px_2px_rgba(20,184,166,0.6)] animate-pulse"></div>
                  </div>
                  <span className="text-slate-500 text-[10px] mt-3 font-mono font-bold uppercase">Scan with BHIM / GPay / PhonePe</span>
                </div>
              )}
              {payMethod === 'Card' && (
                <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-50 mb-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard size={16} className="text-blue-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Credit / Debit Card</span>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Card Number</label>
                    <input type="text" placeholder="1234 5678 9101 1121" className="w-full px-3 py-2 rounded bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500 font-mono tracking-widest" />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Expiry</label>
                      <input type="text" placeholder="MM/YY" className="w-full px-3 py-2 rounded bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500 font-mono" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">CVV</label>
                      <input type="password" placeholder="•••" className="w-full px-3 py-2 rounded bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500 font-mono" />
                    </div>
                  </div>
                </div>
              )}
              {payMethod === 'Cash' && (
                <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-amber-50 mb-4 border border-amber-200 text-center">
                  <Banknote size={24} className="text-amber-600 mb-2" />
                  <span className="text-amber-600 font-bold text-xs mb-1 uppercase tracking-wider">Pay at Counter</span>
                  <span className="text-slate-600 text-[10px] leading-relaxed">
                    Please proceed to the main hospital billing counter on the ground floor. Present Invoice <strong className="text-slate-800">#{payInvoice._id}</strong> to the cashier to settle your bill.
                  </span>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setPayInvoice(null)}
                  className="flex-1 py-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs cursor-pointer active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={paying}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded cursor-pointer active:scale-95 transition-all"
                >
                  {paying ? 'Verifying...' : 'Settle Now'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Doctor Rating */}
        {activeTab === 'ratings' && (
          <div className="space-y-6">
            {pendingFeedback && pendingFeedback.length > 0 ? (
              <div className="border border-amber-200 bg-amber-50 rounded-2xl p-6">
                <h3 className="text-base font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <Star size={18} className="fill-amber-500 text-amber-500" /> Pending Feedback
                </h3>
                <p className="text-xs text-amber-700 mb-4">Please rate your recent completed appointments. Your feedback helps us improve patient care.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingFeedback.map(appt => (
                    <FeedbackForm 
                      key={appt._id} 
                      appointmentId={appt._id} 
                      doctorName={appt.doctorName} 
                      onSubmitted={() => fetchData()} 
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border border-slate-200 rounded-xl bg-slate-50">
                <Star className="mx-auto text-slate-400 mb-3" size={32} />
                <p className="text-slate-500 text-xs">You have no pending feedback requests at this time.</p>
              </div>
            )}
          </div>
        )}

      </div>
      <AIChatbot />
    </ProtectedRoute>
  );
}
