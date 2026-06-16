'use client';
import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import { 
  Stethoscope, Users, CheckCircle, Ban, Play, ChevronRight, 
  Plus, Trash2, ShieldAlert, Sparkles, FileSpreadsheet, ClipboardList, RefreshCw
} from 'lucide-react';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [activeTab, setActiveTab] = useState('queue');

  // Queue state
  const [appointments, setAppointments] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Diagnosis / Treatment builder state
  const [diagnosis, setDiagnosis] = useState('');
  const [meds, setMeds] = useState([]);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('1-0-1');
  const [medFreq, setMedFreq] = useState('After Food');
  const [medDuration, setMedDuration] = useState('5 Days');
  const [labTests, setLabTests] = useState([]);
  const [newLabTest, setNewLabTest] = useState('');
  const [labReports, setLabReports] = useState([]);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [labTestFile, setLabTestFile] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchQueue = async () => {
    try {
      const res = await axios.get('/api/doctor/patients');
      if (res.data.success) {
        setAppointments(res.data.appointments);
        setDoctor(res.data.doctor);
      }
      const labRes = await axios.get('/api/lab/requests');
      if (labRes.data.success) {
        setLabReports(labRes.data.requests);
      }
    } catch (err) {
      console.error('Error fetching doctor queue:', err);
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
    fetchQueue();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab]);

  // Listen for real-time queue changes
  useEffect(() => {
    if (!socket) return;
    socket.on('queue_updated', () => {
      fetchQueue();
    });
    return () => {
      socket.off('queue_updated');
    };
  }, [socket]);

  const handleCallNext = async () => {
    setActionLoading(true);
    try {
      const res = await axios.post('/api/doctor/next');
      if (res.data.success) {
        setDiagnosis('');
        setMeds([]);
        setLabTests([]);
        fetchQueue();
      }
    } catch (err) {
      console.error(err);
      alert('Error transitioning queue');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMed = () => {
    if (!medName.trim()) return;
    setMeds([...meds, { name: medName, dosage: medDosage, frequency: medFreq, duration: medDuration }]);
    setMedName('');
  };

  const handleRemoveMed = (idx) => {
    setMeds(meds.filter((_, i) => i !== idx));
  };

  const handleAddLab = () => {
    if (!newLabTest.trim()) return;
    setLabTests([...labTests, newLabTest]);
    setNewLabTest('');
  };

  const handleRemoveLab = (testName) => {
    setLabTests(labTests.filter(t => t !== testName));
  };

  const handleConcludeVisit = async (apptId) => {
    if (!diagnosis.trim()) {
      alert('Please enter a diagnosis summary before concluding the visit.');
      return;
    }
    setActionLoading(true);

    const finalLabTests = [...labTests];
    if (newLabTest.trim() && !finalLabTests.includes(newLabTest.trim())) {
      finalLabTests.push(newLabTest.trim());
    }

    const finalMeds = [...meds];
    if (medName.trim()) {
      finalMeds.push({
        name: medName.trim(),
        dosage: medDosage,
        frequency: medFreq,
        duration: medDuration
      });
    }

    // Helper to read file as base64
    const readFileAsBase64 = (file) => {
      return new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({
          data: reader.result,
          name: file.name,
          mimeType: file.type
        });
        reader.onerror = error => reject(error);
      });
    };

    let prescriptionFileData = null;
    let labTestFileData = null;

    try {
      if (prescriptionFile) prescriptionFileData = await readFileAsBase64(prescriptionFile);
      if (labTestFile) labTestFileData = await readFileAsBase64(labTestFile);

      const res = await axios.post('/api/doctor/complete-current', {
        appointmentId: apptId,
        diagnosis,
        medications: finalMeds,
        labTests: finalLabTests,
        prescriptionFile: prescriptionFileData,
        labTestFile: labTestFileData
      });
      if (res.data.success) {
        setDiagnosis('');
        setMeds([]);
        setLabTests([]);
        setMedName('');
        setNewLabTest('');
        setPrescriptionFile(null);
        setLabTestFile(null);
        fetchQueue();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to conclude session.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAppointment = async (apptId) => {
    if (!confirm('Are you sure you want to cancel this appointment ticket?')) return;
    try {
      const res = await axios.post(`/api/doctor/cancel/${apptId}`);
      if (res.data.success) {
        fetchQueue();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to cancel appointment.');
    }
  };

  const activeAppt = appointments.find((a) => a.status === 'calling');
  const waitingAppts = appointments.filter((a) => a.status === 'waiting');

  const actionColor = (action) => {
    if (action.includes('Lab')) return 'bg-purple-500/10 text-purple-300';
    if (action.includes('Pharmacy') || action.includes('Prescription')) return 'bg-rose-500/10 text-rose-300';
    if (action.includes('Invoice')) return 'bg-amber-500/10 text-amber-300';
    if (action.includes('Consultation') || action.includes('Completed')) return 'bg-teal-500/10 text-teal-300';
    return 'bg-zinc-800 text-zinc-400';
  };

  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <div className="flex flex-col flex-1 p-6 max-w-6xl mx-auto w-full font-sans">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs text-teal-400 font-mono font-bold tracking-widest block uppercase">Doctor Command Center</span>
            <h1 className="text-3xl font-extrabold text-white mt-1">Hello, {user?.name}</h1>
            <p className="text-zinc-500 text-xs mt-1">
              {doctor?.hospital || 'Main Hospital'} • Cabin: <span className="text-zinc-300 font-bold">{doctor?.cabin || doctor?.room || 'N/A'}</span> • 
              Department: <span className="text-zinc-300 font-bold">{doctor?.department || 'N/A'}</span>
            </p>
          </div>

          <div className="flex gap-3">
            <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl text-center min-w-[120px]">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Current Token</span>
              <span className="text-xl font-mono font-extrabold text-teal-400 block mt-1">
                #{doctor?.currentToken || '0'}
              </span>
            </div>
            <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl text-center min-w-[120px]">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Waiting</span>
              <span className="text-xl font-mono font-extrabold text-zinc-300 block mt-1">
                {waitingAppts.length}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-2 bg-zinc-950 p-1 border border-zinc-800 rounded-xl w-fit mb-6">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'queue' ? 'bg-teal-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Stethoscope className="inline mr-1" size={13} />
            Patient Queue
          </button>
          <button
            onClick={() => setActiveTab('lab_reports')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'lab_reports' ? 'bg-teal-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="inline mr-1" size={13} />
            Completed Lab Reports
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

        {/* Tab: Queue */}
        {activeTab === 'queue' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Active Consultation Panel */}
            <div className="lg:col-span-7 space-y-6">
              <div className="border border-zinc-800/80 bg-zinc-950/20 rounded-2xl p-6 glass-panel relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 text-teal-500/5 pointer-events-none">
                  <Stethoscope size={130} />
                </div>

                <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold tracking-wider mb-2">
                  <Sparkles size={14} />
                  ACTIVE CONSULTATION PANEL
                </div>

                {activeAppt ? (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* Patient Info card */}
                    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold">Currently Consulting</span>
                      <p className="text-lg font-bold text-white mt-1">{activeAppt.patientName}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
                        <div>
                          <span className="text-zinc-500 font-medium">Token Number:</span>
                          <span className="text-teal-400 font-mono font-bold ml-1">#{activeAppt.tokenNumber}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 font-medium">Triage Priority:</span>
                          <span className={`font-bold ml-1 ${
                            activeAppt.priority === 2 ? 'text-red-400' : 
                            activeAppt.priority === 1 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {activeAppt.triageData?.severity || 'Low'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-black/40 border border-zinc-800/40 p-3 rounded-lg mt-3 text-xs leading-relaxed text-zinc-300">
                        <span className="text-zinc-500 block font-bold mb-0.5">Reported Symptoms:</span>
                        {activeAppt.triageData?.symptoms || 'N/A'}
                      </div>
                    </div>

                    {/* Treatment form */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-2">
                          Clinical Diagnosis Summary
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Acute Viral Gastroenteritis, Hypertension stage 1"
                          value={diagnosis}
                          onChange={(e) => setDiagnosis(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      {/* Prescription Builder */}
                      <div className="border border-zinc-800/80 p-4 rounded-xl bg-zinc-900/30">
                        <span className="text-xs font-bold text-white uppercase block mb-3">Prescribe Medications → Pharmacy</span>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                          <div className="col-span-2">
                            <input
                              type="text"
                              placeholder="Medicine Name"
                              value={medName}
                              onChange={(e) => setMedName(e.target.value)}
                              className="w-full px-2 py-1.5 rounded border border-zinc-800 bg-zinc-950 text-white text-xs"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Dosage (1-0-1)"
                              value={medDosage}
                              onChange={(e) => setMedDosage(e.target.value)}
                              className="w-full px-2 py-1.5 rounded border border-zinc-800 bg-zinc-950 text-white text-xs"
                            />
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={handleAddMed}
                              className="w-full py-1.5 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded text-xs cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                            >
                              <Plus size={12} /> Add
                            </button>
                          </div>
                        </div>

                        {meds.length > 0 && (
                          <div className="space-y-2 mt-2 bg-black/40 p-3 rounded-lg border border-zinc-850">
                            {meds.map((m, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs text-zinc-300">
                                <div>
                                  <span className="font-bold text-zinc-200">{m.name}</span>
                                  <span className="text-[10px] text-zinc-500 ml-2">({m.frequency} • {m.duration})</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-zinc-400 text-[10px]">{m.dosage}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMed(idx)}
                                    className="text-red-400 hover:text-red-300 cursor-pointer"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Prescription File Upload */}
                        <div className="mt-4 pt-3 border-t border-zinc-800/80">
                          <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Or Upload Prescription Photocopy</label>
                          <input 
                            type="file" 
                            accept="image/*,.pdf" 
                            onChange={(e) => setPrescriptionFile(e.target.files[0])}
                            className="text-xs text-zinc-400 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Lab Scans Builder */}
                      <div className="border border-zinc-800/80 p-4 rounded-xl bg-zinc-900/30">
                        <span className="text-xs font-bold text-white uppercase block mb-3">Order Laboratory Scans → Lab</span>
                        
                        <div className="flex gap-2">
                          <select
                            value={newLabTest}
                            onChange={(e) => setNewLabTest(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-teal-500 cursor-pointer"
                          >
                            <option value="">-- Choose Scan --</option>
                            <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                            <option value="Chest X-Ray">Chest X-Ray</option>
                            <option value="ECG / Electrocardiogram">ECG / Electrocardiogram</option>
                            <option value="MRI Brain Scan">MRI Brain Scan</option>
                            <option value="Kidney Function Test (KFT)">Kidney Function Test (KFT)</option>
                          </select>
                          <button
                            type="button"
                            onClick={handleAddLab}
                            className="px-4 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded text-xs cursor-pointer active:scale-95 transition-all"
                          >
                            Order Test
                          </button>
                        </div>

                        {labTests.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3 p-3 bg-black/40 border border-zinc-850 rounded-lg">
                            {labTests.map((test, idx) => (
                              <span 
                                key={idx}
                                className="px-2.5 py-1 rounded bg-purple-500/15 border border-purple-500/20 text-purple-300 text-[10px] font-bold flex items-center gap-1.5"
                              >
                                {test}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLab(test)}
                                  className="hover:text-red-400 cursor-pointer"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Lab Test File Upload */}
                        <div className="mt-4 pt-3 border-t border-zinc-800/80">
                          <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Or Upload Lab Request Photocopy</label>
                          <input 
                            type="file" 
                            accept="image/*,.pdf" 
                            onChange={(e) => setLabTestFile(e.target.files[0])}
                            className="text-xs text-zinc-400 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => handleCancelAppointment(activeAppt._id)}
                        className="flex-1 py-3 bg-red-950/20 hover:bg-red-900/40 border border-red-500/20 text-red-400 active:scale-[0.98] font-bold rounded-xl transition-all cursor-pointer text-xs"
                      >
                        <Ban size={14} className="inline mr-1" />
                        Cancel Registration
                      </button>
                      <button
                        onClick={() => handleConcludeVisit(activeAppt._id)}
                        disabled={actionLoading}
                        className="flex-1 py-3 bg-teal-500 hover:bg-teal-400 active:scale-[0.98] font-bold text-zinc-950 rounded-xl transition-all cursor-pointer text-xs shadow-md shadow-teal-500/15"
                      >
                        <CheckCircle size={14} className="inline mr-1" />
                        Conclude & Send to Lab/Pharmacy/Billing
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Stethoscope className="mx-auto text-zinc-700 mb-4 animate-pulse" size={48} />
                    <p className="text-zinc-400 text-sm font-bold">No patient currently active</p>
                    <p className="text-zinc-600 text-xs mt-1 mb-6">Click below to draw the next patient from the waiting list.</p>

                    <button
                      onClick={handleCallNext}
                      disabled={actionLoading || waitingAppts.length === 0}
                      className="px-6 py-3 bg-teal-500 hover:bg-teal-400 disabled:bg-zinc-800 disabled:text-zinc-600 active:scale-[0.98] font-bold text-zinc-950 rounded-xl transition-all cursor-pointer text-xs shadow-lg shadow-teal-500/10 flex items-center gap-2 mx-auto"
                    >
                      <Play size={12} fill="currentColor" />
                      Call Next Patient
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Waiting List Queue */}
            <div className="lg:col-span-5 space-y-6">
              <div className="border border-zinc-800/80 bg-zinc-950/20 rounded-2xl p-6 glass-panel">
                <h3 className="text-base font-bold text-white mb-4">Doctor's Queue Waiting List</h3>
                
                {loading ? (
                  <p className="text-zinc-600 text-xs">Loading queue list...</p>
                ) : waitingAppts.length === 0 ? (
                  <p className="text-zinc-600 text-xs py-4 text-center">No patients waiting in queue.</p>
                ) : (
                  <div className="space-y-3">
                    {waitingAppts.map((appt) => (
                      <div 
                        key={appt._id}
                        className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-center justify-between hover:border-zinc-700 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-zinc-100">{appt.patientName}</p>
                          <p className="text-[10px] text-zinc-500 font-medium capitalize mt-0.5">
                            Token: #{appt.tokenNumber} • {appt.timeSlot}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                            appt.priority === 2 ? 'bg-red-500/10 text-red-400' :
                            appt.priority === 1 ? 'bg-amber-500/10 text-amber-400' :
                            'bg-zinc-800 text-zinc-500'
                          }`}>
                            {appt.priority === 2 ? 'SOS' : appt.priority === 1 ? 'High' : 'Normal'}
                          </span>
                          
                          <button
                            onClick={() => handleCancelAppointment(appt._id)}
                            className="p-1.5 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                            title="Cancel ticket"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Completed Lab Reports */}
        {activeTab === 'lab_reports' && (
          <div className="border border-zinc-800/80 bg-zinc-950/20 rounded-2xl p-6 glass-panel">
            <h3 className="text-xl font-bold text-white mb-6">Patient Lab Scan Results</h3>
            {labReports.filter(r => r.status === 'completed').length === 0 ? (
              <p className="text-zinc-500 text-xs py-8 text-center bg-zinc-900/10 border border-zinc-850 rounded-xl">
                No completed lab reports found.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {labReports.filter(r => r.status === 'completed').map((report) => (
                  <div key={report._id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-teal-400 font-mono font-bold uppercase">{report.testType}</span>
                        <p className="text-sm font-bold text-white mt-0.5">Patient: {report.patientName}</p>
                      </div>
                      <span className="text-[10px] text-zinc-500">{new Date(report.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="bg-black/35 p-3 rounded-lg border border-zinc-850 text-xs leading-relaxed text-zinc-300">
                      <span className="text-zinc-500 block font-bold mb-0.5">Lab Findings:</span>
                      {report.result}
                    </div>
                    {report.attachmentData && (
                      <a 
                        href={report.attachmentData} 
                        download={report.attachmentName || 'report'}
                        target="_blank" 
                        rel="noreferrer"
                        className="py-2 mt-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-400 font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center transition-all"
                      >
                        <FileSpreadsheet size={14} className="mr-1.5" />
                        Download Attached Report
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: My Activity Audit Logs */}
        {activeTab === 'audit' && (
          <div className="border border-zinc-800/80 bg-zinc-950/20 rounded-2xl p-6 glass-panel">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold tracking-wider mb-1">
                  <ClipboardList size={14} />
                  MY ACTIVITY AUDIT TRAIL
                </div>
                <p className="text-zinc-500 text-xs">Your personal activity log — consultations, prescriptions sent, lab tests ordered.</p>
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
                No activity recorded yet. Complete a patient consultation to see logs here.
              </p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log, idx) => (
                  <div key={log._id || idx} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-start gap-4">
                    <div className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase font-sans whitespace-nowrap ${actionColor(log.action)}`}>
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
      </div>
    </ProtectedRoute>
  );
}
