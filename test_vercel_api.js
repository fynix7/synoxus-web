import handler from './api/transcript.js';

const req = {
    query: { videoId: 'jliSs986bs8' }
};

const res = {
    status: (code) => ({
        json: (data) => {
            console.log(`Status: ${code}`);
            if (data.transcript) {
                console.log(`Transcript found! Length: ${data.transcript.length}`);
                console.log(`Snippet: ${data.transcript.substring(0, 100)}...`);
            } else {
                console.log(`Error:`, data);
            }
        }
    })
};

console.log("Testing api/transcript.js handler...");
handler(req, res);
