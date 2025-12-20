import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const geminiKey = process.env.GEMINI_API_KEY;

if (!geminiKey) {
    console.error('❌ Missing GEMINI_API_KEY');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(geminiKey);

async function listModels() {
    try {
        // For some reason the node SDK might not expose listModels directly on genAI instance in all versions?
        // Actually it should be on the GoogleGenerativeAI instance or we can try a simple generation to test.

        // Let's try to get a model and see if it works, or if we can list them.
        // The error message suggests calling ListModels.

        // Note: The Node.js SDK doesn't always have a direct listModels method exposed in the main class in older versions,
        // but let's try to use the model manager if available.

        // Actually, let's just try the most standard model name "gemini-pro" again but with a simple prompt to verify.
        // And also try "gemini-1.5-flash" (no suffix).

        const modelsToTest = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-pro",
            "gemini-1.0-pro"
        ];

        console.log("Testing models...");

        for (const modelName of modelsToTest) {
            console.log(`\nTesting ${modelName}...`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Say hello");
                const response = await result.response;
                console.log(`✅ ${modelName} SUCCESS:`, response.text());
                return; // Found one!
            } catch (e) {
                console.log(`❌ ${modelName} FAILED:`, e.message.split('\n')[0]);
            }
        }

    } catch (e) {
        console.error('Fatal error:', e);
    }
}

listModels();
