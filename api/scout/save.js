import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { outliers, channelUrl } = req.body;

    if (!outliers || !Array.isArray(outliers)) {
        return res.status(400).json({ error: 'Invalid outliers data' });
    }

    try {
        // 1. Upsert Channel
        let channelId;
        if (channelUrl) {
            // Check if channel exists first to get ID, or insert
            const { data: channelData, error: channelError } = await supabase
                .from('os_channels')
                .select('id')
                .eq('url', channelUrl)
                .single();

            if (channelData) {
                channelId = channelData.id;
                // Update last_scouted
                await supabase.from('os_channels').update({ last_scouted: new Date().toISOString() }).eq('id', channelId);
            } else {
                const { data: newChannel, error: insertError } = await supabase
                    .from('os_channels')
                    .insert([{
                        url: channelUrl,
                        last_scouted: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (insertError) {
                    // Handle race condition or just ignore channel linking for now
                    console.warn('Error inserting channel:', insertError);
                } else {
                    channelId = newChannel.id;
                }
            }
        }

        // 2. Insert Outliers
        const outliersToInsert = outliers.map(o => ({
            video_id: o.video_id,
            title: o.video_title,
            views: o.views,
            outlier_score: o.outlier_score,
            thumbnail: o.local_webp_path || o.thumbnail_url, // Use Base64 if available
            channel_id: channelId,
            published_at: null, // We didn't extract this yet
            scouted_at: new Date().toISOString()
        }));

        const { error: outliersError } = await supabase
            .from('os_outliers')
            .upsert(outliersToInsert, { onConflict: 'video_id' });

        if (outliersError) throw outliersError;

        return res.status(200).json({ success: true, count: outliers.length });

    } catch (error) {
        console.error('Error saving outliers:', error);
        return res.status(500).json({ error: error.message });
    }
}
