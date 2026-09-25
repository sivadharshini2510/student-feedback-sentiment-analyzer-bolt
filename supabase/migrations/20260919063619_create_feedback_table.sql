/*
# Create student_feedback table (single-tenant, no auth)

1. New Tables
- `student_feedback`
  - `id` (uuid, primary key)
  - `student_name` (text, optional — name of the student the feedback is about or from)
  - `course` (text, optional — course or class context)
  - `text` (text, not null — the feedback text being analyzed)
  - `sentiment_score` (numeric, not null — sentiment score from -1.0 to 1.0)
  - `sentiment_label` (text, not null — 'positive', 'negative', or 'neutral')
  - `sentiment_magnitude` (numeric, not null — absolute strength of sentiment 0 to 1)
  - `confidence` (numeric, not null — confidence score 0 to 1)
  - `keywords` (jsonb — array of key sentiment words with their contributions)
  - `word_count` (integer — number of words in the feedback)
  - `created_at` (timestamptz, default now)

2. Security
- Enable RLS on `student_feedback`.
- Allow anon + authenticated CRUD because this is a single-tenant app with no sign-in.
- All data is intentionally shared/public.

3. Indexes
- Index on `created_at` for time-based queries (history, trends).
- Index on `sentiment_label` for filtering by sentiment.
*/

CREATE TABLE IF NOT EXISTS student_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text,
  course text,
  text text NOT NULL,
  sentiment_score numeric NOT NULL DEFAULT 0,
  sentiment_label text NOT NULL DEFAULT 'neutral',
  sentiment_magnitude numeric NOT NULL DEFAULT 0,
  confidence numeric NOT NULL DEFAULT 0,
  keywords jsonb DEFAULT '[]'::jsonb,
  word_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE student_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_feedback" ON student_feedback;
CREATE POLICY "anon_select_feedback" ON student_feedback FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_feedback" ON student_feedback;
CREATE POLICY "anon_insert_feedback" ON student_feedback FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_feedback" ON student_feedback;
CREATE POLICY "anon_update_feedback" ON student_feedback FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_feedback" ON student_feedback;
CREATE POLICY "anon_delete_feedback" ON student_feedback FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_student_feedback_created_at ON student_feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_feedback_label ON student_feedback (sentiment_label);
