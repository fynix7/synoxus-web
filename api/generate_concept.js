import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { apiKey, pattern, examples, blueprintId } = req.body;

    if (!apiKey) {
        return res.status(400).json({ error: 'API key is required' });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const conceptPrompt = `
        Given this YouTube title format: "${pattern}"

        Original examples using this format:
        ${examples.map(e => `- "${e.title}"`).join('\n')}

        Generate ONE new video title idea using this format in a DIFFERENT niche than the examples.
        The generated title must:
        1. Follow the format structure exactly
        2. Be grammatically correct and natural-sounding
        3. Be in a completely different topic/niche than the originals
        4. Sound like a real, clickable YouTube title

        Return ONLY the generated title, nothing else.
        `;

        const result = await model.generateContent(conceptPrompt);
        const generatedExample = result.response.text().trim().replace(/"/g, '');

        // Save to DB if ID provided
        if (blueprintId) {
            const supabaseUrl = process.env.VITE_SUPABASE_URL;
            const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
            if (supabaseUrl && supabaseKey) {
                const supabase = createClient(supabaseUrl, supabaseKey);
                await supabase
                    .from('os_blueprints')
                    .update({ generated_example: generatedExample })
                    .eq('id', blueprintId);
            }
        }

        return res.status(200).json({ success: true, concept: generatedExample });

    } catch (error) {
        console.error('Concept generation error:', error);
        return res.status(500).json({ error: error.message });
    }
}
