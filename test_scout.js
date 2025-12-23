process.env.VITE_SUPABASE_URL = "https://ulwjlqmccxfmxieapopy.supabase.co";
process.env.VITE_SUPABASE_ANON_KEY = "sb_publishable_nCcf-klL6pTn9UueRR6TlQ_eMPbUsk8";

import handler from './api/scout/run.js';

const req = {
    method: 'POST',
    body: { channelUrl: 'https://www.youtube.com/@AlexHormozi' }
};

const res = {
    status: (code) => ({
        json: (data) => {
            console.log(`Status: ${code}`);
            console.log(JSON.stringify(data, null, 2));
        }
    })
};

console.log("Testing api/scout/run.js handler...");
handler(req, res);
