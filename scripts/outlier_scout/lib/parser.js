export async function waitForOutliers(page) {
    console.log('Waiting for 1of10 outlier badges...');
    // This selector might need adjustment based on the actual extension DOM
    try {
        await page.waitForSelector('.ytbthumb-badge', { timeout: 10000 });
        console.log('Outlier badges detected.');
    } catch (e) {
        console.warn('Timeout waiting for outlier badges. They might not be rendered yet or selector is wrong.');
    }
}

export async function extractOutliers(page) {
    console.log('Extracting outlier data...');

    const videos = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('ytd-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer'));

        // Helper function to parse views
        const parseViews = (viewsText) => {
            let views = 0;
            const num = parseFloat(viewsText.replace(/[^0-9.]/g, ''));
            const multiplier = viewsText.toUpperCase().includes('M') ? 1000000 :
                viewsText.toUpperCase().includes('K') ? 1000 : 1;
            if (!isNaN(num)) views = num * multiplier;
            return views;
        };

        return items.map(item => {
            const titleEl = item.querySelector('#video-title');
            const linkEl = item.querySelector('a#thumbnail');
            const scoreEl = item.querySelector('.ytbthumb-badge');
            const imgEl = item.querySelector('img');

            // Views extraction
            const metaLine = item.querySelectorAll('#metadata-line span');
            let viewsText = '0';
            if (metaLine.length > 0) {
                viewsText = metaLine[0].innerText;
                if (viewsText.includes('ago')) {
                    viewsText = metaLine[1] ? metaLine[1].innerText : '0';
                }
            }

            if (!titleEl || !linkEl) return null;

            const scoreText = scoreEl ? scoreEl.innerText : '0';
            const id = linkEl.href.split('v=')[1]?.split('&')[0];

            return {
                video_id: id,
                video_title: titleEl.textContent.trim(),
                outlier_score: parseFloat(scoreText),
                views: parseViews(viewsText),
                local_webp_path: '', // Will be filled by assets.js
                original_url: linkEl.href,
                thumbnail_url: imgEl ? imgEl.src : '',
                channel_name: document.querySelector('#channel-name')?.textContent?.trim() || 'Unknown'
            };
        }).filter(v => v && v.outlier_score >= 1.5);
    });

    // Post-process to add channel name if we are on a channel page
    const channelName = await page.evaluate(() => {
        const selectors = [
            '#channel-name #text',
            '#channel-handle',
            'ytd-channel-name #text',
            '#owner-name a'
        ];
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText.trim()) return el.innerText.trim();
        }
        return 'Unknown';
    });

    return videos.map(v => ({ ...v, channel_name: channelName }));
}
