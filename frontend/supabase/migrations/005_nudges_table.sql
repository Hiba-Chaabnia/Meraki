-- ─── Nudges table ───
-- Stores AI-generated motivation nudges for users.
-- Backend writes via service-role (bypasses RLS). Frontend reads/updates via RLS.

CREATE TABLE IF NOT EXISTS nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hobby_id uuid REFERENCES hobbies(id) ON DELETE SET NULL,
  nudge_type text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  suggested_action text NOT NULL DEFAULT '',
  action_data text DEFAULT '',
  urgency text NOT NULL DEFAULT 'gentle',
  shown_at timestamptz,
  acted_on boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fetching latest nudge per user
CREATE INDEX IF NOT EXISTS idx_nudges_user_created
  ON nudges (user_id, created_at DESC);

-- RLS policies
ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own nudges"
  ON nudges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own nudges"
  ON nudges FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
