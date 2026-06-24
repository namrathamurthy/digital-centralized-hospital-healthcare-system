'use client';
import { useState } from 'react';
import StarInput from './StarInput';
import { Send, CheckCircle2 } from 'lucide-react';

export default function FeedbackForm({ appointmentId, doctorName, onSubmitted }) {
  const [scores, setScores] = useState({
    overall: 0,
    comm: 0,
    wait: 0,
    diagnosis: 0,
    bedside: 0,
  });
  const [reviewText, setReviewText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const PRESET_TAGS = ['Explains clearly', 'On time', 'Thorough examination', 'Friendly staff', 'Long wait', 'Rushed'];
  const [selectedTags, setSelectedTags] = useState([]);

  const handleScoreChange = (dim, val) => {
    setScores(prev => ({ ...prev, [dim]: val }));
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (scores.overall === 0) {
      setError('Please provide an overall rating');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          scores,
          tags: selectedTags,
          reviewText,
          isAnonymous
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
        if (onSubmitted) setTimeout(onSubmitted, 2000);
      } else {
        setError(data.error || 'Failed to submit feedback');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
        <CheckCircle2 size={48} className="text-emerald-500 mb-3" />
        <h3 className="font-bold text-emerald-800 text-lg">Thank You!</h3>
        <p className="text-emerald-600 text-sm mt-1">Your feedback helps us improve patient care.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 w-full">
      <h3 className="font-bold text-slate-800 text-lg mb-1">Rate your visit</h3>
      <p className="text-slate-500 text-xs mb-4">How was your appointment with {doctorName}?</p>
      
      {error && <div className="bg-red-50 text-red-600 text-xs p-3 rounded mb-4">{error}</div>}

      <div className="space-y-1 mb-6">
        <StarInput label="Overall Experience" dim="overall" value={scores.overall} onChange={handleScoreChange} />
        <StarInput label="Communication" dim="comm" value={scores.comm} onChange={handleScoreChange} />
        <StarInput label="Wait Time" dim="wait" value={scores.wait} onChange={handleScoreChange} />
        <StarInput label="Accurate Diagnosis" dim="diagnosis" value={scores.diagnosis} onChange={handleScoreChange} />
        <StarInput label="Bedside Manner" dim="bedside" value={scores.bedside} onChange={handleScoreChange} />
      </div>

      <div className="mb-5">
        <label className="block text-xs font-bold text-slate-700 mb-2">Select all that apply</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                selectedTags.includes(tag) 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-xs font-bold text-slate-700 mb-2">Additional Comments</label>
        <textarea
          rows={3}
          value={reviewText}
          onChange={e => setReviewText(e.target.value)}
          placeholder="Share details of your experience..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-2 mb-6">
        <input 
          type="checkbox" 
          id="anon" 
          checked={isAnonymous} 
          onChange={e => setIsAnonymous(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="anon" className="text-xs text-slate-600 cursor-pointer">Submit anonymously (your name will not be shown to the doctor)</label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors text-sm disabled:opacity-50"
      >
        {loading ? 'Submitting...' : (
          <>
            <Send size={16} /> Submit Feedback
          </>
        )}
      </button>
    </form>
  );
}
