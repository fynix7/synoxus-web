const INVIDIOUS_INSTANCES = [
    'https://inv.tux.pizza',
    'https://invidious.flokinet.to',
    'https://invidious.privacydev.net',
    'https://vid.puffyan.us',
    'https://invidious.kavin.rocks',
    'https://invidious.namazso.eu',
    'https://inv.riverside.rocks',
];

async function resolveHandle(handle) {
    const query = handle.replace('@', '');
    for (const instance of INVIDIOUS_INSTANCES) {
        try {
            console.log(`Searching for handle ${handle} on ${instance}...`);
            const response = await fetch(`${instance}/api/v1/search?q=${query}&type=channel`);
            if (response.ok) {
                const results = await response.json();
                if (results.length > 0) {
                    console.log(`Found channel: ${results[0].author} (${results[0].authorId})`);
                    return results[0].authorId;
                }
            }
        } catch (error) {
            console.log(`Error searching on ${instance}: ${error.message}`);
        }
    }
    return null;
}

async function fetchChannelVideos(channelId) {
    for (const instance of INVIDIOUS_INSTANCES) {
        try {
            console.log(`Fetching videos from ${instance}...`);
            const response = await fetch(`${instance}/api/v1/channels/${channelId}/videos`);
            if (response.ok) {
                const videos = await response.json();
                console.log(`Success! Found ${videos.length} videos.`);
                if (videos.length > 0) {
                    const v = videos[0];
                    console.log('Sample Video Data:', {
                        title: v.title,
                        videoId: v.videoId,
                        lengthSeconds: v.lengthSeconds,
                        videoThumbnails: v.videoThumbnails ? 'Present' : 'Missing'
                    });
                }
                return videos;
            } else {
                console.log(`Failed on ${instance}: ${response.status}`);
            }
        } catch (error) {
            console.log(`Error on ${instance}: ${error.message}`);
        }
    }
    console.error('All instances failed.');
    return null;
}

// Test Flow
(async () => {
    console.log('--- Testing Handle Resolution ---');
    const handle = '@MrBeast';
    const channelId = await resolveHandle(handle);

    if (channelId) {
        console.log(`\n--- Testing Video Fetch for ${channelId} ---`);
        await fetchChannelVideos(channelId);
    } else {
        console.log('Could not resolve handle.');
    }
})();
