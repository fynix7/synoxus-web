import { YoutubeTranscript } from 'youtube-transcript';
import https from 'https';

// Helper to format time
const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `[${m}:${s.toString().padStart(2, '0')}]`;
};

export default async function handler(req, res) {
    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: 'Missing videoId' });
    }

    console.log(`[API] Fetching transcript for: ${videoId}`);

    // Strategy 1: YoutubeTranscript Library (Primary for Vercel)
    try {
        console.log(`[API] Strategy 1: Attempting youtube-transcript...`);
        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
        const transcript = transcriptItems.map(item => {
            const timestamp = formatTime(item.offset / 1000);
            return `${timestamp} ${item.text}`;
        }).join('\n');

        if (transcript && transcript.length > 0) {
            console.log(`[API] Success! Transcript length: ${transcript.length}`);
            return res.status(200).json({ transcript, source: 'youtube-transcript' });
        }
    } catch (e) {
        console.warn(`[API] Strategy 1 failed: ${e.message}`);
    }

    // Strategy 2: Direct Scrape (Fallback)
    try {
        console.log(`[API] Strategy 2: Attempting direct scrape...`);
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });
        const html = await response.text();
        const captionTracksRegex = /"captionTracks":\s*(\[.*?\])/;
        const match = captionTracksRegex.exec(html);

        if (match && match[1]) {
            const captionTracks = JSON.parse(match[1]);
            const englishTrack = captionTracks.find(track => track.languageCode === 'en');
            if (englishTrack) {
                console.log(`[API] Found caption track: ${englishTrack.baseUrl}`);
                const xmlResponse = await fetch(englishTrack.baseUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    }
                });
                const xml = await xmlResponse.text();

                if (!xml || xml.length === 0) {
                    console.warn(`[API] XML content is empty.`);
                    throw new Error("Empty XML");
                }

                // Simple XML parse
                const transcript = xml.replace(/<text start="([\d.]+)" dur="[\d.]+">([^<]+)<\/text>/g, (match, start, text) => {
                    const timestamp = formatTime(parseFloat(start));
                    return `${timestamp} ${text.replace(/&#39;/g, "'").replace(/&quot;/g, '"')}\n`;
                }).replace(/<[^>]+>/g, ''); // Clean up remaining tags

                if (transcript && transcript.length > 0) {
                    console.log(`[API] Success! Transcript length: ${transcript.length}`);
                    return res.status(200).json({ transcript, source: 'direct_scrape' });
                }
            } else {
                console.warn(`[API] No English track found.`);
            }
        } else {
            console.warn(`[API] No captionTracks found in HTML.`);
        }
    } catch (e) {
        console.warn(`[API] Strategy 2 failed: ${e.message}`);
        if (e.cause) console.warn(`[API] Cause:`, e.cause);
    }

    return res.status(500).json({ error: 'Could not fetch transcript' });
}
