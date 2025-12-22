
-- ============================================
-- MIGRATION: Anonymous Storage Support
-- ============================================

-- 1. Add session_id column and make user_id nullable
ALTER TABLE user_characters 
ADD COLUMN IF NOT EXISTS session_id UUID,
ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add index for session_id
CREATE INDEX IF NOT EXISTS idx_user_characters_session_id ON user_characters(session_id);

-- 3. Update RLS Policy to support Anonymous Sessions via Header
-- Drop existing policy to replace it
DROP POLICY IF EXISTS "Users can CRUD own characters" ON user_characters;

-- Create new comprehensive policy
CREATE POLICY "Users can CRUD own characters" ON user_characters
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

-- 4. (Optional) Function to clean up old anonymous data
-- This would need to be triggered by a cron job or manually
-- DELETE FROM user_characters 
-- WHERE user_id IS NULL 
-- AND updated_at < NOW() - INTERVAL '14 days';
