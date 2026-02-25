-- Per-project LLM usage tracking table
-- Tracks every Perplexity API call for daily cost guardrails (300/day).
CREATE TABLE IF NOT EXISTS ai_llm_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES ai_projects(id) ON DELETE CASCADE,
    usage_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast per-project time-range queries
CREATE INDEX IF NOT EXISTS idx_ai_llm_usage_project_time
    ON ai_llm_usage(project_id, created_at DESC);

-- Enable RLS
ALTER TABLE ai_llm_usage ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by API routes)
CREATE POLICY "Allow all operations on ai_llm_usage for API"
    ON ai_llm_usage FOR ALL
    USING (true)
    WITH CHECK (true);
