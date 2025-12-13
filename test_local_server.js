import http from 'http';

const videoId = 'jNQXAC9IVRw'; // Me at the zoo
const options = {
    hostname: 'localhost',
    port: 5183,
    path: `/api/transcript?videoId=${videoId}`,
    method: 'GET',
};

console.log(`Testing Local API: http://localhost:5173${options.path}`);

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('BODY:', data.substring(0, 500)); // Preview first 500 chars
        try {
            const json = JSON.parse(data);
            if (json.transcript) {
                console.log('✅ SUCCESS: Transcript received!');
                console.log('Source:', json.source);
            } else {
                console.log('❌ FAILURE: No transcript in response.');
            }
        } catch (e) {
            console.log('❌ FAILURE: Could not parse JSON response.');
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ ERROR: problem with request: ${e.message}`);
    console.log('Hint: Is the dev server running on port 5173?');
});

req.end();
