-- Add telegram_bot_username column to ai_projects
ALTER TABLE ai_projects ADD COLUMN IF NOT EXISTS telegram_bot_username TEXT;
