'use client';
import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import { 
  Users, UserPlus, Stethoscope, AlertTriangle, Trash2, ArrowUpCircle, 
  CheckCircle, ShieldAlert, Sparkles, RefreshCw, X 
} from 'lucide-react';

export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  // Receptionist states
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [activeSOS, setActiveSOS] = useState([]);
  const [loading, setLoading] = useState(true);

  // Walk-in form states
  const [patientName, setPatientName] = useState('');
  const [bookingDocId, setBookingDocId] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState('Low');
  const [aiAdvice, setAiAdvice] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Cabin assignment states
  const [editingCabin, setEditingCabin] = useState(null);
  const [tempCabin, setTempCabin] = useState('');

  const fetchData = async () => {
    try {
      const docsRes = await axios.get('/api/queue/doctors');
      if (docsRes.data.success) setDoctors(docsRes.data.doctors);

      const apptRes = await axios.get('/api/receptionist/queue');
      if (apptRes.data.success) setAppointments(apptRes.data.appointments);

      const sosRes = await axios.get('/api/sos/active');
      if (sosRes.data.success) setActiveSOS(sosRes.data.alerts);
    } catch (err) {
      console.error('Error fetching receptionist data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for real-time queue, billing, or emergency updates
  useEffect(() => {
    if (!socket) return;

    socket.on('queue_updated', () => {
      fetchData();
    });

    socket.on('sos_alert', () => {
      fetchData();
    });

    socket.on('sos_dismissed', () => {
      fetchData();
    });

    return () => {
      socket.off('queue_updated');
      socket.off('sos_alert');
      socket.off('sos_dismissed');
    };
  }, [socket]);

  // Walk-in Booking
  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    if (!patientName || !bookingDocId) return;
    setBookingLoading(true);
    setBookingSuccess(false);

    try {
      const res = await axios.post('/api/queue/walk-in', {
        patientName,
        doctorId: bookingDocId,
        symptoms: symptoms || 'Walk-in booking',
        severity,
        aiAdvice: aiAdvice || 'Receptionist scheduled walk-in.'
      });
      if (res.data.success) {
        setBookingSuccess(true);
        setPatientName('');
        setSymptoms('');
        setSeverity('Low');
        setAiAdvice('');
        fetchData();
        setTimeout(() => setBookingSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to register walk-in patient.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Modify priority
  const handlePrioritize = async (apptId, newPriority) => {
    try {
      const res = await axios.post('/api/queue/prioritize', {
        appointmentId: apptId,
        priority: Number(newPriority)
      });
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to change priority.');
    }
  };

  // Cancel check-in
  const handleCancelCheckIn = async (apptId) => {
    if (!confirm('Are you sure you want to cancel this ticket?')) return;
    try {
      const res = await axios.post(`/api/doctor/cancel/${apptId}`);
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to cancel ticket.');
    }
  };

  // Dismiss SOS Alert
  const handleDismissSOS = async (alertId) => {
    try {
      const res = await axios.post(`/api/sos/dismiss/${alertId}`);
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to dismiss alert.');
    }
  };
  // Assign Cabin
  const handleAssignCabin = async (doctorId) => {
    try {
      const res = await axios.post('/api/doctor/assign-cabin', {
        doctorId,
        newCabin: tempCabin
      });
      if (res.data.success) {
        setEditingCabin(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to assign cabin.');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['receptionist']}>
      <div className="flex flex-col flex-1 p-6 max-w-6xl mx-auto w-full font-sans">
        
        {/* Header telemetry */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs text-blue-600 font-mono font-bold tracking-widest block uppercase">Reception Command Center</span>
            <h1 className="text-3xl font-extrabold text-slate-800 mt-1">Hello, {user?.name}</h1>
            <p className="text-slate-500 text-xs mt-1">Register walk-in clients, audit queues, and monitor SOS triggers.</p>
          </div>

          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-800 rounded-lg active:scale-95 transition-all text-xs font-bold cursor-pointer"
          >
            <RefreshCw size={12} />
            Refurbish Boards
          </button>
        </div>

        {/* SOS Warnings banner if any */}
        {activeSOS.length > 0 && (
          <div className="border border-red-500 bg-red-50 p-4 rounded-xl mb-8 flex flex-col gap-3 animate-pulse">
            <span className="text-xs font-extrabold text-red-600 flex items-center gap-1.5 uppercase tracking-wide">
              <ShieldAlert size={16} />
              {activeSOS.length} Active Emergency Alarms Triggered
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeSOS.map((alert) => (
                <div key={alert._id} className="p-3 bg-slate-50 border border-red-200 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{alert.patientName} ({alert.location})</p>
                    <p className="text-slate-600 mt-0.5">{alert.symptoms}</p>
                  </div>
                  <button
                    onClick={() => handleDismissSOS(alert._id)}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-slate-800 font-bold rounded text-[10px] cursor-pointer"
                  >
                    Acknowledge
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Walk-in Check-in counter */}
          <div className="lg:col-span-4 space-y-6">
            <div className="border border-slate-200 bg-white/80 rounded-2xl p-6 glass-panel relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 text-blue-600/5 pointer-events-none">
                <UserPlus size={100} />
              </div>

              <div className="flex items-center gap-2 text-blue-600 text-xs font-mono font-bold tracking-wider mb-2">
                <Sparkles size={14} />
                WALK-IN CHECK-IN SYSTEM
              </div>
              <h2 className="text-lg font-bold text-slate-800">Guest Registration</h2>
              <p className="text-slate-500 text-xs mt-0.5">Enter walk-in details to print queue slips.</p>

              {bookingSuccess && (
                <div className="mt-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 text-xs font-semibold">
                  Walk-in check-in registered! Token assigned.
                </div>
              )}

              <form onSubmit={handleWalkInSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mary Clark"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                    Assign Doctor
                  </label>
                  <select
                    required
                    value={bookingDocId}
                    onChange={(e) => setBookingDocId(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">-- Choose Specialist --</option>
                    {doctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        {doc.name} ({doc.department}) • Room {doc.room}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                      Urgency
                    </label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      className="w-full px-2 py-2 rounded border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Low">Low Urgency</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High Priority</option>
                      <option value="Emergency">Emergency (SOS)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                      Complications
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mild headache, fever"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-blue-500/20"
                >
                  {bookingLoading ? 'Registering...' : 'Print Queue Slip'}
                </button>
              </form>
            </div>

            {/* Doctor Serving details */}
            <div className="border border-slate-200 bg-white/80 rounded-2xl p-6 glass-panel">
              <h3 className="text-base font-bold text-slate-800 mb-4">Doctor Serving Telemetry</h3>
              <div className="space-y-3">
                {doctors.map((doc) => (
                  <div key={doc._id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{doc.name}</p>
                      <div className="text-slate-500 text-[10px] mt-0.5 flex items-center gap-1">
                        {doc.department} • 
                        {editingCabin === doc._id ? (
                          <div className="flex items-center gap-1">
                            Cabin 
                            <input 
                              type="text" 
                              value={tempCabin}
                              onChange={(e) => setTempCabin(e.target.value)}
                              className="px-1 py-0.5 w-16 bg-white border border-slate-300 rounded text-slate-800 focus:border-blue-500 outline-none"
                              autoFocus
                            />
                            <button onClick={() => handleAssignCabin(doc._id)} className="bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold hover:bg-blue-500">Save</button>
                            <button onClick={() => setEditingCabin(null)} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold hover:bg-zinc-700">Cancel</button>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 group cursor-pointer" onClick={() => { setEditingCabin(doc._id); setTempCabin(doc.cabin || doc.room || ''); }}>
                            Cabin {doc.cabin || doc.room || 'N/A'}
                            <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity underline ml-1">Edit</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-mono font-bold">
                      #{doc.currentToken || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Global Queue Control Board */}
          <div className="lg:col-span-8 space-y-6">
            <div className="border border-slate-200 bg-white/80 rounded-2xl p-6 glass-panel">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Ecosystem Active Queue tickets</h2>

              {loading ? (
                <p className="text-slate-500 text-xs">Loading active queue...</p>
              ) : appointments.length === 0 ? (
                <p className="text-slate-500 text-xs py-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                  No active appointments booked for today.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                        <th className="py-3 px-3">Patient</th>
                        <th className="py-3 px-3">Doctor</th>
                        <th className="py-3 px-3">Token</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-center">Priority Control</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850">
                      {appointments.map((appt) => (
                        <tr key={appt._id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-3 font-semibold text-slate-800">
                            {appt.patientName}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600">
                            {appt.doctorName}
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-blue-600">
                            #{appt.tokenNumber}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold capitalize ${
                              appt.status === 'calling' ? 'bg-blue-600 text-white animate-pulse' :
                              appt.status === 'waiting' ? 'bg-slate-100 text-slate-600' :
                              appt.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                              'bg-red-50 text-red-600'
                            }`}>
                              {appt.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            {appt.status === 'waiting' ? (
                              <select
                                value={appt.priority}
                                onChange={(e) => handlePrioritize(appt._id, e.target.value)}
                                className="px-2 py-1 rounded bg-white border border-slate-200 text-slate-800 text-[10px] focus:outline-none cursor-pointer"
                              >
                                <option value="0">Normal</option>
                                <option value="1">High</option>
                                <option value="2">Emergency (SOS)</option>
                              </select>
                            ) : (
                              <span className="text-slate-500 text-[10px] font-mono">Completed</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                              <button
                                onClick={() => handleCancelCheckIn(appt._id)}
                                className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                                title="Cancel check-in"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
