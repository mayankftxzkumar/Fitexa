-- Enterprise AI Activity Logs table
-- Stores audit trail for every action executed by the AI agent engine.
CREATE TABLE IF NOT EXISTS ai_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES ai_projects(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed')),
    input_payload JSONB DEFAULT '{}'::jsonb,
    result JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can view logs for their own projects
CREATE POLICY "Users can view own project activity logs"
    ON ai_activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM ai_projects
            WHERE ai_projects.id = ai_activity_logs.project_id
            AND ai_projects.user_id = auth.uid()
        )
    );

-- Service role can do everything (used by API routes)
CREATE POLICY "Allow all operations on ai_activity_logs for API"
    ON ai_activity_logs FOR ALL
    USING (true)
    WITH CHECK (true);

-- Index for fast project-level queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id
    ON ai_activity_logs(project_id, created_at DESC);
