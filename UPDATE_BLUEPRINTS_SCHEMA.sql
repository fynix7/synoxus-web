-- Run this in the Supabase SQL Editor to update the blueprints table
ALTER TABLE os_blueprints ADD COLUMN IF NOT EXISTS generated_example TEXT;
ALTER TABLE os_blueprints ADD COLUMN IF NOT EXISTS archetype TEXT; -- Ensure this exists too
