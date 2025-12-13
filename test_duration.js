import { YoutubeTranscript } from 'youtube-transcript';

const videoId = 'M7lc1UVf-VE'; // YouTube Developers

try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    if (transcript.length > 0) {
        const lastItem = transcript[transcript.length - 1];
        console.log('Last Item:', lastItem);
        console.log('Calculated Duration (sec):', lastItem.offset + lastItem.duration);
    }
} catch (error) {
    console.error('Error:', error);
}
