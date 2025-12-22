
-- Run this in your Supabase SQL Editor to enable Cloud Storage for Characters

CREATE TABLE IF NOT EXISTS user_characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    images JSONB DEFAULT '[]',
    colors JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (Security Policy)
ALTER TABLE user_characters ENABLE ROW LEVEL SECURITY;

-- Allow users to only see and edit their own characters
CREATE POLICY "Users can CRUD own characters" ON user_characters
    FOR ALL USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_characters_user_id ON user_characters(user_id);
