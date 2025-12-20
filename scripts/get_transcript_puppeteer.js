import puppeteer from 'puppeteer';

const videoId = process.argv[2];
if (!videoId) {
    console.log(JSON.stringify({ error: 'No video ID provided' }));
    process.exit(1);
}

const url = `https://www.youtube.com/watch?v=${videoId}`;

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            dumpio: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        const page = await browser.newPage();

        // Set a realistic User Agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Capture transcript response (both old timedtext and new get_transcript)
        let transcriptSegments = [];
        await page.setRequestInterception(true);
        page.on('request', request => {
            request.continue();
        });

        page.on('response', async response => {
            const url = response.url();

            // Strategy 1: Old timedtext API (XML)
            if (url.includes('/api/timedtext')) {
                try {
                    const text = await response.text();
                    if (text && text.length > 0) {
                        // Parse XML
                        const regex = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>(.*?)<\/text>/g;
                        let match;
                        while ((match = regex.exec(text)) !== null) {
                            const start = parseFloat(match[1]);
                            const content = match[3].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

                            const date = new Date(0);
                            date.setSeconds(start);
                            const timeString = start >= 3600 ? date.toISOString().substr(11, 8) : date.toISOString().substr(14, 5);

                            transcriptSegments.push({ timestamp: timeString, text: content });
                        }
                    }
                } catch (e) { }
            }

            // Strategy 2: New get_transcript API (JSON)
            if (url.includes('get_transcript')) {
                try {
                    const json = await response.json();
                    const findSegments = (obj) => {
                        if (!obj) return;
                        if (obj.transcriptSegmentRenderer) {
                            const seg = obj.transcriptSegmentRenderer;
                            const timeText = seg.startTimeText ? seg.startTimeText.simpleText : '';
                            const contentText = seg.snippet ? seg.snippet.runs.map(r => r.text).join('') : '';
                            if (timeText && contentText) {
                                transcriptSegments.push({ timestamp: timeText, text: contentText });
                            }
                        }
                        if (Array.isArray(obj)) {
                            obj.forEach(findSegments);
                        } else if (typeof obj === 'object') {
                            Object.values(obj).forEach(findSegments);
                        }
                    };
                    findSegments(json);
                } catch (e) { }
            }
        });

        // Go to video
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // 1. Handle Consent Popup
        try {
            const consentButton = await page.$('button[aria-label="Accept all"]');
            if (consentButton) {
                await consentButton.click();
                await new Promise(r => setTimeout(r, 2000));
            }
        } catch (e) { }

        // 2. Extract Chapters (Description)
        let chapters = [];
        try {
            const moreSelector = '#expand';
            try {
                await page.waitForSelector(moreSelector, { timeout: 2000 });
                await page.click(moreSelector);
                await new Promise(r => setTimeout(r, 500));
            } catch (e) { }

            const descriptionEl = await page.$('#description-inline-expander');
            if (descriptionEl) {
                const description = await page.evaluate(el => el.innerText, descriptionEl);
                const lines = description.split('\n');
                const chapterRegex = /(\d{1,2}(?::\d{2})+)\s+(.*)/;

                for (const line of lines) {
                    const match = line.match(chapterRegex);
                    if (match) {
                        chapters.push({
                            timestamp: match[1],
                            title: match[2].trim()
                        });
                    }
                }
            }
        } catch (e) { }

        // 3. Check ytInitialData for preloaded transcript
        if (transcriptSegments.length === 0) {
            try {
                const initialDataSegments = await page.evaluate(() => {
                    const data = window.ytInitialData;
                    const segments = [];
                    const findSegments = (obj) => {
                        if (!obj) return;
                        if (obj.transcriptSegmentRenderer) {
                            const seg = obj.transcriptSegmentRenderer;
                            const timeText = seg.startTimeText ? seg.startTimeText.simpleText : '';
                            const contentText = seg.snippet ? seg.snippet.runs.map(r => r.text).join('') : '';
                            if (timeText && contentText) {
                                segments.push({ timestamp: timeText, text: contentText });
                            }
                        }
                        if (Array.isArray(obj)) {
                            obj.forEach(findSegments);
                        } else if (typeof obj === 'object') {
                            Object.values(obj).forEach(findSegments);
                        }
                    };
                    findSegments(data);
                    return segments;
                });
                if (initialDataSegments.length > 0) {
                    transcriptSegments = initialDataSegments;
                }
            } catch (e) { }
        }

        // 4. Trigger Transcript Load (if not found yet)
        if (transcriptSegments.length === 0) {
            try {
                await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button, ytd-button-renderer'));
                    const showTranscriptBtn = buttons.find(b => b.innerText && b.innerText.toLowerCase().includes('show transcript'));
                    if (showTranscriptBtn) showTranscriptBtn.click();
                });

                // Wait for response
                for (let i = 0; i < 10; i++) {
                    if (transcriptSegments.length > 0) break;
                    await new Promise(r => setTimeout(r, 1000));
                }
            } catch (e) { }
        }

        if (transcriptSegments.length === 0) {
            throw new Error('Could not capture transcript data.');
        }

        console.log(JSON.stringify({
            chapters,
            segments: transcriptSegments,
            transcript: transcriptSegments.map(s => s.text).join(' ')
        }));

    } catch (error) {
        console.log(JSON.stringify({ error: error.message }));
    } finally {
        if (browser) await browser.close();
    }
})();
