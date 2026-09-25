import { useMemo } from 'react';
import type { FeedbackRecord } from '@/lib/supabase';
import { TrendingUp, TrendingDown, Minus, Smile, Frown, Meh } from 'lucide-react';

interface AnalyticsDashboardProps {
  records: FeedbackRecord[];
}

export function AnalyticsDashboard({ records }: AnalyticsDashboardProps) {
  const stats = useMemo(() => {
    const total = records.length;
    const positive = records.filter(r => r.sentiment_label === 'positive').length;
    const negative = records.filter(r => r.sentiment_label === 'negative').length;
    const neutral = records.filter(r => r.sentiment_label === 'neutral').length;
    const avgScore = total > 0 ? records.reduce((sum, r) => sum + Number(r.sentiment_score), 0) / total : 0;
    const avgConfidence = total > 0 ? records.reduce((sum, r) => sum + Number(r.confidence), 0) / total : 0;

    // Word frequency from keywords
    const wordFreq: Record<string, { count: number; score: number }> = {};
    for (const r of records) {
      if (!r.keywords) continue;
      for (const kw of r.keywords) {
        if (kw.word === '(phrase)') continue;
        if (!wordFreq[kw.word]) {
          wordFreq[kw.word] = { count: 0, score: 0 };
        }
        wordFreq[kw.word].count++;
        wordFreq[kw.word].score += Number(kw.score);
      }
    }
    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 12);

    // Score trend (last 10 entries, chronological)
    const trend = [...records].reverse().slice(0, 10).reverse();

    return { total, positive, negative, neutral, avgScore, avgConfidence, topWords, trend };
  }, [records]);

  const trendIcon = stats.avgScore > 0.15 ? <TrendingUp className="w-5 h-5 text-emerald-500" />
    : stats.avgScore < -0.15 ? <TrendingDown className="w-5 h-5 text-rose-500" />
    : <Minus className="w-5 h-5 text-amber-500" />;

  if (stats.total === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-lg font-medium">No data yet</p>
        <p className="text-sm mt-1">Submit some feedback to see analytics here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Smile className="w-5 h-5" />}
          label="Positive"
          value={stats.positive}
          total={stats.total}
          color="emerald"
        />
        <StatCard
          icon={<Frown className="w-5 h-5" />}
          label="Negative"
          value={stats.negative}
          total={stats.total}
          color="rose"
        />
        <StatCard
          icon={<Meh className="w-5 h-5" />}
          label="Neutral"
          value={stats.neutral}
          total={stats.total}
          color="amber"
        />
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            {trendIcon}
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{stats.avgScore.toFixed(2)}</div>
            <div className="text-xs text-slate-500">Avg Sentiment</div>
          </div>
        </div>
      </div>

      {/* Distribution bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Sentiment Distribution</h3>
        <div className="flex h-8 rounded-lg overflow-hidden">
          {stats.positive > 0 && (
            <div
              className="bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${(stats.positive / stats.total) * 100}%`, transition: 'width 0.6s ease' }}
            >
              {Math.round((stats.positive / stats.total) * 100)}%
            </div>
          )}
          {stats.neutral > 0 && (
            <div
              className="bg-gradient-to-r from-amber-400 to-orange-400 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${(stats.neutral / stats.total) * 100}%`, transition: 'width 0.6s ease' }}
            >
              {Math.round((stats.neutral / stats.total) * 100)}%
            </div>
          )}
          {stats.negative > 0 && (
            <div
              className="bg-gradient-to-r from-rose-400 to-red-500 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${(stats.negative / stats.total) * 100}%`, transition: 'width 0.6s ease' }}
            >
              {Math.round((stats.negative / stats.total) * 100)}%
            </div>
          )}
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>{stats.positive} positive</span>
          <span>{stats.neutral} neutral</span>
          <span>{stats.negative} negative</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Recent Score Trend</h3>
          {stats.trend.length > 0 ? (
            <div className="flex items-end justify-between gap-1.5 h-32">
              {stats.trend.map((r, i) => {
                const score = Number(r.sentiment_score);
                const height = Math.abs(score) * 100;
                const isPositive = score >= 0;
                return (
                  <div key={r.id || i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                      {score.toFixed(2)}
                    </div>
                    <div className="w-full flex-1 flex items-center justify-center relative">
                      <div className="absolute bottom-1/2 w-full h-px bg-slate-100" />
                      <div
                        className={`w-full max-w-[28px] rounded-t-md ${isPositive ? 'bg-emerald-400' : 'bg-rose-400'}`}
                        style={{
                          height: `${Math.max(4, height / 2)}%`,
                          position: 'absolute',
                          bottom: isPositive ? '50%' : 'auto',
                          top: isPositive ? 'auto' : '50%',
                          transition: 'height 0.6s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-sm text-slate-400 py-8">No trend data yet</div>
          )}
        </div>

        {/* Word frequency */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Key Sentiment Words</h3>
          {stats.topWords.length > 0 ? (
            <div className="space-y-2">
              {stats.topWords.map(([word, data]) => {
                const avgScore = data.score / data.count;
                const isPositive = avgScore > 0;
                const maxCount = stats.topWords[0][1].count;
                const barWidth = (data.count / maxCount) * 100;
                return (
                  <div key={word} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-slate-600 truncate font-medium">{word}</div>
                    <div className="flex-1 h-6 bg-slate-50 rounded-md relative overflow-hidden">
                      <div
                        className={`h-full rounded-md ${isPositive ? 'bg-emerald-300' : 'bg-rose-300'}`}
                        style={{ width: `${barWidth}%`, transition: 'width 0.6s ease' }}
                      />
                    </div>
                    <div className={`text-xs font-mono w-8 text-right ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {data.count}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-sm text-slate-400 py-8">No keywords detected yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, total, color }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  total: number;
  color: 'emerald' | 'rose' | 'amber';
}) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        <div className="text-xs text-slate-500">{label} · {pct}%</div>
      </div>
    </div>
  );
}
