import { YoutubeTranscript } from 'youtube-transcript';

export default async function handler(req, res) {
    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: 'Missing videoId parameter' });
    }

    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);

        // Combine transcript into a single string
        const fullText = transcript.map(item => item.text).join(' ');

        // Limit length to avoid token limits (approx 25k chars is safe for most models)
        const truncatedText = fullText.length > 25000 ? fullText.substring(0, 25000) + "...(truncated)" : fullText;

        res.status(200).json({ transcript: truncatedText });
    } catch (error) {
        console.error('Transcript Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch transcript. Video might not have captions.' });
    }
}
