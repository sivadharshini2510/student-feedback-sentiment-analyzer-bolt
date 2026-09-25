import { useMemo } from 'react';

interface SentimentGaugeProps {
  score: number; // -1 to 1
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export function SentimentGauge({ score, label, confidence }: SentimentGaugeProps) {
  const angle = useMemo(() => {
    // Map -1..1 to -90..90 degrees
    return score * 90;
  }, [score]);

  const labelColor = {
    positive: 'text-emerald-600',
    negative: 'text-rose-600',
    neutral: 'text-amber-500',
  }[label];

  const bgColor = {
    positive: 'from-emerald-400 to-teal-500',
    negative: 'from-rose-400 to-red-500',
    neutral: 'from-amber-400 to-orange-500',
  }[label];

  const scorePercent = Math.round(((score + 1) / 2) * 100);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Gauge */}
      <div className="relative w-64 h-36">
        <svg viewBox="0 0 200 120" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Color segments */}
          <path
            d="M 20 110 A 80 80 0 0 1 70 40"
            fill="none"
            stroke="#fb7185"
            strokeWidth="14"
            strokeLinecap="round"
            opacity="0.3"
          />
          <path
            d="M 70 40 A 80 80 0 0 1 130 40"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="14"
            strokeLinecap="round"
            opacity="0.3"
          />
          <path
            d="M 130 40 A 80 80 0 0 1 180 110"
            fill="none"
            stroke="#34d399"
            strokeWidth="14"
            strokeLinecap="round"
            opacity="0.3"
          />
          {/* Active arc */}
          <path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray="251.3"
            strokeDashoffset={251.3 - (251.3 * scorePercent) / 100}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
          {/* Needle */}
          <g
            transform={`rotate(${angle} 100 110)`}
            style={{ transition: 'transform 0.8s ease-out' }}
          >
            <line
              x1="100" y1="110"
              x2="100" y2="45"
              stroke="#1f2937"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="100" cy="110" r="8" fill="#1f2937" />
          </g>
        </svg>
      </div>

      {/* Label */}
      <div className="text-center">
        <div className={`text-2xl font-bold capitalize ${labelColor}`}>{label}</div>
        <div className="text-sm text-slate-500 mt-1">
          Score: {score.toFixed(2)} · Confidence: {Math.round(confidence * 100)}%
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Negative</span>
          <span>Neutral</span>
          <span>Positive</span>
        </div>
        <div className="h-2 rounded-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400 relative">
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-slate-700 shadow-md bg-gradient-to-br ${bgColor}`}
            style={{
              left: `calc(${scorePercent}% - 8px)`,
              transition: 'left 0.8s ease-out',
            }}
          />
        </div>
      </div>
    </div>
  );
}
