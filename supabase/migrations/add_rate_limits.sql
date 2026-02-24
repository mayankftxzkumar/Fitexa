-- Per-project action rate limiting table
-- Tracks each action execution with timestamp for minute/daily limits.
CREATE TABLE IF NOT EXISTS ai_rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES ai_projects(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast per-project time-range queries
CREATE INDEX IF NOT EXISTS idx_ai_rate_limits_project_time
    ON ai_rate_limits(project_id, created_at DESC);

-- Enable RLS
ALTER TABLE ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can view rate limit entries for their own projects
CREATE POLICY "Users can view own project rate limits"
    ON ai_rate_limits FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM ai_projects
            WHERE ai_projects.id = ai_rate_limits.project_id
            AND ai_projects.user_id = auth.uid()
        )
    );

-- Service role can do everything (used by API routes)
CREATE POLICY "Allow all operations on ai_rate_limits for API"
    ON ai_rate_limits FOR ALL
    USING (true)
    WITH CHECK (true);
