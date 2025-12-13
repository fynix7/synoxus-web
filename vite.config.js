import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { YoutubeTranscript } from 'youtube-transcript'
import https from 'https'
import { spawn } from 'child_process'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'configure-server',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          // Handle /api/transcript
          if (req.url.startsWith('/api/transcript')) {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const videoId = url.searchParams.get('videoId');

            if (!videoId) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing videoId' }));
              return;
            }

            try {
              console.log(`[Vite Proxy] Fetching transcript for: ${videoId}`);
              const transcript = await YoutubeTranscript.fetchTranscript(videoId);
              if (!transcript || transcript.length === 0) {
                throw new Error('Empty transcript returned by library');
              }
              const fullText = transcript.map(item => item.text).join(' ');
              if (!fullText.trim()) {
                throw new Error('Empty transcript text returned by library');
              }
              const truncatedText = fullText.length > 25000 ? fullText.substring(0, 25000) + "...(truncated)" : fullText;

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ transcript: truncatedText, source: 'library' }));
            } catch (error) {
              console.error(`[Vite Proxy] Transcript fetch failed:`, error);

              // 2. Fallback method: Direct YouTube Scrape (Most Robust)
              try {
                console.log(`[Vite Proxy] Attempting direct YouTube scrape for: ${videoId}`);

                const html = await new Promise((resolve, reject) => {
                  const options = {
                    hostname: 'www.youtube.com',
                    path: `/watch?v=${videoId}`,
                    method: 'GET',
                    headers: {
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                      'Accept-Language': 'en-US,en;q=0.9',
                    }
                  };

                  const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => resolve(data));
                  });

                  req.on('error', (e) => reject(e));
                  req.end();
                });

                console.log(`[Vite Proxy] Direct scrape HTML length: ${html.length}`);
                if (html.includes('consent.youtube.com')) console.log('[Vite Proxy] Hit consent page');
                if (html.includes('Sign in to confirm your age')) console.log('[Vite Proxy] Hit age restriction');

                const captionsRegex = /"captionTracks":\s*(\[.*?\])/;
                const match = html.match(captionsRegex);
                console.log(`[Vite Proxy] Captions match found: ${!!match}`);

                if (match && match[1]) {
                  const captionTracks = JSON.parse(match[1]);
                  console.log(`[Vite Proxy] Found ${captionTracks.length} caption tracks`);
                  // Prefer English, otherwise take the first one
                  const track = captionTracks.find(t => t.languageCode === 'en') || captionTracks[0];

                  if (track && track.baseUrl) {
                    console.log(`[Vite Proxy] Fetching track XML from: ${track.baseUrl.substring(0, 50)}...`);
                    const trackXml = await new Promise((resolve, reject) => {
                      const url = new URL(track.baseUrl);
                      const options = {
                        hostname: url.hostname,
                        path: url.pathname + url.search,
                        method: 'GET',
                        headers: {
                          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                          'Accept-Language': 'en-US,en;q=0.9',
                        }
                      };

                      const req = https.request(options, (res) => {
                        let data = '';
                        res.on('data', (chunk) => data += chunk);
                        res.on('end', () => resolve(data));
                      });

                      req.on('error', (e) => reject(e));
                      req.end();
                    });
                    console.log(`[Vite Proxy] Track XML length: ${trackXml.length}`);
                    console.log(`[Vite Proxy] Track XML preview: ${trackXml.substring(0, 200)}`);

                    const textMatch = trackXml.match(/<text start="[\d.]+" dur="[\d.]+">([^<]+)<\/text>/g);
                    console.log(`[Vite Proxy] XML regex match found: ${!!textMatch}`);

                    if (textMatch) {
                      const transcriptText = textMatch
                        .map(line => line.replace(/<[^>]+>/g, ''))
                        .join(' ')
                        .replace(/&#39;/g, "'")
                        .replace(/&quot;/g, '"');

                      const truncatedText = transcriptText.length > 25000 ? transcriptText.substring(0, 25000) + "...(truncated)" : transcriptText;

                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify({ transcript: truncatedText, source: 'direct_scrape' }));
                      return;
                    }
                  }
                }
              } catch (directError) {
                console.warn('[Vite Proxy] Direct scrape failed, trying final fallback:', directError.message);
              }

              // 3. Fallback method: Invidious API (Very Robust for Metadata/Captions)
              try {
                console.log(`[Vite Proxy] Attempting Invidious API fetch for: ${videoId}`);
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

                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ transcript: truncatedText, source: 'invidious' }));
                        return;
                      }
                    }
                  } catch (e) {
                    console.warn(`[Vite Proxy] Invidious instance ${instance} failed:`, e.message);
                  }
                }
              } catch (invidiousError) {
                console.warn('[Vite Proxy] Invidious fetch failed:', invidiousError.message);
              }

              // 4. Ultimate Fallback: Python youtube-transcript-api (Local Only)
              try {
                console.log(`[Vite Proxy] Attempting Python fallback for: ${videoId}`);
                const pythonTranscript = await new Promise((resolve, reject) => {
                  const py = spawn('python', ['-m', 'youtube_transcript_api', videoId, '--format', 'json']);
                  let data = '';
                  let error = '';

                  py.stdout.on('data', (chunk) => data += chunk);
                  py.stderr.on('data', (chunk) => error += chunk);

                  py.on('close', (code) => {
                    if (code !== 0) {
                      reject(new Error(`Python script exited with code ${code}: ${error}`));
                    } else {
                      resolve(data);
                    }
                  });
                });

                const json = JSON.parse(pythonTranscript);
                // CLI returns a list of transcripts, usually [[{text:...}, ...]]
                const transcriptList = (Array.isArray(json) && Array.isArray(json[0])) ? json[0] : json;

                if (Array.isArray(transcriptList) && transcriptList.length > 0) {
                  const fullText = transcriptList.map(item => item.text).join(' ');
                  const truncatedText = fullText.length > 25000 ? fullText.substring(0, 25000) + "...(truncated)" : fullText;

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ transcript: truncatedText, source: 'python_fallback' }));
                  return;
                }
              } catch (pythonError) {
                console.warn('[Vite Proxy] Python fallback failed:', pythonError.message);
              }

              // 5. Final Fallback: youtubetranscript.com scraping
              try {
                console.log(`[Vite Proxy] Attempting fallback scrape for: ${videoId}`);
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

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ transcript: transcriptText, source: 'fallback_site' }));
                  return;
                }
              } catch (fallbackError) {
                console.error(`[Vite Proxy] Fallback scrape failed:`, fallbackError);
              }

              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to fetch transcript' }));
            }
            return;
          }

          // Handle /api/metadata
          if (req.url.startsWith('/api/metadata')) {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const videoId = url.searchParams.get('videoId');

            if (!videoId) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing videoId' }));
              return;
            }

            try {
              console.log(`[Vite Proxy] Fetching metadata for: ${videoId}`);
              const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
              });
              const text = await response.text();

              const jsonMatch = text.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
              if (!jsonMatch) throw new Error('Could not find player response');

              const data = JSON.parse(jsonMatch[1]);
              const videoDetails = data.videoDetails;

              if (!videoDetails) throw new Error('No video details found');

              const lengthSeconds = parseInt(videoDetails.lengthSeconds);
              const minutes = Math.floor(lengthSeconds / 60);
              const seconds = lengthSeconds % 60;
              const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                title: videoDetails.title,
                author: videoDetails.author,
                duration,
                thumbnail: videoDetails.thumbnail.thumbnails.pop().url
              }));
            } catch (error) {
              console.error(`[Vite Proxy] Metadata fetch failed:`, error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to fetch metadata' }));
            }
            return;
          }

          // Handle /api/channel
          if (req.url.startsWith('/api/channel')) {
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const inputUrl = urlObj.searchParams.get('url');

            if (!inputUrl) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing url' }));
              return;
            }

            try {
              let channelId = null;

              // 1. Try to extract Channel ID directly from URL
              const idMatch = inputUrl.match(/channel\/(UC[\w-]{21}[AQgw])/);
              if (idMatch) {
                channelId = idMatch[1];
              } else {
                // 2. Resolve Handle or Custom URL
                // Fetch the page and look for channelId
                console.log(`[Vite Proxy] Resolving channel for: ${inputUrl}`);
                const html = await new Promise((resolve, reject) => {
                  const targetUrl = inputUrl.startsWith('http') ? inputUrl : `https://www.youtube.com/${inputUrl}`;
                  const u = new URL(targetUrl);
                  const options = {
                    hostname: u.hostname,
                    path: u.pathname + u.search,
                    method: 'GET',
                    headers: {
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                      'Accept-Language': 'en-US,en;q=0.9',
                    }
                  };

                  const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => resolve(data));
                  });

                  req.on('error', (e) => reject(e));
                  req.end();
                });

                const metaMatch = html.match(/<meta itemprop="channelId" content="([^"]+)"/);
                if (metaMatch) {
                  channelId = metaMatch[1];
                }
              }

              if (!channelId) {
                throw new Error('Could not resolve Channel ID');
              }

              console.log(`[Vite Proxy] Found Channel ID: ${channelId}`);

              // 3. Fetch Videos using Invidious (Primary)
              const instances = [
                'https://inv.tux.pizza',
                'https://invidious.projectsegfau.lt',
                'https://invidious.jing.rocks',
                'https://vid.puffyan.us',
                'https://invidious.privacydev.net'
              ];

              let videos = [];
              let success = false;

              for (const instance of instances) {
                try {
                  console.log(`[Vite Proxy] Fetching channel videos from ${instance}...`);
                  const response = await fetch(`${instance}/api/v1/channels/${channelId}/videos`);
                  if (response.ok) {
                    const data = await response.json();
                    videos = data.map(v => ({
                      id: v.videoId,
                      title: v.title,
                      duration: v.lengthSeconds ? `${Math.floor(v.lengthSeconds / 60)}:${(v.lengthSeconds % 60).toString().padStart(2, '0')}` : '??:??',
                      date: new Date(v.published * 1000).toLocaleDateString(),
                      thumbnail: v.videoThumbnails?.find(t => t.quality === 'medium')?.url || v.videoThumbnails?.[0]?.url || `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`,
                      author: v.author
                    }));
                    success = true;
                    break;
                  }
                } catch (e) {
                  console.warn(`[Vite Proxy] Failed on ${instance}:`, e.message);
                }
              }

              // 4. Fallback: RSS Feed (Reliable but limited metadata)
              if (!success) {
                console.log(`[Vite Proxy] Invidious failed, trying RSS fallback...`);
                const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
                if (rssRes.ok) {
                  const xml = await rssRes.text();
                  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
                  let match;

                  while ((match = entryRegex.exec(xml)) !== null) {
                    const entry = match[1];
                    const idMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
                    const titleMatch = entry.match(/<title>(.*?)<\/title>/);
                    const authorMatch = entry.match(/<name>(.*?)<\/name>/);
                    const publishedMatch = entry.match(/<published>(.*?)<\/published>/);

                    if (idMatch && titleMatch) {
                      videos.push({
                        id: idMatch[1],
                        title: titleMatch[1],
                        duration: '??:??', // RSS doesn't have duration
                        date: publishedMatch ? new Date(publishedMatch[1]).toLocaleDateString() : 'Recently',
                        thumbnail: `https://img.youtube.com/vi/${idMatch[1]}/mqdefault.jpg`,
                        author: authorMatch ? authorMatch[1] : 'Unknown'
                      });
                    }
                  }
                  if (videos.length > 0) success = true;
                }
              }

              if (!success) {
                throw new Error('Failed to fetch channel videos from all sources');
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(videos));

            } catch (error) {
              console.error(`[Vite Proxy] Channel fetch failed:`, error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
            return;
          }

          next();
        });
      },
    },
  ],
})
