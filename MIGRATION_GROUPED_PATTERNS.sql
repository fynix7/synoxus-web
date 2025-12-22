-- Migration to support grouped title formats with multiple examples
-- Run this in your Supabase SQL Editor

-- Add columns for storing multiple examples and example count
ALTER TABLE os_blueprints ADD COLUMN IF NOT EXISTS examples JSONB;
ALTER TABLE os_blueprints ADD COLUMN IF NOT EXISTS count INTEGER DEFAULT 1;

-- Update existing blueprints to have count = 1 if not set
UPDATE os_blueprints SET count = 1 WHERE count IS NULL;

-- Create an index on count for faster sorting
CREATE INDEX IF NOT EXISTS idx_os_blueprints_count ON os_blueprints(count DESC);

-- Create an index on median_score for faster sorting
CREATE INDEX IF NOT EXISTS idx_os_blueprints_score ON os_blueprints(median_score DESC);
