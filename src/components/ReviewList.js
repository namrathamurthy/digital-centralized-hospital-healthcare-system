'use client';
import { Star, ShieldCheck, Sparkles } from 'lucide-react';

export default function ReviewList({ reviews }) {
  if (!reviews || reviews.length === 0) {
    return <div className="text-gray-500 text-sm italic">No reviews yet.</div>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div key={r._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-1 text-amber-400 mb-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={14}
                    className={n <= r.score_overall ? 'fill-amber-400' : 'fill-transparent text-gray-300'}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800 text-sm">
                  {r.is_anonymous ? 'Verified Patient' : 'Verified Patient'} 
                </span>
                <span className="flex items-center text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <ShieldCheck size={12} className="mr-1" /> Verified Visit
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          
          {r.ai_summary && (
            <div className="bg-indigo-50 text-indigo-800 text-xs p-2 rounded-lg mb-3 flex items-start gap-2 border border-indigo-100">
              <Sparkles size={14} className="mt-0.5 flex-shrink-0 text-indigo-600" />
              <span><strong>AI Summary:</strong> {r.ai_summary}</span>
            </div>
          )}

          {r.review_text && (
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">"{r.review_text}"</p>
          )}

          {r.tags && r.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {r.tags.map(t => (
                <span key={t} className="bg-gray-50 text-gray-600 border border-gray-200 text-xs px-2 py-1 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
