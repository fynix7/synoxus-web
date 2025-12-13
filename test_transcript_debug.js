import { YoutubeTranscript } from 'youtube-transcript';

const videoId = 'dQw4w9WgXcQ'; // Rick Roll (definitely has captions)

async function testTranscript() {
    console.log(`Testing transcript fetch for video: ${videoId}`);

    // 3. Try Direct YouTube Scrape (New Fallback)
    try {
        console.log('Attempting Direct YouTube Scrape...');
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });
        const html = await response.text();

        // Look for captionTracks
        const captionsRegex = /"captionTracks":\s*(\[.*?\])/;
        const match = html.match(captionsRegex);

        if (match && match[1]) {
            const captionTracks = JSON.parse(match[1]);
            console.log(`✅ Found ${captionTracks.length} caption tracks.`);

            // Find English or first
            const track = captionTracks.find(t => t.languageCode === 'en') || captionTracks[0];
            console.log(`Fetching track: ${track.name.simpleText} (${track.languageCode})`);

            const trackRes = await fetch(track.baseUrl);
            const trackXml = await trackRes.text();

            console.log('Track XML Preview:', trackXml.substring(0, 100));

            // Simple XML parse
            const textMatch = trackXml.match(/<text start="[\d.]+" dur="[\d.]+">([^<]+)<\/text>/g);
            if (textMatch) {
                const fullText = textMatch
                    .map(line => line.replace(/<[^>]+>/g, ''))
                    .join(' ')
                    .replace(/&#39;/g, "'")
                    .replace(/&quot;/g, '"');
                console.log('✅ Successfully extracted text!');
                console.log('Preview:', fullText.substring(0, 100));
            }

        } else {
            console.error('❌ Could not find captionTracks in HTML.');
            // console.log('HTML Preview:', html.substring(0, 500)); 
        }

    } catch (e) {
        console.error('❌ Direct Scrape Failed:', e.message);
    }
}

testTranscript();
