-- Create ai_projects table
CREATE TABLE IF NOT EXISTS ai_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ai_name TEXT NOT NULL DEFAULT 'Untitled AI',
    business_name TEXT DEFAULT '',
    business_location TEXT DEFAULT '',
    business_category TEXT DEFAULT '',
    business_description TEXT DEFAULT '',
    telegram_token TEXT DEFAULT '',
    enabled_features JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active')),
    webhook_url TEXT DEFAULT '',
    current_step INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_projects ENABLE ROW LEVEL SECURITY;

-- Users can only see their own projects
CREATE POLICY "Users can view own projects"
    ON ai_projects FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own projects
CREATE POLICY "Users can create own projects"
    ON ai_projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
    ON ai_projects FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects"
    ON ai_projects FOR DELETE
    USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_ai_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_projects_updated_at
    BEFORE UPDATE ON ai_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_projects_updated_at();
