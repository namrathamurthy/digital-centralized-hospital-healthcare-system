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
    if (action.includes('Lab')) return 'bg-purple-50 text-purple-600';
    if (action.includes('Pharmacy') || action.includes('Prescription')) return 'bg-rose-50 text-rose-600';
    if (action.includes('Invoice')) return 'bg-amber-50 text-amber-600';
    if (action.includes('Consultation') || action.includes('Completed')) return 'bg-blue-50 text-blue-500';
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <div className="flex flex-col flex-1 p-6 max-w-6xl mx-auto w-full font-sans">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs text-blue-600 font-mono font-bold tracking-widest block uppercase">Doctor Command Center</span>
            <h1 className="text-3xl font-extrabold text-slate-800 mt-1">Hello, {user?.name}</h1>
            <p className="text-slate-500 text-xs mt-1">
              {doctor?.hospital || 'Main Hospital'} • Cabin: <span className="text-slate-600 font-bold">{doctor?.cabin || doctor?.room || 'N/A'}</span> • 
              Department: <span className="text-slate-600 font-bold">{doctor?.department || 'N/A'}</span>
            </p>
          </div>

          <div className="flex gap-3">
            <div className="bg-white p-4 border border-slate-200 rounded-xl text-center min-w-[120px]">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Current Token</span>
              <span className="text-xl font-mono font-extrabold text-blue-600 block mt-1">
                #{doctor?.currentToken || '0'}
              </span>
            </div>
            <div className="bg-white p-4 border border-slate-200 rounded-xl text-center min-w-[120px]">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Waiting</span>
              <span className="text-xl font-mono font-extrabold text-slate-600 block mt-1">
                {waitingAppts.length}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-2 bg-white p-1 border border-slate-200 rounded-xl w-fit mb-6">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'queue' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Stethoscope className="inline mr-1" size={13} />
            Patient Queue
          </button>
          <button
            onClick={() => setActiveTab('lab_reports')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'lab_reports' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="inline mr-1" size={13} />
            Completed Lab Reports
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

        {/* Tab: Queue */}
        {activeTab === 'queue' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Active Consultation Panel */}
            <div className="lg:col-span-7 space-y-6">
              <div className="border border-slate-200 bg-white/80 rounded-2xl p-6 glass-panel relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 text-blue-600/5 pointer-events-none">
                  <Stethoscope size={130} />
                </div>

                <div className="flex items-center gap-2 text-blue-600 text-xs font-mono font-bold tracking-wider mb-2">
                  <Sparkles size={14} />
                  ACTIVE CONSULTATION PANEL
                </div>

                {activeAppt ? (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* Patient Info card */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <span className="text-[9px] text-slate-500 uppercase font-bold">Currently Consulting</span>
                      <p className="text-lg font-bold text-slate-800 mt-1">{activeAppt.patientName}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
                        <div>
                          <span className="text-slate-500 font-medium">Token Number:</span>
                          <span className="text-blue-600 font-mono font-bold ml-1">#{activeAppt.tokenNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Triage Priority:</span>
                          <span className={`font-bold ml-1 ${
                            activeAppt.priority === 2 ? 'text-red-600' : 
                            activeAppt.priority === 1 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {activeAppt.triageData?.severity || 'Low'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg mt-3 text-xs leading-relaxed text-slate-600">
                        <span className="text-slate-500 block font-bold mb-0.5">Reported Symptoms:</span>
                        {activeAppt.triageData?.symptoms || 'N/A'}
                      </div>
                    </div>

                    {/* Treatment form */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">
                          Clinical Diagnosis Summary
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Acute Viral Gastroenteritis, Hypertension stage 1"
                          value={diagnosis}
                          onChange={(e) => setDiagnosis(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Prescription Builder */}
                      <div className="border border-slate-200 p-4 rounded-xl bg-slate-50">
                        <span className="text-xs font-bold text-slate-800 uppercase block mb-3">Prescribe Medications → Pharmacy</span>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                          <div className="col-span-2">
                            <input
                              type="text"
                              placeholder="Medicine Name"
                              value={medName}
                              onChange={(e) => setMedName(e.target.value)}
                              className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white text-slate-800 text-xs"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Dosage (1-0-1)"
                              value={medDosage}
                              onChange={(e) => setMedDosage(e.target.value)}
                              className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white text-slate-800 text-xs"
                            />
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={handleAddMed}
                              className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                            >
                              <Plus size={12} /> Add
                            </button>
                          </div>
                        </div>

                        {meds.length > 0 && (
                          <div className="space-y-2 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            {meds.map((m, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs text-slate-600">
                                <div>
                                  <span className="font-bold text-slate-800">{m.name}</span>
                                  <span className="text-[10px] text-slate-500 ml-2">({m.frequency} • {m.duration})</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-slate-600 text-[10px]">{m.dosage}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMed(idx)}
                                    className="text-red-600 hover:text-red-300 cursor-pointer"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Prescription File Upload */}
                        <div className="mt-4 pt-3 border-t border-slate-200">
                          <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Or Upload Prescription Photocopy</label>
                          <input 
                            type="file" 
                            accept="image/*,.pdf" 
                            onChange={(e) => setPrescriptionFile(e.target.files[0])}
                            className="text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-800 hover:file:bg-zinc-700 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Lab Scans Builder */}
                      <div className="border border-slate-200 p-4 rounded-xl bg-slate-50">
                        <span className="text-xs font-bold text-slate-800 uppercase block mb-3">Order Laboratory Scans → Lab</span>
                        
                        <div className="flex gap-2">
                          <select
                            value={newLabTest}
                            onChange={(e) => setNewLabTest(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="">-- Choose Scan --</option>
                            <optgroup label="Hematology & Coagulation">
                              <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                              <option value="Erythrocyte Sedimentation Rate (ESR)">ESR</option>
                              <option value="Prothrombin Time (PT/INR)">PT/INR</option>
                              <option value="Activated Partial Thromboplastin Time (aPTT)">aPTT</option>
                              <option value="Peripheral Blood Smear">Peripheral Blood Smear</option>
                              <option value="Hemoglobin Electrophoresis">Hemoglobin Electrophoresis</option>
                              <option value="Reticulocyte Count">Reticulocyte Count</option>
                              <option value="D-Dimer">D-Dimer</option>
                              <option value="Blood Grouping & Rh Typing">Blood Grouping & Rh Typing</option>
                            </optgroup>
                            <optgroup label="Biochemistry">
                              <option value="Fasting Blood Sugar (FBS)">Fasting Blood Sugar (FBS)</option>
                              <option value="Post Prandial Blood Sugar (PPBS)">Post Prandial Blood Sugar (PPBS)</option>
                              <option value="Random Blood Sugar (RBS)">Random Blood Sugar (RBS)</option>
                              <option value="HbA1c">HbA1c</option>
                              <option value="Lipid Profile">Lipid Profile</option>
                              <option value="Liver Function Test (LFT)">Liver Function Test (LFT)</option>
                              <option value="Kidney Function Test (KFT)">Kidney Function Test (KFT)</option>
                              <option value="Serum Creatinine">Serum Creatinine</option>
                              <option value="Blood Urea Nitrogen (BUN)">BUN</option>
                              <option value="Serum Electrolytes (Sodium, Potassium, Chloride)">Electrolytes</option>
                              <option value="Serum Calcium">Serum Calcium</option>
                              <option value="Serum Uric Acid">Serum Uric Acid</option>
                              <option value="Serum Amylase & Lipase">Amylase & Lipase</option>
                              <option value="CRP (C-Reactive Protein)">CRP</option>
                              <option value="High-Sensitivity CRP (hs-CRP)">hs-CRP</option>
                            </optgroup>
                            <optgroup label="Endocrinology">
                              <option value="Thyroid Profile (T3, T4, TSH)">Thyroid Profile (T3, T4, TSH)</option>
                              <option value="Free T3, Free T4">Free T3, Free T4</option>
                              <option value="Vitamin D3">Vitamin D3</option>
                              <option value="Vitamin B12">Vitamin B12</option>
                              <option value="Testosterone">Testosterone</option>
                              <option value="Luteinizing Hormone (LH)">LH</option>
                              <option value="Follicle Stimulating Hormone (FSH)">FSH</option>
                              <option value="Prolactin">Prolactin</option>
                              <option value="Estradiol">Estradiol</option>
                              <option value="Insulin Fasting">Insulin Fasting</option>
                              <option value="Serum Cortisol">Serum Cortisol</option>
                            </optgroup>
                            <optgroup label="Immunology & Serology">
                              <option value="Widal Test (Typhoid)">Widal Test (Typhoid)</option>
                              <option value="Dengue NS1 Antigen">Dengue NS1 Antigen</option>
                              <option value="Malaria Parasite (MP)">Malaria Parasite</option>
                              <option value="Rheumatoid Factor (RA)">Rheumatoid Factor (RA)</option>
                              <option value="Anti-Nuclear Antibody (ANA)">ANA</option>
                              <option value="HIV I & II Antibodies">HIV I & II</option>
                              <option value="HBsAg (Hepatitis B)">HBsAg (Hepatitis B)</option>
                              <option value="Anti-HCV (Hepatitis C)">Anti-HCV</option>
                              <option value="Syphilis (VDRL/RPR)">Syphilis (VDRL/RPR)</option>
                              <option value="COVID-19 RT-PCR">COVID-19 RT-PCR</option>
                            </optgroup>
                            <optgroup label="Microbiology & Pathology">
                              <option value="Urine Routine Examination">Urine Routine</option>
                              <option value="Urine Culture">Urine Culture</option>
                              <option value="Stool Routine">Stool Routine</option>
                              <option value="Stool Occult Blood">Stool Occult Blood</option>
                              <option value="Sputum AFB (Tuberculosis)">Sputum AFB</option>
                              <option value="Sputum Culture">Sputum Culture</option>
                              <option value="Blood Culture">Blood Culture</option>
                              <option value="Semen Analysis">Semen Analysis</option>
                            </optgroup>
                            <optgroup label="Tumor Markers">
                              <option value="Prostate Specific Antigen (PSA)">PSA</option>
                              <option value="CA 125 (Ovarian)">CA 125 (Ovarian)</option>
                              <option value="CA 15-3 (Breast)">CA 15-3 (Breast)</option>
                              <option value="CA 19-9 (Pancreatic)">CA 19-9 (Pancreatic)</option>
                              <option value="Carcinoembryonic Antigen (CEA)">CEA</option>
                              <option value="Alpha-Fetoprotein (AFP)">AFP</option>
                            </optgroup>
                            <optgroup label="Cardiology & Pulmonology">
                              <option value="ECG / Electrocardiogram">ECG</option>
                              <option value="2D Echo">2D Echo</option>
                              <option value="TMT (Treadmill Test)">TMT (Treadmill Test)</option>
                              <option value="Holter Monitoring">Holter Monitoring</option>
                              <option value="Pulmonary Function Test (PFT)">PFT</option>
                              <option value="Troponin I & T">Troponin I & T</option>
                            </optgroup>
                            <optgroup label="Imaging & Radiology">
                              <option value="Chest X-Ray">Chest X-Ray</option>
                              <option value="X-Ray Knee">X-Ray Knee</option>
                              <option value="X-Ray Spine">X-Ray Spine</option>
                              <option value="Ultrasound Abdomen & Pelvis">USG Abdomen & Pelvis</option>
                              <option value="Ultrasound KUB">USG KUB</option>
                              <option value="Ultrasound Thyroid">USG Thyroid</option>
                              <option value="CT Scan Head">CT Scan Head</option>
                              <option value="CT Scan Chest (HRCT)">CT Scan Chest (HRCT)</option>
                              <option value="CT Scan Abdomen">CT Scan Abdomen</option>
                              <option value="MRI Brain Scan">MRI Brain Scan</option>
                              <option value="MRI Cervical Spine">MRI Cervical Spine</option>
                              <option value="MRI Lumbar Spine">MRI Lumbar Spine</option>
                              <option value="Mammography">Mammography</option>
                              <option value="DEXA Scan (Bone Density)">DEXA Scan</option>
                            </optgroup>
                          </select>
                          <button
                            type="button"
                            onClick={handleAddLab}
                            className="px-4 bg-purple-500 hover:bg-purple-400 text-slate-800 font-bold rounded text-xs cursor-pointer active:scale-95 transition-all"
                          >
                            Order Test
                          </button>
                        </div>

                        {labTests.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            {labTests.map((test, idx) => (
                              <span 
                                key={idx}
                                className="px-2.5 py-1 rounded bg-purple-50 border border-purple-200 text-purple-600 text-[10px] font-bold flex items-center gap-1.5"
                              >
                                {test}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLab(test)}
                                  className="hover:text-red-600 cursor-pointer"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Lab Test File Upload */}
                        <div className="mt-4 pt-3 border-t border-slate-200">
                          <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Or Upload Lab Request Photocopy</label>
                          <input 
                            type="file" 
                            accept="image/*,.pdf" 
                            onChange={(e) => setLabTestFile(e.target.files[0])}
                            className="text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-800 hover:file:bg-zinc-700 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => handleCancelAppointment(activeAppt._id)}
                        className="flex-1 py-3 bg-red-50 hover:bg-red-50 border border-red-200 text-red-600 active:scale-[0.98] font-bold rounded-xl transition-all cursor-pointer text-xs"
                      >
                        <Ban size={14} className="inline mr-1" />
                        Cancel Registration
                      </button>
                      <button
                        onClick={() => handleConcludeVisit(activeAppt._id)}
                        disabled={actionLoading}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] font-bold text-white rounded-xl transition-all cursor-pointer text-xs shadow-md shadow-blue-500/20"
                      >
                        <CheckCircle size={14} className="inline mr-1" />
                        Conclude & Send to Lab/Pharmacy/Billing
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Stethoscope className="mx-auto text-slate-400 mb-4 animate-pulse" size={48} />
                    <p className="text-slate-600 text-sm font-bold">No patient currently active</p>
                    <p className="text-slate-500 text-xs mt-1 mb-6">Click below to draw the next patient from the waiting list.</p>

                    <button
                      onClick={handleCallNext}
                      disabled={actionLoading || waitingAppts.length === 0}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-100 disabled:text-slate-500 active:scale-[0.98] font-bold text-white rounded-xl transition-all cursor-pointer text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 mx-auto"
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
              <div className="border border-slate-200 bg-white/80 rounded-2xl p-6 glass-panel">
                <h3 className="text-base font-bold text-slate-800 mb-4">Doctor's Queue Waiting List</h3>
                
                {loading ? (
                  <p className="text-slate-500 text-xs">Loading queue list...</p>
                ) : waitingAppts.length === 0 ? (
                  <p className="text-slate-500 text-xs py-4 text-center">No patients waiting in queue.</p>
                ) : (
                  <div className="space-y-3">
                    {waitingAppts.map((appt) => (
                      <div 
                        key={appt._id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between hover:border-slate-300 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800">{appt.patientName}</p>
                          <p className="text-[10px] text-slate-500 font-medium capitalize mt-0.5">
                            Token: #{appt.tokenNumber} • {appt.timeSlot}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                            appt.priority === 2 ? 'bg-red-50 text-red-600' :
                            appt.priority === 1 ? 'bg-amber-50 text-amber-600' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {appt.priority === 2 ? 'SOS' : appt.priority === 1 ? 'High' : 'Normal'}
                          </span>
                          
                          <button
                            onClick={() => handleCancelAppointment(appt._id)}
                            className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
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
          <div className="border border-slate-200 bg-white/80 rounded-2xl p-6 glass-panel">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Patient Lab Scan Results</h3>
            {labReports.filter(r => r.status === 'completed').length === 0 ? (
              <p className="text-slate-500 text-xs py-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                No completed lab reports found.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {labReports.filter(r => r.status === 'completed').map((report) => (
                  <div key={report._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-blue-600 font-mono font-bold uppercase">{report.testType}</span>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">Patient: {report.patientName}</p>
                      </div>
                      <span className="text-[10px] text-slate-500">{new Date(report.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs leading-relaxed text-slate-600">
                      <span className="text-slate-500 block font-bold mb-0.5">Lab Findings:</span>
                      {report.result}
                    </div>
                    {report.attachmentData && (
                      <a 
                        href={report.attachmentData} 
                        download={report.attachmentName || 'report'}
                        target="_blank" 
                        rel="noreferrer"
                        className="py-2 mt-2 bg-blue-50 hover:bg-blue-50 border border-blue-200 text-blue-600 font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center transition-all"
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
          <div className="border border-slate-200 bg-white/80 rounded-2xl p-6 glass-panel">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 text-blue-600 text-xs font-mono font-bold tracking-wider mb-1">
                  <ClipboardList size={14} />
                  MY ACTIVITY AUDIT TRAIL
                </div>
                <p className="text-slate-500 text-xs">Your personal activity log — consultations, prescriptions sent, lab tests ordered.</p>
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
                No activity recorded yet. Complete a patient consultation to see logs here.
              </p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log, idx) => (
                  <div key={log._id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-4">
                    <div className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase font-sans whitespace-nowrap ${actionColor(log.action)}`}>
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
