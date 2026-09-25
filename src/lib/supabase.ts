import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface FeedbackRecord {
  id: string;
  student_name: string | null;
  course: string | null;
  text: string;
  sentiment_score: number;
  sentiment_label: 'positive' | 'negative' | 'neutral';
  sentiment_magnitude: number;
  confidence: number;
  keywords: Array<{ word: string; score: number; type: string }>;
  word_count: number;
  created_at: string;
}

export type FeedbackInput = {
  student_name: string | null;
  course: string | null;
  text: string;
  sentiment_score: number;
  sentiment_label: 'positive' | 'negative' | 'neutral';
  sentiment_magnitude: number;
  confidence: number;
  keywords: Array<{ word: string; score: number; type: string }>;
  word_count: number;
};
