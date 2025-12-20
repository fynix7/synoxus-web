

export default async function handler(req, res) {
    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: 'Missing videoId' });
    }

    console.log(`[API] Fetching metadata for: ${videoId}`);

    // Strategy 1: Invidious API (Best for duration/details without rate limits)
    const instances = [
        'https://inv.tux.pizza',
        'https://invidious.projectsegfau.lt',
        'https://invidious.jing.rocks',
        'https://vid.puffyan.us',
        'https://invidious.privacydev.net',
        'https://invidious.nerdvpn.de',
        'https://invidious.lunar.icu',
        'https://yewtu.be'
    ];

    for (const instance of instances) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

            const response = await fetch(`${instance}/api/v1/videos/${videoId}`, {
                signal: controller.signal,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                const lengthSeconds = data.lengthSeconds;
                const minutes = Math.floor(lengthSeconds / 60);
                const seconds = lengthSeconds % 60;
                const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                return res.status(200).json({
                    title: data.title,
                    author: data.author,
                    duration,
                    thumbnail: data.videoThumbnails?.find(t => t.quality === 'medium')?.url || data.videoThumbnails?.[0]?.url
                });
            }
        } catch (e) {
            // Continue to next instance
        }
    }

    // Strategy 2: Direct Scrape (Fallback)
    try {
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const text = await response.text();
        const jsonMatch = text.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);

        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[1]);
            const videoDetails = data.videoDetails;
            if (videoDetails) {
                const lengthSeconds = parseInt(videoDetails.lengthSeconds);
                const minutes = Math.floor(lengthSeconds / 60);
                const seconds = lengthSeconds % 60;
                const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                return res.status(200).json({
                    title: videoDetails.title,
                    author: videoDetails.author,
                    duration,
                    thumbnail: videoDetails.thumbnail.thumbnails.pop().url
                });
            }
        }
    } catch (error) {
        console.error(`[API] Direct metadata scrape failed:`, error);
    }

    // Strategy 3: NoEmbed (Last Resort - No Duration)
    try {
        const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
        const data = await response.json();

        return res.status(200).json({
            title: data.title,
            author: data.author_name,
            duration: '??:??',
            thumbnail: data.thumbnail_url
        });
    } catch (error) {
        console.error(`[API] NoEmbed failed:`, error);
    }

    return res.status(500).json({ error: 'Failed to fetch metadata' });
}
