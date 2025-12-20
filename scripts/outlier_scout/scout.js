import { initBrowser } from './lib/browser.js';
import { humanScroll, randomDelay } from './lib/navigation.js';
import { waitForOutliers, extractOutliers } from './lib/parser.js';
import { processAssets } from './lib/assets.js';
import { expandScouting } from './lib/discovery.js';
import fs from 'fs-extra';
import path from 'path';

// CONFIGURATION
// User should update this path to their local extension path
const EXTENSION_PATH = process.env.EXTENSION_PATH || 'C:\\Users\\iyoha\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 67\\Extensions\\gkfdnmclhbgbidnpmimfdobgjpeblckn\\2.10_0';
const API_URL = process.env.API_URL || 'http://localhost:3000/api/scout/save';

// Check for command line argument
let targetUrl = process.argv[2];

if (targetUrl) {
    // Normalize URL
    if (targetUrl.endsWith('/')) {
        targetUrl = targetUrl.slice(0, -1);
    }
    const parts = targetUrl.split('/');
    const lastPart = parts[parts.length - 1];

    if (lastPart === 'videos') {
        // Good
    } else if (['shorts', 'streams', 'playlists', 'community'].includes(lastPart)) {
        parts[parts.length - 1] = 'videos';
        targetUrl = parts.join('/');
    } else {
        targetUrl += '/videos';
    }
    console.log(`Target URL normalized to: ${targetUrl}`);
}

const SEED_CHANNELS = targetUrl ? [targetUrl] : [
    'https://www.youtube.com/@AlexHormozi/videos',
    // ... (rest of the list can be added if needed, keeping it short for now)
];

async function processChannel(page, url) {
    console.log(`\n📺 Processing Channel: ${url}`);
    try {
        await page.goto(url, { waitUntil: 'networkidle' });
        await humanScroll(page, 1000);

        const outliers = await extractOutliers(page);
        console.log(`Found ${outliers.length} outliers.`);

        if (outliers.length > 0) {
            await processAssets(outliers);

            // Send to API
            try {
                // Use fetch (Node 18+)
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        outliers: outliers,
                        channelUrl: url
                    })
                });

                if (response.ok) {
                    console.log(`✅ Saved ${outliers.length} outliers to Database.`);
                } else {
                    console.error('❌ Failed to save to Database:', await response.text());
                }
            } catch (err) {
                console.error('❌ API Error:', err.message);
            }
        }
    } catch (e) {
        console.error(`Error processing ${url}:`, e.message);
    }
}

async function run() {
    console.log('🚀 Starting Scout Engine...');
    console.log(`API URL: ${API_URL}`);

    let browser;
    try {
        browser = await initBrowser(EXTENSION_PATH);
        const { page } = browser;

        console.log('--- Phase 1: Seed List Processing ---');
        for (const channelUrl of SEED_CHANNELS) {
            await processChannel(page, channelUrl);
        }

        if (!targetUrl) {
            console.log('\n--- Phase 2: Expansion Scouting ---');
            await expandScouting(page, SEED_CHANNELS);
        }

    } catch (error) {
        console.error('🔥 Fatal Error:', error);
    } finally {
        if (browser) {
            console.log('Closing browser...');
            await browser.context.close();
        }
    }
}

run();
