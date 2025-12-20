export async function randomDelay(min = 1500, max = 4500) {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    return new Promise(resolve => setTimeout(resolve, delay));
}

export async function humanScroll(page, targetCount = 150) {
    console.log('Starting human-like scrolling...');
    let currentCount = 0;
    let noNewVideosCount = 0;

    while (currentCount < targetCount) {
        // Scroll down
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.8));
        await randomDelay(1000, 2500);

        // Occasional scroll up (10% chance)
        if (Math.random() < 0.1) {
            await page.evaluate(() => window.scrollBy(0, -window.innerHeight * 0.5));
            await randomDelay(500, 1500);
        }

        // Check video count (approximate by selecting video elements)
        const newCount = await page.locator('ytd-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer').count();

        if (newCount === currentCount) {
            noNewVideosCount++;
            if (noNewVideosCount > 5) {
                console.log('No new videos loaded for 5 scrolls. Stopping.');
                break;
            }
        } else {
            noNewVideosCount = 0;
            currentCount = newCount;
            console.log(`Loaded ~${currentCount} videos...`);
        }
    }
}
