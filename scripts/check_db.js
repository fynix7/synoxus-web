
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log('Checking for user_characters table...');

    const { data, error } = await supabase
        .from('user_characters')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error accessing table:', error.message);
        if (error.code === '42P01') {
            console.log('Table does not exist.');
        }
    } else {
        console.log('Table exists and is accessible.');
        console.log('Sample data:', data);
    }
}

checkTable();
