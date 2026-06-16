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
            <span className="text-xs text-teal-400 font-mono font-bold tracking-widest block uppercase">Diagnostics Laboratory Hub</span>
            <h1 className="text-3xl font-extrabold text-white mt-1">Hello, {user?.name}</h1>
            <p className="text-zinc-500 text-xs mt-1">Review diagnostic scan requests and upload clinical test results.</p>
          </div>
        </div>

        {/* Main Tab Bar */}
        <div className="flex gap-2 bg-zinc-950 p-1 border border-zinc-800 rounded-xl w-fit mb-6">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'requests' ? 'bg-teal-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Beaker className="inline mr-1" size={13} />
            Lab Requests
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

        {/* Tab: Lab Requests */}
        {activeTab === 'requests' && (
          <>
            {/* Sub Tab Bar */}
            <div className="flex gap-3 bg-zinc-950 p-1 border border-zinc-800 rounded-xl w-fit mb-6">
              <button
                onClick={() => setActiveSubTab('pending')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'pending' ? 'bg-teal-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Clock className="inline mr-1" size={14} />
                Pending ({pendingRequests.length})
              </button>
              <button
                onClick={() => setActiveSubTab('completed')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'completed' ? 'bg-teal-500 text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <CheckCircle className="inline mr-1" size={14} />
                Completed ({completedRequests.length})
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left panel: active requests list */}
              <div className="lg:col-span-7 space-y-6">
                <div className="border border-zinc-800/80 bg-zinc-950/20 rounded-2xl p-6 glass-panel">
                  <h2 className="text-base font-bold text-white mb-4">
                    {activeSubTab === 'pending' ? 'Pending Diagnostic Scans — from Doctors' : 'Completed Lab Reports'}
                  </h2>

                  {loading ? (
                    <p className="text-zinc-600 text-xs">Loading laboratory registry...</p>
                  ) : (
                    <div className="space-y-4">
                      {activeSubTab === 'pending' ? (
                        pendingRequests.length === 0 ? (
                          <p className="text-zinc-500 text-xs py-8 text-center bg-zinc-900/10 border border-zinc-850 rounded-xl">
                            No pending lab scan orders.
                          </p>
                        ) : (
                          pendingRequests.map((req) => (
                            <div 
                              key={req._id}
                              className={`p-4 rounded-xl border transition-all ${
                                editingReqId === req._id ? 'border-teal-500 bg-teal-950/5' : 'border-zinc-800 bg-zinc-900/30'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[10px] text-teal-400 font-mono font-bold uppercase">{req.testType}</span>
                                  <p className="text-sm font-bold text-white mt-1">Patient: {req.patientName}</p>
                                  <p className="text-[10px] text-zinc-500 mt-1">
                                    Requested by Dr. <span className="text-zinc-300 font-bold">{req.doctorName}</span>
                                  </p>
                                  {req.requestAttachmentData && (
                                    <a 
                                      href={req.requestAttachmentData} 
                                      download={req.requestAttachmentName || "lab_request.png"} 
                                      className="text-[10px] text-purple-400 font-bold hover:text-purple-300 flex items-center gap-1 mt-2"
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
                                  className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-[10px] rounded-lg active:scale-95 transition-all cursor-pointer"
                                >
                                  Write Report
                                </button>
                              </div>
                            </div>
                          ))
                        )
                      ) : (
                        completedRequests.length === 0 ? (
                          <p className="text-zinc-500 text-xs py-8 text-center bg-zinc-900/10 border border-zinc-850 rounded-xl">
                            No completed reports logged today.
                          </p>
                        ) : (
                          completedRequests.map((req) => (
                            <div 
                              key={req._id}
                              className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3"
                            >
                              <div className="flex justify-between items-start border-b border-zinc-800 pb-3">
                                <div>
                                  <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">{req.testType}</span>
                                  <p className="text-sm font-bold text-white mt-1">Patient: {req.patientName}</p>
                                  <p className="text-[10px] text-zinc-500 mt-0.5">Requested by Dr. {req.doctorName}</p>
                                  {req.requestAttachmentData && (
                                    <a 
                                      href={req.requestAttachmentData} 
                                      download={req.requestAttachmentName || "lab_request.png"} 
                                      className="text-[10px] text-purple-400 font-bold hover:text-purple-300 flex items-center gap-1 mt-1"
                                    >
                                      📄 View Doctor's Request Photocopy
                                    </a>
                                  )}
                                </div>
                                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[9px] font-bold uppercase">
                                  Completed
                                </span>
                              </div>

                              <div className="bg-black/35 p-3 rounded-lg border border-zinc-850 text-xs leading-relaxed text-zinc-300">
                                <span className="text-zinc-500 block font-bold mb-0.5">Lab Findings:</span>
                                {req.result}
                              </div>

                              {req.notes && (
                                <p className="text-[10px] text-zinc-500">
                                  <span className="font-bold text-zinc-400">Technician Notes:</span> {req.notes}
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
                <div className="border border-zinc-800/80 bg-zinc-950/20 rounded-2xl p-6 glass-panel relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 text-teal-500/5 pointer-events-none">
                    <ClipboardList size={110} />
                  </div>

                  <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold tracking-wider mb-2">
                    <Sparkles size={14} />
                    LAB REPORT PUBLISHER
                  </div>

                  {editingReqId ? (
                    <form onSubmit={handleUploadReport} className="space-y-4 animate-fadeIn">
                      <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800 text-xs">
                        <span className="text-zinc-500 block">Fulfilling Request ID</span>
                        <span className="text-white font-mono font-bold break-all mt-0.5 block">{editingReqId}</span>
                      </div>

                      <div>
                        <label className="block text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5">
                          Laboratory Findings
                        </label>
                        <textarea
                          required
                          rows={4}
                          placeholder="e.g. Lungs are clear. No active infiltrates, effusion, or cardiomegaly..."
                          value={findings}
                          onChange={(e) => setFindings(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-teal-500"
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5">
                          Technician Notes (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Findings match standard references."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-700 text-xs focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5">
                          Attachment (X-Ray / Scan Image)
                        </label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => setAttachment(e.target.files[0])}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 text-xs focus:outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-teal-500/20 file:text-teal-400 hover:file:bg-teal-500/30 cursor-pointer"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingReqId('')}
                          className="flex-1 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 font-bold text-xs rounded active:scale-95 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={uploadLoading}
                          className="flex-1 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-xs rounded active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-teal-500/10"
                        >
                          <Send size={12} />
                          {uploadLoading ? 'Uploading...' : 'Publish Report'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-12">
                      <Beaker className="mx-auto text-zinc-700 mb-3" size={36} />
                      <p className="text-zinc-500 text-xs font-bold">No request selected</p>
                      <p className="text-zinc-600 text-[10px] mt-1">Select a pending request on the left to write and publish reports.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tab: My Audit Logs */}
        {activeTab === 'audit' && (
          <div className="border border-zinc-800/80 bg-zinc-950/20 rounded-2xl p-6 glass-panel">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold tracking-wider mb-1">
                  <ClipboardList size={14} />
                  MY LAB ACTIVITY AUDIT TRAIL
                </div>
                <p className="text-zinc-500 text-xs">Reports uploaded, patients served — your personal lab technician log.</p>
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
                No lab activity recorded yet. Upload a report to see logs here.
              </p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log, idx) => (
                  <div key={log._id || idx} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-start gap-4">
                    <div className="px-2.5 py-1 rounded text-[9px] font-bold uppercase font-sans whitespace-nowrap bg-purple-500/10 text-purple-300">
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
