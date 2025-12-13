const videoId = 'jNQXAC9IVRw'; // Me at the zoo

async function testInvidious() {
    console.log(`Testing Invidious fetch for video: ${videoId}`);

    // List of instances to try
    const instances = [
        'https://inv.tux.pizza',
        'https://invidious.projectsegfau.lt',
        'https://invidious.jing.rocks',
        'https://vid.puffyan.us'
    ];

    for (const instance of instances) {
        try {
            console.log(`Trying instance: ${instance}`);
            // Invidious API: /api/v1/captions/{videoId}
            // Actually, usually it's /api/v1/videos/{videoId} and then we parse captions
            // Or /api/v1/captions/{videoId} might return a list

            // Let's try getting video info first
            const infoRes = await fetch(`${instance}/api/v1/videos/${videoId}`);
            if (!infoRes.ok) {
                console.log(`Failed to fetch video info from ${instance}: ${infoRes.status}`);
                continue;
            }

            const info = await infoRes.json();
            const captions = info.captions;

            if (captions && captions.length > 0) {
                console.log(`✅ Found ${captions.length} captions on ${instance}`);
                const enCaption = captions.find(c => c.label.startsWith('English') || c.language === 'en') || captions[0];

                console.log(`Fetching caption: ${enCaption.label} from ${instance}${enCaption.url}`);
                const captionRes = await fetch(`${instance}${enCaption.url}`);
                const captionText = await captionRes.text(); // Usually VTT format

                console.log('Caption Preview:', captionText.substring(0, 100));
                return;
            } else {
                console.log(`No captions found on ${instance}`);
            }

        } catch (e) {
            console.error(`Error with ${instance}:`, e.message);
        }
    }
}

testInvidious();
