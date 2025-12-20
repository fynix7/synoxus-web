import { chromium } from 'playwright';
import path from 'path';

export async function initBrowser(extensionPath) {
    const userDataDir = path.join(process.cwd(), 'user_data');

    // Launch persistent context to keep extension state
    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false, // Must be false for extension to load properly
        args: [
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled', // Try to hide automation
            '--start-maximized' // Open maximized
        ],
        viewport: null // Use window size
    });

    const page = await context.newPage();

    // Set user agent to look like a real browser
    await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    return { context, page };
}
