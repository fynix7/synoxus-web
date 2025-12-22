-- ============================================
-- MIGRATION: Multi-User Account System
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. USER CHARACTERS TABLE
-- Stores characters per user (replaces IndexedDB)
-- ============================================
CREATE TABLE IF NOT EXISTS user_characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    images JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. USER TEMPLATES TABLE
-- Stores templates per user (replaces IndexedDB)
-- ============================================
CREATE TABLE IF NOT EXISTS user_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    description TEXT,
    prompt TEXT,
    images JSONB DEFAULT '[]',
    feedback JSONB DEFAULT '[]',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. USER LANDING PAGES TABLE
-- Stores landing pages per user with export capability
-- ============================================
CREATE TABLE IF NOT EXISTS user_landing_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sections JSONB DEFAULT '[]',
    styles JSONB DEFAULT '{}',
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. UPDATE EXISTING TABLES (add user_id)
-- ============================================
-- Add user_id to crm_tasks if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_tasks' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE crm_tasks ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Add user_id to chat_config if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_config' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE chat_config ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- Users can only access their own data
-- ============================================

-- Enable RLS on new tables
ALTER TABLE user_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_landing_pages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can CRUD own characters" ON user_characters;
    DROP POLICY IF EXISTS "Users can CRUD own templates" ON user_templates;
    DROP POLICY IF EXISTS "Users can CRUD own landing pages" ON user_landing_pages;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create RLS policies
CREATE POLICY "Users can CRUD own characters" ON user_characters
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own templates" ON user_templates
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own landing pages" ON user_landing_pages
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_characters_user_id ON user_characters(user_id);
CREATE INDEX IF NOT EXISTS idx_user_templates_user_id ON user_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_landing_pages_user_id ON user_landing_pages(user_id);

-- ============================================
-- VERIFICATION QUERIES
-- Run these after migration to verify
-- ============================================
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name IN ('user_characters', 'user_templates', 'user_landing_pages');

-- SELECT tablename, policyname FROM pg_policies 
-- WHERE tablename IN ('user_characters', 'user_templates', 'user_landing_pages');
