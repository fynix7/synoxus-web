import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const geminiKey = process.env.GEMINI_API_KEY;

if (!geminiKey) {
    console.error('❌ Missing GEMINI_API_KEY');
    process.exit(1);
}

// Manually fetch models list using fetch since SDK might be obscuring it or using a default version
async function fetchModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Available Models:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error fetching models:", e);
    }
}

fetchModels();
