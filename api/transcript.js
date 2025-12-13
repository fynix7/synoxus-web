import { YoutubeTranscript } from 'youtube-transcript';

export default async function handler(req, res) {
    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: 'Missing videoId parameter' });
    }

    // Try primary method: youtube-transcript library
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        if (!transcript || transcript.length === 0) {
            throw new Error('Empty transcript returned by library');
        }
        const fullText = transcript.map(item => item.text).join(' ');
        if (!fullText.trim()) {
            throw new Error('Empty transcript text returned by library');
        }
        const truncatedText = fullText.length > 25000 ? fullText.substring(0, 25000) + "...(truncated)" : fullText;
        return res.status(200).json({ transcript: truncatedText, source: 'library' });
    } catch (primaryError) {
        console.warn('Primary fetch failed, trying fallback:', primaryError.message);
    }

    // 2. Fallback method: Direct YouTube Scrape (Most Robust)
    try {
        console.log(`[API] Attempting direct YouTube scrape for: ${videoId}`);
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });
        const html = await response.text();

        const captionsRegex = /"captionTracks":\s*(\[.*?\])/;
        const match = html.match(captionsRegex);

        if (match && match[1]) {
            const captionTracks = JSON.parse(match[1]);
            // Prefer English, otherwise take the first one
            const track = captionTracks.find(t => t.languageCode === 'en') || captionTracks[0];

            if (track && track.baseUrl) {
                const trackRes = await fetch(track.baseUrl);
                const trackXml = await trackRes.text();

                const textMatch = trackXml.match(/<text start="[\d.]+" dur="[\d.]+">([^<]+)<\/text>/g);
                if (textMatch) {
                    const transcriptText = textMatch
                        .map(line => line.replace(/<[^>]+>/g, ''))
                        .join(' ')
                        .replace(/&#39;/g, "'")
                        .replace(/&quot;/g, '"');

                    const truncatedText = transcriptText.length > 25000 ? transcriptText.substring(0, 25000) + "...(truncated)" : transcriptText;
                    return res.status(200).json({ transcript: truncatedText, source: 'direct_scrape' });
                }
            }
        }
    } catch (directError) {
        console.warn('Direct scrape failed, trying final fallback:', directError.message);
    }

    // 3. Fallback method: Invidious API (Very Robust for Metadata/Captions)
    try {
        console.log(`[API] Attempting Invidious API fetch for: ${videoId}`);
        // List of reliable instances
        const instances = [
            'https://inv.tux.pizza',
            'https://invidious.projectsegfau.lt',
            'https://invidious.jing.rocks',
            'https://vid.puffyan.us'
        ];

        for (const instance of instances) {
            try {
                const infoRes = await fetch(`${instance}/api/v1/videos/${videoId}`);
                if (!infoRes.ok) continue;

                const info = await infoRes.json();
                const captions = info.captions;

                if (captions && captions.length > 0) {
                    // Prefer English
                    const track = captions.find(c => c.label.startsWith('English') || c.language === 'en') || captions[0];

                    if (track && track.url) {
                        const captionUrl = track.url.startsWith('http') ? track.url : `${instance}${track.url}`;
                        const captionRes = await fetch(captionUrl);
                        const captionText = await captionRes.text();

                        // Invidious returns VTT usually. Simple cleanup:
                        // Remove header
                        let cleanText = captionText.replace(/^WEBVTT\s+/, '');
                        // Remove timestamps and cues
                        cleanText = cleanText.replace(/\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}.*\n/g, '');
                        cleanText = cleanText.replace(/\n+/g, ' ').trim();

                        const truncatedText = cleanText.length > 25000 ? cleanText.substring(0, 25000) + "...(truncated)" : cleanText;
                        return res.status(200).json({ transcript: truncatedText, source: 'invidious' });
                    }
                }
            } catch (e) {
                console.warn(`Invidious instance ${instance} failed:`, e.message);
            }
        }
    } catch (invidiousError) {
        console.warn('Invidious fetch failed:', invidiousError.message);
    }

    // 4. Final Fallback: Scrape youtubetranscript.com (XML method)
    try {
        console.log(`[API] Attempting fallback scrape for: ${videoId}`);
        const scrapeRes = await fetch(`https://youtubetranscript.com/?server_vid=${videoId}`);
        const text = await scrapeRes.text();

        // Extract XML content
        const match = text.match(/<text start="[\d.]+" dur="[\d.]+">([^<]+)<\/text>/g);
        if (match) {
            const transcriptText = match
                .map(line => line.replace(/<[^>]+>/g, ''))
                .join(' ')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"');

            if (transcriptText.includes("Please stop using a bot") || transcriptText.includes("Bitte hören Sie auf")) {
                throw new Error('Fallback site blocked bot');
            }

            const truncatedText = transcriptText.length > 25000 ? transcriptText.substring(0, 25000) + "...(truncated)" : transcriptText;
            return res.status(200).json({ transcript: truncatedText, source: 'fallback_site' });
        } else {
            throw new Error('Could not parse XML from fallback site');
        }
    } catch (fallbackError) {
        console.error('All fetch methods failed:', fallbackError);
        return res.status(500).json({ error: 'Failed to fetch transcript from all sources.' });
    }
}
