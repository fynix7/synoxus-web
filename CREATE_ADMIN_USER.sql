-- ============================================
-- CREATE ADMIN USER
-- Run this in Supabase SQL Editor AFTER running
-- MIGRATION_USER_ACCOUNTS.sql
-- ============================================

-- Option 1: Create admin via Supabase Dashboard
-- Go to Authentication > Users > Invite User
-- Email: iyohanthomas7@gmail.com
-- Password: SNoxus123!

-- Option 2: If you have the service role key, you can use this
-- (Note: This requires running from a server with service role access)

-- The admin account with credentials:
-- Email: iyohanthomas7@gmail.com
-- Password: SNoxus123!
-- 
-- Should be created by signing up through the UI or using
-- Supabase Dashboard > Authentication > Users > Add User

-- After creating the admin user, you can optionally mark them as admin
-- by adding a role column:

-- Add role to user metadata (run after user is created)
-- UPDATE auth.users 
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
-- WHERE email = 'iyohanthomas7@gmail.com';

-- ============================================
-- ALTERNATIVE: Use Supabase Auth Admin API
-- ============================================
-- If you have access to the service_role key, you can create the user via:
--
-- const { data, error } = await supabase.auth.admin.createUser({
--   email: 'iyohanthomas7@gmail.com',
--   password: 'SNoxus123!',
--   email_confirm: true,
--   user_metadata: { display_name: 'Admin', role: 'admin' }
-- });
