import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('Running schema migration...');

    // We can't run raw SQL with supabase-js client easily without a stored procedure or Rpc.
    // However, we can try to use the 'rpc' if there is one, or just assume the user might have run it.
    // BUT, since we are in a dev environment, maybe we can just use the postgres connection string if we had it?
    // We don't have the postgres connection string, only the API URL/Key.

    // Alternative: We can try to "select" from the columns to see if they exist, but we can't "alter table" via the JS client unless RLS allows it (unlikely for DDL).

    // Wait, the user said "Failed to run sql query... node scripts...". 
    // This implies they were in the SQL Editor.

    // I will try to use a special trick: 
    // If I can't run DDL, I will ask the user to run the SQL I provided in the SQL Editor.
    // BUT, I can try to see if the columns exist first.

    const { error } = await supabase
        .from('os_blueprints')
        .select('generated_example, archetype')
        .limit(1);

    if (error) {
        console.error('Migration check failed:', error.message);
        console.log('It seems the columns do not exist yet.');
        console.log('PLEASE RUN THE FOLLOWING SQL IN YOUR SUPABASE SQL EDITOR:');
        console.log(`
        ALTER TABLE os_blueprints ADD COLUMN IF NOT EXISTS generated_example TEXT;
        ALTER TABLE os_blueprints ADD COLUMN IF NOT EXISTS archetype TEXT;
        `);
    } else {
        console.log('✅ Schema check passed: Columns exist.');
    }
}

runMigration();
