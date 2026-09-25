import { useState, useEffect, useCallback } from 'react';
import { analyzeSentiment, type SentimentResult } from '@/lib/sentiment';
import { supabase, type FeedbackRecord, type FeedbackInput } from '@/lib/supabase';
import { SentimentGauge } from '@/components/SentimentGauge';
import { KeywordBreakdown } from '@/components/KeywordBreakdown';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { FeedbackHistory } from '@/components/FeedbackHistory';
import { Brain, Send, Loader2, BarChart3, History, Sparkles, FileText } from 'lucide-react';

type Tab = 'analyze' | 'analytics' | 'history';

const SAMPLE_FEEDBACK = [
  { text: 'The professor is absolutely amazing! The lectures are very clear and engaging. I really enjoyed the course and learned a lot. Highly recommend!', name: 'Alice Johnson', course: 'CS 101' },
  { text: 'This class was terrible. The assignments were too difficult and confusing. The professor was not helpful at all and I felt lost most of the time.', name: 'Bob Smith', course: 'MATH 200' },
  { text: 'The course content was okay but the pacing was a bit too fast. Some topics were interesting but overall it was just average.', name: 'Carol Davis', course: 'PHYS 150' },
];

export default function App() {
  const [text, setText] = useState('');
  const [studentName, setStudentName] = useState('');
  const [course, setCourse] = useState('');
  const [liveResult, setLiveResult] = useState<SentimentResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('analyze');

  // Live analysis as user types
  useEffect(() => {
    if (text.trim()) {
      setLiveResult(analyzeSentiment(text));
    } else {
      setLiveResult(null);
    }
  }, [text]);

  // Load records from Supabase
  const loadRecords = useCallback(async () => {
    setLoadingRecords(true);
    const { data, error } = await supabase
      .from('student_feedback')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load feedback:', error.message);
    } else if (data) {
      setRecords(data as FeedbackRecord[]);
    }
    setLoadingRecords(false);
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleSave = async () => {
    if (!text.trim() || !liveResult) return;
    setSaving(true);

    const input: FeedbackInput = {
      student_name: studentName.trim() || null,
      course: course.trim() || null,
      text: text.trim(),
      sentiment_score: liveResult.score,
      sentiment_label: liveResult.label,
      sentiment_magnitude: liveResult.magnitude,
      confidence: liveResult.confidence,
      keywords: liveResult.keywords,
      word_count: liveResult.wordCount,
    };

    const { data, error } = await supabase
      .from('student_feedback')
      .insert(input)
      .select()
      .single();

    if (error) {
      console.error('Save failed:', error.message);
      setSaving(false);
      return;
    }

    if (data) {
      setRecords([data as FeedbackRecord, ...records]);
    }

    setText('');
    setStudentName('');
    setCourse('');
    setLiveResult(null);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('student_feedback').delete().eq('id', id);
    if (error) {
      console.error('Delete failed:', error.message);
      return;
    }
    setRecords(records.filter(r => r.id !== id));
  };

  const loadSample = (idx: number) => {
    const sample = SAMPLE_FEEDBACK[idx];
    setText(sample.text);
    setStudentName(sample.name);
    setCourse(sample.course);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white shadow-sm">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">Feedback Sentiment Analyzer</h1>
              <p className="text-xs text-slate-500">NLP-powered student feedback analysis</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-4 h-4" />
            <span>{records.length} entries analyzed</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 inline-flex">
          <TabButton active={activeTab === 'analyze'} onClick={() => setActiveTab('analyze')} icon={<FileText className="w-4 h-4" />} label="Analyze" />
          <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<BarChart3 className="w-4 h-4" />} label="Analytics" />
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History className="w-4 h-4" />} label="History" />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'analyze' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input panel */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-800 mb-4">Enter Feedback</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Student Name (optional)</label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={e => setStudentName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Course (optional)</label>
                    <input
                      type="text"
                      value={course}
                      onChange={e => setCourse(e.target.value)}
                      placeholder="BIO 101"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Feedback Text</label>
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    rows={6}
                    placeholder="Paste or type student feedback here..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Try:</span>
                    {SAMPLE_FEEDBACK.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => loadSample(i)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-600 transition-colors"
                      >
                        Sample {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={!text.trim() || !liveResult || saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Analyze & Save'}
                  </button>
                </div>
              </div>

              {/* Live stats */}
              {liveResult && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Stats</h3>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div>
                      <div className="text-xl font-bold text-slate-800">{liveResult.wordCount}</div>
                      <div className="text-xs text-slate-400">Words</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-emerald-600">{liveResult.positiveCount}</div>
                      <div className="text-xs text-slate-400">Positive</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-rose-600">{liveResult.negativeCount}</div>
                      <div className="text-xs text-slate-400">Negative</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-slate-800">{Math.round(liveResult.confidence * 100)}%</div>
                      <div className="text-xs text-slate-400">Confidence</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Results panel */}
            <div className="space-y-4">
              {liveResult ? (
                <>
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-800 mb-4">Sentiment Analysis</h2>
                    <SentimentGauge score={liveResult.score} label={liveResult.label} confidence={liveResult.confidence} />
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Keyword Breakdown</h3>
                    <KeywordBreakdown result={liveResult} />
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm flex flex-col items-center justify-center text-center min-h-[400px]">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 mb-4">
                    <Brain className="w-8 h-8" />
                  </div>
                  <p className="text-slate-400 text-sm">Start typing feedback to see real-time sentiment analysis</p>
                  <p className="text-slate-300 text-xs mt-1">The engine detects positive/negative words, negations, and intensifiers</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-800 mb-1">Analytics Dashboard</h2>
              <p className="text-sm text-slate-500 mb-6">Overview of all analyzed feedback entries</p>
              {loadingRecords ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <AnalyticsDashboard records={records} />
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-800 mb-4">Feedback History</h2>
              {loadingRecords ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <FeedbackHistory records={records} onDelete={handleDelete} />
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center text-xs text-slate-400">
        Sentiment analysis runs entirely in your browser using a lexicon-based NLP engine.
      </footer>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
