'use client';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, Heart, Moon, Wind, Footprints, Loader2 } from 'lucide-react';

export default function WearableTrendChart({ patientId, refreshTrigger = 0 }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('heart_rate'); // 'heart_rate', 'spo2', 'sleep_hours', 'steps'

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    fetch(`/api/vitals/history/${patientId}?t=${Date.now()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.history) {
          setHistory(data.history);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [patientId, refreshTrigger]);

  if (loading) {
    return (
      <div className="p-6 rounded-xl border border-indigo-200 bg-indigo-50/50 flex flex-col items-center justify-center text-indigo-400 h-64">
        <Loader2 className="animate-spin mb-2" size={24} />
        <span className="text-xs font-bold uppercase tracking-wider">Loading Trends...</span>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center opacity-60 h-64">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Activity size={32} />
          <span className="text-sm font-bold">No historical data found</span>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    switch (activeTab) {
      case 'heart_rate':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
              <YAxis domain={['dataMin - 10', 'dataMax + 10']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
                itemStyle={{ color: '#f43f5e', fontWeight: 'bold' }}
                formatter={(val) => [`${val} bpm`, 'Heart Rate']}
              />
              <ReferenceLine y={100} stroke="#f43f5e" strokeDasharray="3 3" opacity={0.5} />
              <ReferenceLine y={60} stroke="#3b82f6" strokeDasharray="3 3" opacity={0.5} />
              <Line type="monotone" dataKey="heart_rate" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'spo2':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
              <YAxis domain={[90, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
                itemStyle={{ color: '#0ea5e9', fontWeight: 'bold' }}
                formatter={(val) => [`${val} %`, 'Blood Oxygen']}
              />
              <ReferenceLine y={95} stroke="#f59e0b" strokeDasharray="3 3" opacity={0.5} />
              <Line type="monotone" dataKey="spo2" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'sleep_hours':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
              <YAxis domain={[0, 12]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
                itemStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                formatter={(val) => [`${val} hrs`, 'Sleep']}
              />
              <ReferenceLine y={7} stroke="#22c55e" strokeDasharray="3 3" opacity={0.5} />
              <Line type="monotone" dataKey="sleep_hours" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'steps':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
              <YAxis domain={['dataMin - 1000', 'dataMax + 1000']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
                itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                formatter={(val) => [`${val} steps`, 'Steps']}
              />
              <ReferenceLine y={10000} stroke="#10b981" strokeDasharray="3 3" opacity={0.5} />
              <Line type="monotone" dataKey="steps" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mt-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">7-Day Health Trend</span>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('heart_rate')}
            className={`p-1.5 rounded-md transition-colors ${activeTab === 'heart_rate' ? 'bg-white shadow-sm text-rose-500' : 'text-slate-400 hover:text-slate-600'}`}
            title="Heart Rate"
          >
            <Heart size={14} />
          </button>
          <button
            onClick={() => setActiveTab('spo2')}
            className={`p-1.5 rounded-md transition-colors ${activeTab === 'spo2' ? 'bg-white shadow-sm text-sky-500' : 'text-slate-400 hover:text-slate-600'}`}
            title="Blood Oxygen"
          >
            <Wind size={14} />
          </button>
          <button
            onClick={() => setActiveTab('sleep_hours')}
            className={`p-1.5 rounded-md transition-colors ${activeTab === 'sleep_hours' ? 'bg-white shadow-sm text-indigo-500' : 'text-slate-400 hover:text-slate-600'}`}
            title="Sleep"
          >
            <Moon size={14} />
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`p-1.5 rounded-md transition-colors ${activeTab === 'steps' ? 'bg-white shadow-sm text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
            title="Steps"
          >
            <Footprints size={14} />
          </button>
        </div>
      </div>
      
      <div className="h-48 w-full">
        {renderChart()}
      </div>
    </div>
  );
}
