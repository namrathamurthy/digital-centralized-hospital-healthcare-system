'use client';
import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import { 
  Beaker, CheckCircle, Clock, Sparkles, Send, 
  RefreshCw, ClipboardList, BookOpen 
} from 'lucide-react';

export default function LabDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [activeTab, setActiveTab] = useState('requests');
  const [activeSubTab, setActiveSubTab] = useState('pending');

  // Lab states
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // report submission states
  const [editingReqId, setEditingReqId] = useState('');
  const [findings, setFindings] = useState('');
  const [notes, setNotes] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Audit log state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchLabRequests = async () => {
    try {
      const res = await axios.get('/api/lab/requests');
      if (res.data.success) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      console.error('Error fetching lab requests:', err);
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
    fetchLabRequests();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab]);

  // Listen for real-time lab scans
  useEffect(() => {
    if (!socket) return;
    socket.on('lab_updated', () => {
      fetchLabRequests();
    });
    return () => {
      socket.off('lab_updated');
    };
  }, [socket]);

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleUploadReport = async (e) => {
    e.preventDefault();
    if (!findings.trim() || !editingReqId) return;
    setUploadLoading(true);

    try {
      let attachmentData = null;
      let attachmentMimeType = null;
      let attachmentName = null;
      
      if (attachment) {
        attachmentData = await getBase64(attachment);
        attachmentMimeType = attachment.type;
        attachmentName = attachment.name;
      }

      const res = await axios.post(`/api/lab/requests/${editingReqId}`, {
        result: findings,
        notes,
        attachmentData,
        attachmentMimeType,
        attachmentName
      });
      if (res.data.success) {
        setEditingReqId('');
        setFindings('');
        setNotes('');
        setAttachment(null);
        fetchLabRequests();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload lab report.');
    } finally {
      setUploadLoading(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const completedRequests = requests.filter((r) => r.status === 'completed');

  return (
    <ProtectedRoute allowedRoles={['lab']}>
      <div className="flex flex-col flex-1 p-6 max-w-6xl mx-auto w-full font-sans">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs text-blue-600 font-mono font-bold tracking-widest block uppercase">Diagnostics Laboratory Hub</span>
            <h1 className="text-3xl font-extrabold text-slate-800 mt-1">Hello, {user?.name}</h1>
            <p className="text-slate-500 text-xs mt-1">Review diagnostic scan requests and upload clinical test results.</p>
          </div>
        </div>

        {/* Main Tab Bar */}
        <div className="flex gap-2 bg-white p-1 border border-slate-200 rounded-xl w-fit mb-6">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'requests' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Beaker className="inline mr-1" size={13} />
            Lab Requests
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

        {/* Tab: Lab Requests */}
        {activeTab === 'requests' && (
          <>
            {/* Sub Tab Bar */}
            <div className="flex gap-3 bg-white p-1 border border-slate-200 rounded-xl w-fit mb-6">
              <button
                onClick={() => setActiveSubTab('pending')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'pending' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Clock className="inline mr-1" size={14} />
                Pending ({pendingRequests.length})
              </button>
              <button
                onClick={() => setActiveSubTab('completed')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'completed' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <CheckCircle className="inline mr-1" size={14} />
                Completed ({completedRequests.length})
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left panel: active requests list */}
              <div className="lg:col-span-7 space-y-6">
                <div className="border border-slate-200 bg-white/80 rounded-2xl p-6 glass-panel">
                  <h2 className="text-base font-bold text-slate-800 mb-4">
                    {activeSubTab === 'pending' ? 'Pending Diagnostic Scans — from Doctors' : 'Completed Lab Reports'}
                  </h2>

                  {loading ? (
                    <p className="text-slate-500 text-xs">Loading laboratory registry...</p>
                  ) : (
                    <div className="space-y-4">
                      {activeSubTab === 'pending' ? (
                        pendingRequests.length === 0 ? (
                          <p className="text-slate-500 text-xs py-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                            No pending lab scan orders.
                          </p>
                        ) : (
                          pendingRequests.map((req) => (
                            <div 
                              key={req._id}
                              className={`p-4 rounded-xl border transition-all ${
                                editingReqId === req._id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[10px] text-blue-600 font-mono font-bold uppercase">{req.testType}</span>
                                  <p className="text-sm font-bold text-slate-800 mt-1">Patient: {req.patientName}</p>
                                  <p className="text-[10px] text-slate-500 mt-1">
                                    Requested by Dr. <span className="text-slate-600 font-bold">{req.doctorName}</span>
                                  </p>
                                  {req.requestAttachmentData && (
                                    <a 
                                      href={req.requestAttachmentData} 
                                      download={req.requestAttachmentName || "lab_request.png"} 
                                      className="text-[10px] text-purple-600 font-bold hover:text-purple-600 flex items-center gap-1 mt-2"
                                    >
                                      📄 View Doctor's Request Photocopy
                                    </a>
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    setEditingReqId(req._id);
                                    setFindings('');
                                    setNotes('');
                                    setAttachment(null);
                                  }}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded-lg active:scale-95 transition-all cursor-pointer"
                                >
                                  Write Report
                                </button>
                              </div>
                            </div>
                          ))
                        )
                      ) : (
                        completedRequests.length === 0 ? (
                          <p className="text-slate-500 text-xs py-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                            No completed reports logged today.
                          </p>
                        ) : (
                          completedRequests.map((req) => (
                            <div 
                              key={req._id}
                              className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
                            >
                              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                                <div>
                                  <span className="text-[10px] text-emerald-600 font-mono font-bold uppercase">{req.testType}</span>
                                  <p className="text-sm font-bold text-slate-800 mt-1">Patient: {req.patientName}</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">Requested by Dr. {req.doctorName}</p>
                                  {req.requestAttachmentData && (
                                    <a 
                                      href={req.requestAttachmentData} 
                                      download={req.requestAttachmentName || "lab_request.png"} 
                                      className="text-[10px] text-purple-600 font-bold hover:text-purple-600 flex items-center gap-1 mt-1"
                                    >
                                      📄 View Doctor's Request Photocopy
                                    </a>
                                  )}
                                </div>
                                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 text-[9px] font-bold uppercase">
                                  Completed
                                </span>
                              </div>

                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs leading-relaxed text-slate-600">
                                <span className="text-slate-500 block font-bold mb-0.5">Lab Findings:</span>
                                {req.result}
                              </div>

                              {req.notes && (
                                <p className="text-[10px] text-slate-500">
                                  <span className="font-bold text-slate-600">Technician Notes:</span> {req.notes}
                                </p>
                              )}
                            </div>
                          ))
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right panel: report uploader form */}
              <div className="lg:col-span-5 space-y-6">
                <div className="border border-slate-200 bg-white/80 rounded-2xl p-6 glass-panel relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 text-blue-600/5 pointer-events-none">
                    <ClipboardList size={110} />
                  </div>

                  <div className="flex items-center gap-2 text-blue-600 text-xs font-mono font-bold tracking-wider mb-2">
                    <Sparkles size={14} />
                    LAB REPORT PUBLISHER
                  </div>

                  {editingReqId ? (
                    <form onSubmit={handleUploadReport} className="space-y-4 animate-fadeIn">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                        <span className="text-slate-500 block">Fulfilling Request ID</span>
                        <span className="text-slate-800 font-mono font-bold break-all mt-0.5 block">{editingReqId}</span>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1.5">
                          Laboratory Findings
                        </label>
                        <textarea
                          required
                          rows={4}
                          placeholder="e.g. Lungs are clear. No active infiltrates, effusion, or cardiomegaly..."
                          value={findings}
                          onChange={(e) => setFindings(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500"
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1.5">
                          Technician Notes (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Findings match standard references."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1.5">
                          Attachment (X-Ray / Scan Image)
                        </label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => setAttachment(e.target.files[0])}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs focus:outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-600/30 cursor-pointer"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingReqId('')}
                          className="flex-1 py-2 bg-slate-50 border border-slate-200 hover:bg-zinc-850 text-slate-600 font-bold text-xs rounded active:scale-95 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={uploadLoading}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-blue-500/20"
                        >
                          <Send size={12} />
                          {uploadLoading ? 'Uploading...' : 'Publish Report'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-12">
                      <Beaker className="mx-auto text-slate-400 mb-3" size={36} />
                      <p className="text-slate-500 text-xs font-bold">No request selected</p>
                      <p className="text-slate-500 text-[10px] mt-1">Select a pending request on the left to write and publish reports.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tab: My Audit Logs */}
        {activeTab === 'audit' && (
          <div className="border border-slate-200 bg-white/80 rounded-2xl p-6 glass-panel">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 text-blue-600 text-xs font-mono font-bold tracking-wider mb-1">
                  <ClipboardList size={14} />
                  MY LAB ACTIVITY AUDIT TRAIL
                </div>
                <p className="text-slate-500 text-xs">Reports uploaded, patients served — your personal lab technician log.</p>
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
                No lab activity recorded yet. Upload a report to see logs here.
              </p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log, idx) => (
                  <div key={log._id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-4">
                    <div className="px-2.5 py-1 rounded text-[9px] font-bold uppercase font-sans whitespace-nowrap bg-purple-50 text-purple-600">
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
