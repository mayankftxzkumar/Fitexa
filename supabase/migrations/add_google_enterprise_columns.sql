-- Google Business Profile Enterprise Architecture Columns
-- Adds strict connection tracking fields to ai_projects

ALTER TABLE ai_projects
  ADD COLUMN IF NOT EXISTS google_connected BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_connected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_account_name TEXT,
  ADD COLUMN IF NOT EXISTS google_last_validated_at TIMESTAMPTZ;
