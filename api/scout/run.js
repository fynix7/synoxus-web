import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Supabase Setup
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { channelUrl } = req.body;

    if (!channelUrl) {
        return res.status(400).json({ error: 'Channel URL is required' });
    }

    try {
        console.log(`🚀 Scouting channel: ${channelUrl}`);

        // 1. Fetch Channel Page
        // Ensure URL ends with /videos for best data
        let targetUrl = channelUrl;
        if (!targetUrl.includes('/videos')) {
            targetUrl = targetUrl.replace(/\/$/, '') + '/videos';
        }

        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        const html = response.data;

        // 2. Extract ytInitialData
        let ytInitialData = null;
        const patterns = [
            /var ytInitialData = ({.*?});/,
            /window\["ytInitialData"\] = ({.*?});/
        ];

        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                try {
                    ytInitialData = JSON.parse(match[1]);
                    break;
                } catch (e) {
                    console.error("JSON parse error for pattern:", e);
                }
            }
        }

        if (!ytInitialData) {
            throw new Error("Could not extract YouTube data. YouTube might have changed their layout.");
        }

        // 3. Parse Videos
        const videos = [];

        // Traverse JSON to find video items
        // Path: contents.twoColumnBrowseResultsRenderer.tabs[1].tabRenderer.content.richGridRenderer.contents
        const tabs = ytInitialData.contents?.twoColumnBrowseResultsRenderer?.tabs;
        const videosTab = tabs?.find(t => t.tabRenderer?.title === "Videos" || t.tabRenderer?.selected);
        const contents = videosTab?.tabRenderer?.content?.richGridRenderer?.contents;

        if (contents) {
            contents.forEach(item => {
                const videoRenderer = item.richItemRenderer?.content?.videoRenderer;
                if (videoRenderer) {
                    const videoId = videoRenderer.videoId;
                    const title = videoRenderer.title?.runs?.[0]?.text;
                    const viewCountText = videoRenderer.viewCountText?.simpleText;
                    const thumbnail = videoRenderer.thumbnail?.thumbnails?.[0]?.url; // Get first thumbnail

                    // Parse Views
                    let views = 0;
                    if (viewCountText) {
                        const num = parseFloat(viewCountText.replace(/[^0-9.]/g, ''));
                        const multiplier = viewCountText.toUpperCase().includes('K') ? 1000 :
                            viewCountText.toUpperCase().includes('M') ? 1000000 : 1;
                        views = Math.round(num * multiplier);
                    }

                    if (videoId && views > 0) {
                        videos.push({
                            video_id: videoId,
                            title,
                            views,
                            thumbnail,
                            url: `https://www.youtube.com/watch?v=${videoId}`
                        });
                    }
                }
            });
        }

        console.log(`Found ${videos.length} videos.`);

        if (videos.length < 5) {
            return res.status(200).json({ success: true, outliers: [], message: "Not enough videos to calculate outliers." });
        }

        // 4. Calculate Outliers (1of10 Logic)
        // Median of last ~30 videos (or however many we fetched)
        const sortedViews = [...videos].sort((a, b) => a.views - b.views);
        const mid = Math.floor(sortedViews.length / 2);
        const medianViews = sortedViews.length % 2 !== 0
            ? sortedViews[mid].views
            : (sortedViews[mid - 1].views + sortedViews[mid].views) / 2;

        console.log(`Median Views: ${medianViews}`);

        const outliers = [];
        const dataToInsert = [];

        videos.forEach(video => {
            const multiplier = video.views / medianViews;
            if (multiplier >= 1.5) {
                const outlier = {
                    ...video,
                    outlier_score: parseFloat(multiplier.toFixed(2)),
                    channel_url: channelUrl
                };
                outliers.push(outlier);

                dataToInsert.push({
                    video_id: outlier.video_id,
                    title: outlier.title,
                    views: outlier.views,
                    thumbnail: outlier.thumbnail,
                    outlier_score: outlier.outlier_score,
                    // channel_url: channelUrl, // Removed to avoid schema error
                    created_at: new Date().toISOString()
                });
            }
        });

        console.log(`Found ${outliers.length} outliers.`);

        // 5. Save to Supabase
        if (dataToInsert.length > 0) {
            const { error } = await supabase
                .from('os_outliers')
                .upsert(dataToInsert, { onConflict: 'video_id' });

            if (error) {
                console.error("Supabase Error:", error);
                // Don't fail the request, just log it
            }
        }

        return res.status(200).json({
            success: true,
            outliers,
            stats: {
                total_videos: videos.length,
                median_views: medianViews
            }
        });

    } catch (error) {
        console.error('Scouting error:', error);
        return res.status(500).json({ error: error.message });
    }
}
