import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanBlueprints() {
    console.log('🧹 Cleaning ALL blueprints...');

    let hasMore = true;
    let deletedCount = 0;

    while (hasMore) {
        // Delete in batches of 50 to avoid timeouts and URL length limits
        const { data: ids, error: fetchError } = await supabase
            .from('os_blueprints')
            .select('id')
            .limit(50);

        if (fetchError) {
            console.error('Error fetching IDs to delete:', fetchError);
            break;
        }

        if (!ids || ids.length === 0) {
            hasMore = false;
            break;
        }

        const idList = ids.map(row => row.id);
        const { error: deleteError } = await supabase
            .from('os_blueprints')
            .delete()
            .in('id', idList);

        if (deleteError) {
            console.error('Error deleting batch:', deleteError);
            console.error('Batch size:', idList.length);
            break;
        }

        deletedCount += idList.length;
        console.log(`Deleted ${deletedCount} blueprints so far...`);

        // Small pause
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('✅ Cleanup complete.');
}

cleanBlueprints();
