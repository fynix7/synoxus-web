import { YoutubeTranscript } from 'youtube-transcript';

const videoId = 'jNQXAC9IVRw'; // Me at the zoo (classic test video)

console.log(`Testing transcript fetch for ${videoId}...`);

try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    console.log('Success!');
    console.log(transcript.slice(0, 3));
} catch (error) {
    console.error('Failed:', error);
}
