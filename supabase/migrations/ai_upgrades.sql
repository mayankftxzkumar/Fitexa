-- Add Google Business credentials to ai_projects
ALTER TABLE ai_projects 
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_location_id TEXT;

-- Create ai_leads table for extracted leads
CREATE TABLE IF NOT EXISTS ai_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES ai_projects(id) ON DELETE CASCADE,
    chat_id BIGINT NOT NULL,
    name TEXT,
    contact_info TEXT,
    interest_level TEXT,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for ai_leads
ALTER TABLE ai_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project leads"
    ON ai_leads FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM ai_projects 
            WHERE ai_projects.id = ai_leads.project_id 
            AND ai_projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow all operations on ai_leads for API"
    ON ai_leads FOR ALL
    USING (true)
    WITH CHECK (true);

-- Auto-update updated_at for ai_leads
CREATE TRIGGER ai_leads_updated_at
    BEFORE UPDATE ON ai_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_conversations_updated_at();

-- Create ai_tasks table for scheduled follow-ups and summaries
CREATE TABLE IF NOT EXISTS ai_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES ai_projects(id) ON DELETE CASCADE,
    chat_id BIGINT, -- Optional: specific to a user
    action_type TEXT NOT NULL, -- e.g., 'follow_up', 'daily_summary'
    context JSONB DEFAULT '{}'::jsonb,
    execute_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for ai_tasks
ALTER TABLE ai_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project tasks"
    ON ai_tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM ai_projects 
            WHERE ai_projects.id = ai_tasks.project_id 
            AND ai_projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow all operations on ai_tasks for API"
    ON ai_tasks FOR ALL
    USING (true)
    WITH CHECK (true);

-- Auto-update updated_at for ai_tasks
CREATE TRIGGER ai_tasks_updated_at
    BEFORE UPDATE ON ai_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_conversations_updated_at();
