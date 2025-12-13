import fetch from 'node-fetch';

export default async function handler(req, res) {
    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: 'Missing videoId' });
    }

    try {
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const text = await response.text();

        // Extract ytInitialPlayerResponse
        const jsonMatch = text.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
        if (!jsonMatch) {
            throw new Error('Could not find player response');
        }

        const data = JSON.parse(jsonMatch[1]);
        const videoDetails = data.videoDetails;

        if (!videoDetails) {
            throw new Error('No video details found');
        }

        const title = videoDetails.title;
        const author = videoDetails.author;
        const lengthSeconds = parseInt(videoDetails.lengthSeconds);
        const thumbnail = videoDetails.thumbnail.thumbnails.pop().url; // Get highest quality

        // Format duration
        const minutes = Math.floor(lengthSeconds / 60);
        const seconds = lengthSeconds % 60;
        const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        res.status(200).json({
            title,
            author,
            duration,
            thumbnail
        });

    } catch (error) {
        console.error('Metadata fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch metadata' });
    }
}
