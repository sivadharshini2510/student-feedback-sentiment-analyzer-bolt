import type { SentimentResult } from '@/lib/sentiment';

interface KeywordBreakdownProps {
  result: SentimentResult;
}

const typeStyles: Record<string, string> = {
  positive: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  negative: 'bg-rose-100 text-rose-700 border-rose-200',
  negated: 'bg-violet-100 text-violet-700 border-violet-200',
  intensified: 'bg-sky-100 text-sky-700 border-sky-200',
};

const typeIcons: Record<string, string> = {
  positive: '+',
  negative: '−',
  negated: '!',
  intensified: '×',
};

export function KeywordBreakdown({ result }: KeywordBreakdownProps) {
  if (result.keywords.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        No sentiment-bearing words detected. Try writing more descriptive feedback.
      </div>
    );
  }

  const sorted = [...result.keywords].sort((a, b) => Math.abs(b.score) - Math.abs(a.score));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {sorted.map((kw, i) => (
          <div
            key={`${kw.word}-${i}`}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium ${typeStyles[kw.type] || 'bg-slate-100 text-slate-600 border-slate-200'}`}
            title={`Score: ${kw.score.toFixed(3)}`}
          >
            <span className="text-xs font-bold opacity-70">{typeIcons[kw.type] || '·'}</span>
            <span>{kw.word}</span>
            <span className="text-xs font-mono opacity-60">
              {kw.score > 0 ? '+' : ''}{kw.score.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Positive</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400" /> Negative</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-400" /> Negated</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400" /> Intensified</span>
      </div>
    </div>
  );
}
