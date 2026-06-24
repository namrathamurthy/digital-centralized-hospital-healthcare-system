import { useState, useEffect } from 'react';
import { Activity, Heart, Moon, Wind, Footprints, Sparkles, Loader2 } from 'lucide-react';

export default function WearableVitalsSidebar({ patientId }) {
  const [vitals, setVitals] = useState(null);
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/vitals/latest/${patientId}`).then(r => r.json()),
      fetch(`/api/vitals/brief/${patientId}`).then(r => r.json()),
    ]).then(([v, b]) => {
      if (v.success && v.vitals) {
        setVitals(v.vitals);
      } else {
        setVitals(null);
      }
      if (b.success && b.brief) {
        setBrief(b.brief);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [patientId]);

  if (loading) {
    return (
      <div className="p-6 rounded-xl border border-indigo-200 bg-indigo-50/50 flex flex-col items-center justify-center text-indigo-400">
        <Loader2 className="animate-spin mb-2" size={24} />
        <span className="text-xs font-bold uppercase tracking-wider">Syncing Wearables...</span>
      </div>
    );
  }

  if (!vitals) {
    return (
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between opacity-60">
        <div className="flex items-center gap-3 text-slate-500">
          <Activity size={20} />
          <span className="text-xs font-bold">No Wearable Data Synced</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-gradient-to-b from-indigo-50/80 to-white overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-indigo-100 flex items-center justify-between bg-indigo-50/50">
        <div className="flex items-center gap-2 text-indigo-700">
          <Activity size={16} />
          <span className="text-[11px] font-bold uppercase tracking-wider">Wearable Vitals · Last 7 Days</span>
        </div>
        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-bold uppercase rounded">
          {vitals.heart_rate?.source || 'Smartwatch'}
        </span>
      </div>

      <div className="p-4 grid grid-cols-2 gap-3">
        {/* Heart Rate */}
        <div className="bg-white border border-rose-100 rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-rose-500 mb-1">
            <Heart size={14} />
            <span className="text-[10px] font-bold uppercase">Resting HR</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-slate-800">{vitals.heart_rate?.value || '--'}</span>
            <span className="text-[10px] text-slate-500 font-bold">{vitals.heart_rate?.unit || 'bpm'}</span>
          </div>
        </div>

        {/* SpO2 */}
        <div className="bg-white border border-sky-100 rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-sky-500 mb-1">
            <Wind size={14} />
            <span className="text-[10px] font-bold uppercase">Blood O2</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-slate-800">{vitals.spo2?.value || '--'}</span>
            <span className="text-[10px] text-slate-500 font-bold">{vitals.spo2?.unit || '%'}</span>
          </div>
        </div>

        {/* Sleep */}
        <div className="bg-white border border-indigo-100 rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-indigo-500 mb-1">
            <Moon size={14} />
            <span className="text-[10px] font-bold uppercase">Sleep Avg</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-slate-800">{vitals.sleep_hours?.value || '--'}</span>
            <span className="text-[10px] text-slate-500 font-bold">{vitals.sleep_hours?.unit || 'hrs'}</span>
          </div>
        </div>

        {/* Steps */}
        <div className="bg-white border border-emerald-100 rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-emerald-500 mb-1">
            <Footprints size={14} />
            <span className="text-[10px] font-bold uppercase">Daily Steps</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-slate-800">{vitals.steps?.value || '--'}</span>
            <span className="text-[10px] text-slate-500 font-bold">{vitals.steps?.unit || 'count'}</span>
          </div>
        </div>
      </div>

      {/* AI Brief */}
      {brief && (
        <div className="mx-4 mb-4 mt-1 p-3 bg-indigo-50/80 border border-indigo-100 rounded-lg">
          <div className="flex items-center gap-1.5 text-indigo-600 mb-1.5">
            <Sparkles size={12} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Gemini Clinical Brief</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {brief}
          </p>
        </div>
      )}
    </div>
  );
}
