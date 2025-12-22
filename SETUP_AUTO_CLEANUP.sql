
-- ============================================
-- SETUP: Auto-Cleanup for Anonymous Data
-- ============================================

-- 1. Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create a function to delete old anonymous data
CREATE OR REPLACE FUNCTION cleanup_old_anonymous_data()
RETURNS void AS $$
BEGIN
    -- Delete characters older than 14 days that are anonymous (user_id is NULL)
    DELETE FROM user_characters 
    WHERE user_id IS NULL 
    AND updated_at < NOW() - INTERVAL '14 days';

    -- Delete templates older than 14 days that are anonymous (user_id is NULL)
    DELETE FROM user_templates 
    WHERE user_id IS NULL 
    AND updated_at < NOW() - INTERVAL '14 days';
END;
$$ LANGUAGE plpgsql;

-- 3. Schedule the cleanup job to run every day at 3:00 AM
-- Note: This requires pg_cron to be enabled on your database.
-- If pg_cron is not available, you can run the function manually or use an external scheduler.
SELECT cron.schedule('cleanup_job', '0 3 * * *', 'SELECT cleanup_old_anonymous_data()');

-- ============================================
-- MIGRATION: Anonymous Storage for Templates
-- ============================================

-- 4. Add session_id column to user_templates
ALTER TABLE user_templates 
ADD COLUMN IF NOT EXISTS session_id UUID,
ALTER COLUMN user_id DROP NOT NULL;

-- 5. Add index for session_id
CREATE INDEX IF NOT EXISTS idx_user_templates_session_id ON user_templates(session_id);

-- 6. Update RLS Policy for Templates
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
