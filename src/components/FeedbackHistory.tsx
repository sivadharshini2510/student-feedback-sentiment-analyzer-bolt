import { useState } from 'react';
import type { FeedbackRecord } from '@/lib/supabase';
import { Trash2, Search, Filter } from 'lucide-react';

interface FeedbackHistoryProps {
  records: FeedbackRecord[];
  onDelete: (id: string) => void;
}

type FilterType = 'all' | 'positive' | 'negative' | 'neutral';

const labelConfig = {
  positive: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  negative: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  neutral: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
};

export function FeedbackHistory({ records, onDelete }: FeedbackHistoryProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = records.filter(r => {
    if (filter !== 'all' && r.sentiment_label !== filter) return false;
    if (search && !r.text.toLowerCase().includes(search.toLowerCase()) &&
        !(r.student_name || '').toLowerCase().includes(search.toLowerCase()) &&
        !(r.course || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search feedback..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          {(['all', 'positive', 'negative', 'neutral'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          {records.length === 0 ? 'No feedback submitted yet.' : 'No results match your search.'}
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {filtered.map(r => {
            const cfg = labelConfig[r.sentiment_label];
            const score = Number(r.sentiment_score);
            return (
              <div
                key={r.id}
                className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border} group hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.text} bg-white/70`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {r.sentiment_label}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        Score: {score.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-400">
                        · {Math.round(Number(r.confidence) * 100)}% confidence
                      </span>
                      {r.student_name && (
                        <span className="text-xs text-slate-500">· {r.student_name}</span>
                      )}
                      {r.course && (
                        <span className="text-xs text-slate-400">· {r.course}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-3">{r.text}</p>
                    <div className="text-xs text-slate-400 mt-2">
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => onDelete(r.id)}
                    className="p-2 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete feedback"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
