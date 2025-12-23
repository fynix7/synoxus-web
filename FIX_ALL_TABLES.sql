
-- ============================================
-- FIX: Create Missing Tables & Enable Anon Storage
-- ============================================

-- 1. Create user_templates table (if missing)
CREATE TABLE IF NOT EXISTS user_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    description TEXT,
    prompt TEXT,
    images JSONB DEFAULT '[]',
    feedback JSONB DEFAULT '[]',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE user_templates ENABLE ROW LEVEL SECURITY;

-- 3. Add session_id column and ensure user_id is nullable
ALTER TABLE user_templates 
ADD COLUMN IF NOT EXISTS session_id UUID,
ALTER COLUMN user_id DROP NOT NULL;

-- 4. Add index for session_id
CREATE INDEX IF NOT EXISTS idx_user_templates_session_id ON user_templates(session_id);

-- 5. Update RLS Policy for Templates
DROP POLICY IF EXISTS "Users can CRUD own templates" ON user_templates;

CREATE POLICY "Users can CRUD own templates" ON user_templates
    FOR ALL
    USING (
        (auth.uid() = user_id) 
        OR 
        (session_id::text = current_setting('request.headers', true)::json->>'x-session-id')
    )
    WITH CHECK (
        (auth.uid() = user_id) 
        OR 
        (session_id::text = current_setting('request.headers', true)::json->>'x-session-id')
    );

-- ============================================
-- SETUP: Auto-Cleanup (Run this part only if supported)
-- ============================================

-- 6. Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 7. Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_anonymous_data()
RETURNS void AS $$
BEGIN
    -- Delete characters older than 14 days (anonymous only)
    DELETE FROM user_characters 
    WHERE user_id IS NULL 
    AND updated_at < NOW() - INTERVAL '14 days';

    -- Delete templates older than 14 days (anonymous only)
    DELETE FROM user_templates 
    WHERE user_id IS NULL 
    AND updated_at < NOW() - INTERVAL '14 days';
END;
$$ LANGUAGE plpgsql;

-- 8. Schedule it to run daily at 3:00 AM
SELECT cron.schedule('cleanup_job', '0 3 * * *', 'SELECT cleanup_old_anonymous_data()');
