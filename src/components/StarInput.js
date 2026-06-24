'use client';
import { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarInput({ label, dim, value, onChange }) {
  const [hover, setHover] = useState(0);
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-700 font-medium text-sm">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className="focus:outline-none transition-transform hover:scale-110"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(dim, n)}
          >
            <Star
              size={20}
              className={`${
                n <= (hover || value)
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-gray-300'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
