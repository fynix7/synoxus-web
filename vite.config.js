import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { YoutubeTranscript } from 'youtube-transcript'
import https from 'https'
import { spawn, exec } from 'child_process'
import 'dotenv/config'

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

            console.log(`[Vite Proxy] Fetching transcript for: ${videoId}`);

            const formatTime = (seconds) => {
              const m = Math.floor(seconds / 60);
              const s = Math.floor(seconds % 60);
              return `[${m}:${s.toString().padStart(2, '0')}]`;
            };

            // Strategy -2: Puppeteer (Internal Agent - Most Robust & Supports Chapters)
            try {
              console.log(`[Vite Proxy] Strategy -2: Attempting Puppeteer (Internal Agent)...`);
              const result = await new Promise((resolve, reject) => {
                exec(`node scripts/get_transcript_puppeteer.js ${videoId}`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
                  if (error) {
                    reject(error);
                    return;
                  }
                  try {
                    const json = JSON.parse(stdout);
                    if (json.error) {
                      reject(new Error(json.error));
                    } else {
                      resolve(json);
                    }
                  } catch (e) {
                    reject(new Error('Failed to parse Puppeteer output'));
                  }
                });
              });

              if (result && result.segments && result.segments.length > 0) {
                console.log(`[Vite Proxy] Success! Found ${result.segments.length} segments and ${result.chapters?.length || 0} chapters.`);

                // Construct a rich transcript with timestamps for the simple view
                const fullText = result.segments.map(s => `[${s.timestamp}] ${s.text}`).join('\n');
                const truncatedText = fullText.length > 50000 ? fullText.substring(0, 50000) + "...(truncated)" : fullText;

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  transcript: truncatedText,
                  segments: result.segments,
                  chapters: result.chapters,
                  source: 'puppeteer'
                }));
                return;
              }
            } catch (puppeteerError) {
              console.warn(`[Vite Proxy] Puppeteer strategy failed:`, puppeteerError.message);
            }

            // Strategy -1: Python youtube-transcript-api (Most Reliable)
            try {
              console.log(`[Vite Proxy] Strategy -1: Attempting Python youtube-transcript-api...`);
              const transcript = await new Promise((resolve, reject) => {
                exec(`python scripts/get_transcript.py ${videoId}`, (error, stdout, stderr) => {
                  if (error) {
                    reject(error);
                    return;
                  }
                  try {
                    const result = JSON.parse(stdout);
                    if (result.error) {
                      reject(new Error(result.error));
                    } else {
                      resolve(result.transcript);
                    }
                  } catch (e) {
                    reject(new Error('Failed to parse Python output'));
                  }
                });
              });

              if (transcript && transcript.length > 0) {
                const truncatedText = transcript.length > 50000 ? transcript.substring(0, 50000) + "...(truncated)" : transcript;
                console.log(`[Vite Proxy] Success! Transcript length: ${truncatedText.length}`);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ transcript: truncatedText, source: 'python_api' }));
                return;
              }
            } catch (pythonError) {
              console.warn(`[Vite Proxy] Python strategy failed:`, pythonError.message);
            }

            // Strategy 0: ytdl-core (New & Robust)
            try {
              console.log(`[Vite Proxy] Strategy 0: Attempting ytdl-core...`);
              const ytdl = (await import('@distube/ytdl-core')).default;
              const info = await ytdl.getInfo(videoId);
              const tracks = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks;

              if (tracks && tracks.length > 0) {
                const track = tracks.find(t => t.languageCode === 'en') || tracks[0];
                if (track && track.baseUrl) {
                  console.log(`[Vite Proxy] Fetching caption from: ${track.baseUrl}`);
                  const captionRes = await fetch(track.baseUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                  });
                  const captionXml = await captionRes.text();

                  if (captionXml && captionXml.length > 0) {
                    const textMatch = captionXml.match(/<text start="([\d.]+)" dur="[\d.]+">([^<]+)<\/text>/g);
                    if (textMatch) {
                      const transcriptText = textMatch.map(line => {
                        const startMatch = line.match(/start="([\d.]+)"/);
                        const contentMatch = line.match(/>([^<]+)</);
                        if (startMatch && contentMatch) {
                          const start = parseFloat(startMatch[1]);
                          const content = contentMatch[1]
                            .replace(/&#39;/g, "'")
                            .replace(/&quot;/g, '"')
                            .replace(/&amp;/g, '&');
                          return `${formatTime(start)} ${content}`;
                        }
                        return '';
                      }).join('\n');

                      const truncatedText = transcriptText.length > 50000 ? transcriptText.substring(0, 50000) + "...(truncated)" : transcriptText;
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify({ transcript: truncatedText, source: 'ytdl-core' }));
                      return;
                    }
                  }
                }
              }
            } catch (e) {
              console.warn(`[Vite Proxy] ytdl-core failed:`, e.message);
            }

            // Strategy 1: Invidious API (Primary - Most Robust against IP blocks)
            try {
              console.log(`[Vite Proxy] Strategy 1: Attempting Invidious API...`);
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
                  console.log(`[Vite Proxy] Trying instance: ${instance}`);
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout per instance

                  // First check if video exists and has captions
                  const infoRes = await fetch(`${instance}/api/v1/videos/${videoId}`, {
                    signal: controller.signal,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                  });
                  clearTimeout(timeoutId);

                  if (!infoRes.ok) {
                    console.log(`[Vite Proxy] Instance ${instance} returned status ${infoRes.status}`);
                    continue;
                  }

                  const info = await infoRes.json();
                  const captions = info.captions;

                  if (captions && captions.length > 0) {
                    console.log(`[Vite Proxy] Found ${captions.length} captions on ${instance}`);
                    // Prefer English
                    const track = captions.find(c => c.label.startsWith('English') || c.language === 'en') || captions[0];

                    if (track && track.url) {
                      const captionUrl = track.url.startsWith('http') ? track.url : `${instance}${track.url}`;
                      console.log(`[Vite Proxy] Fetching caption from: ${captionUrl}`);
                      const captionRes = await fetch(captionUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                      const captionText = await captionRes.text();

                      let formattedText = captionText;
                      if (captionText.startsWith('WEBVTT')) {
                        const lines = captionText.split('\n');
                        let output = [];
                        let currentStart = null;

                        for (let i = 0; i < lines.length; i++) {
                          const line = lines[i].trim();
                          if (line.includes('-->')) {
                            const parts = line.split('-->');
                            if (parts[0]) {
                              currentStart = parts[0].trim().split('.')[0]; // Remove millis
                            }
                          } else if (line && !line.startsWith('WEBVTT') && !/^\d+$/.test(line)) {
                            if (currentStart) {
                              output.push(`[${currentStart}] ${line}`);
                              currentStart = null; // Reset
                            } else {
                              output.push(line);
                            }
                          }
                        }
                        formattedText = output.join('\n');
                      } else {
                        // Fallback cleanup if not VTT
                        formattedText = captionText.replace(/^WEBVTT\s+/, '');
                        formattedText = formattedText.replace(/<[^>]+>/g, ''); // Remove XML tags if any
                      }

                      const truncatedText = formattedText.length > 50000 ? formattedText.substring(0, 50000) + "...(truncated)" : formattedText;
                      console.log(`[Vite Proxy] Success! Transcript length: ${truncatedText.length}`);

                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify({ transcript: truncatedText, source: 'invidious' }));
                      return;
                    }
                  } else {
                    console.log(`[Vite Proxy] No captions found on ${instance}`);
                  }
                } catch (e) {
                  console.warn(`[Vite Proxy] Invidious instance ${instance} failed:`, e.message);
                }
              }
            } catch (invidiousError) {
              console.warn('[Vite Proxy] Invidious strategy failed:', invidiousError.message);
            }

            // Strategy 2: YoutubeTranscript Library (Fast but prone to rate limits)
            try {
              console.log(`[Vite Proxy] Strategy 2: Attempting YoutubeTranscript Library...`);
              const transcript = await YoutubeTranscript.fetchTranscript(videoId);
              if (transcript && transcript.length > 0) {
                const fullText = transcript.map(item => {
                  return `${formatTime(item.offset / 1000)} ${item.text}`;
                }).join('\n');

                if (fullText.trim()) {
                  const truncatedText = fullText.length > 50000 ? fullText.substring(0, 50000) + "...(truncated)" : fullText;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ transcript: truncatedText, source: 'library' }));
                  return;
                }
              }
            } catch (error) {
              console.warn(`[Vite Proxy] Library fetch failed:`, error.message);
            }

            // Strategy 3: Direct YouTube Scrape (Fallback)
            try {
              console.log(`[Vite Proxy] Strategy 3: Attempting Direct Scrape...`);
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

              const captionsRegex = /"captionTracks":\s*(\[.*?\])/;
              const match = html.match(captionsRegex);
              if (match && match[1]) {
                const captionTracks = JSON.parse(match[1]);
                const track = captionTracks.find(t => t.languageCode === 'en') || captionTracks[0];
                if (track && track.baseUrl) {
                  const trackXml = await new Promise((resolve, reject) => {
                    const u = new URL(track.baseUrl);
                    const options = {
                      hostname: u.hostname,
                      path: u.pathname + u.search,
                      method: 'GET',
                      headers: { 'User-Agent': 'Mozilla/5.0' }
                    };
                    const req = https.request(options, (res) => {
                      let data = '';
                      res.on('data', (chunk) => data += chunk);
                      res.on('end', () => resolve(data));
                    });
                    req.on('error', (e) => reject(e));
                    req.end();
                  });

                  const textMatch = trackXml.match(/<text start="([\d.]+)" dur="[\d.]+">([^<]+)<\/text>/g);
                  if (textMatch) {
                    const transcriptText = textMatch.map(line => {
                      const startMatch = line.match(/start="([\d.]+)"/);
                      const contentMatch = line.match(/>([^<]+)</);
                      if (startMatch && contentMatch) {
                        const start = parseFloat(startMatch[1]);
                        const content = contentMatch[1]
                          .replace(/<[^>]+>/g, '')
                          .replace(/&#39;/g, "'")
                          .replace(/&quot;/g, '"');
                        return `${formatTime(start)} ${content}`;
                      }
                      return '';
                    }).join('\n');

                    const truncatedText = transcriptText.length > 50000 ? transcriptText.substring(0, 50000) + "...(truncated)" : transcriptText;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ transcript: truncatedText, source: 'direct_scrape' }));
                    return;
                  }
                }
              }
            } catch (directError) {
              console.warn('[Vite Proxy] Direct scrape failed:', directError.message);
            }

            // Strategy 4: Fallback Site (youtubetranscript.com)
            try {
              console.log(`[Vite Proxy] Strategy 4: Attempting Fallback Site...`);
              const response = await fetch(`https://youtubetranscript.com/?server_vid=${videoId}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
              });
              const text = await response.text();
              const match = text.match(/<text start="([\d.]+)" dur="[\d.]+">([^<]+)<\/text>/g);
              if (match) {
                const transcriptText = match.map(line => {
                  const startMatch = line.match(/start="([\d.]+)"/);
                  const contentMatch = line.match(/>([^<]+)</);
                  if (startMatch && contentMatch) {
                    const start = parseFloat(startMatch[1]);
                    const content = contentMatch[1]
                      .replace(/<[^>]+>/g, '')
                      .replace(/&#39;/g, "'")
                      .replace(/&quot;/g, '"');
                    return `${formatTime(start)} ${content}`;
                  }
                  return '';
                }).join('\n');

                if (!transcriptText.includes("Please stop using a bot") && !transcriptText.includes("Bitte hören Sie auf")) {
                  const truncatedText = transcriptText.length > 50000 ? transcriptText.substring(0, 50000) + "...(truncated)" : transcriptText;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ transcript: truncatedText, source: 'fallback_site' }));
                  return;
                } else {
                  console.warn('[Vite Proxy] Fallback site blocked bot');
                }
              }
            } catch (fallbackError) {
              console.warn('[Vite Proxy] Fallback site failed:', fallbackError.message);
            }

            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to fetch transcript from all sources' }));
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

            console.log(`[Vite Proxy] Fetching metadata for: ${videoId}`);

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

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    title: data.title,
                    author: data.author,
                    duration,
                    thumbnail: data.videoThumbnails?.find(t => t.quality === 'medium')?.url || data.videoThumbnails?.[0]?.url
                  }));
                  return;
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

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    title: videoDetails.title,
                    author: videoDetails.author,
                    duration,
                    thumbnail: videoDetails.thumbnail.thumbnails.pop().url
                  }));
                  return;
                }
              }
            } catch (error) {
              console.error(`[Vite Proxy] Direct metadata scrape failed:`, error);
            }

            // Strategy 3: NoEmbed (Last Resort - No Duration)
            try {
              const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
              const data = await response.json();

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                title: data.title,
                author: data.author_name,
                duration: '??:??',
                thumbnail: data.thumbnail_url
              }));
              return;
            } catch (error) {
              console.error(`[Vite Proxy] NoEmbed failed:`, error);
            }

            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to fetch metadata' }));
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

          // Handle /api/architect
          if (req.url.startsWith('/api/architect')) {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              try {
                req.body = JSON.parse(body);

                // Dynamic import of the API handler
                const { default: handler } = await import('./api/architect.js');

                // Mock response object to match Vercel/Express
                const mockRes = {
                  status: (code) => {
                    res.statusCode = code;
                    return mockRes;
                  },
                  json: (data) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                    return mockRes;
                  },
                  setHeader: (name, value) => res.setHeader(name, value),
                  end: (data) => res.end(data)
                };

                await handler(req, mockRes);

              } catch (error) {
                console.error('[Vite Proxy] Architect error:', error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: error.message }));
              }
            });
            return;
          }

          // Handle /api/scout/run - Run scout script locally
          if (req.url.startsWith('/api/scout/run')) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
              res.statusCode = 200;
              res.end();
              return;
            }

            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              try {
                const { channelUrl } = JSON.parse(body);

                if (!channelUrl) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Channel URL is required', success: false }));
                  return;
                }

                // Spawn the scout script in the background
                const { spawn } = await import('child_process');

                // Get the current port from the request
                const port = req.headers.host?.split(':')[1] || '5173';

                const scoutProcess = spawn('node', [
                  'scripts/outlier_scout/scout.js',
                  channelUrl
                ], {
                  cwd: process.cwd(),
                  env: {
                    ...process.env,
                    API_URL: `http://localhost:${port}/api/scout/save`
                  },
                  detached: true,
                  stdio: 'ignore'
                });

                scoutProcess.unref(); // Allow the parent to exit independently

                console.log(`[Vite Proxy] Scout started for: ${channelUrl} (PID: ${scoutProcess.pid})`);

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: true,
                  message: 'Scout started in background. Check the terminal for progress.',
                  pid: scoutProcess.pid
                }));

              } catch (error) {
                console.error('[Vite Proxy] Scout run error:', error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: error.message, success: false }));
              }
            });
            return;
          }

          // Handle /api/scout/save
          if (req.url.startsWith('/api/scout/save')) {
            if (req.method === 'OPTIONS') {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
              res.statusCode = 200;
              res.end();
              return;
            }

            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              try {
                const { outliers, channelUrl } = JSON.parse(body);

                if (!outliers || !Array.isArray(outliers)) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Invalid outliers data' }));
                  return;
                }

                // Dynamic import for Supabase
                const { createClient } = await import('@supabase/supabase-js');
                const supabase = createClient(
                  process.env.VITE_SUPABASE_URL,
                  process.env.VITE_SUPABASE_ANON_KEY
                );

                // 1. Upsert Channel
                let channelId;
                if (channelUrl) {
                  const { data: channelData } = await supabase
                    .from('os_channels')
                    .select('id')
                    .eq('url', channelUrl)
                    .single();

                  if (channelData) {
                    channelId = channelData.id;
                    await supabase.from('os_channels').update({ last_scouted: new Date().toISOString() }).eq('id', channelId);
                  } else {
                    const { data: newChannel } = await supabase
                      .from('os_channels')
                      .insert([{ url: channelUrl, last_scouted: new Date().toISOString() }])
                      .select()
                      .single();
                    if (newChannel) channelId = newChannel.id;
                  }
                }

                // 2. Insert Outliers
                const outliersToInsert = outliers.map(o => ({
                  video_id: o.video_id,
                  title: o.video_title,
                  views: o.views,
                  outlier_score: o.outlier_score,
                  thumbnail: o.local_webp_path || o.thumbnail_url,
                  channel_id: channelId,
                  published_at: null,
                  scouted_at: new Date().toISOString()
                }));

                const { error: outliersError } = await supabase
                  .from('os_outliers')
                  .upsert(outliersToInsert, { onConflict: 'video_id' });

                if (outliersError) throw outliersError;

                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify({ success: true, count: outliers.length }));

              } catch (error) {
                console.error('[Vite Proxy] Scout save error:', error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: error.message }));
              }
            });
            return;
          }

          next();
        });
      },
    },
  ],
})
