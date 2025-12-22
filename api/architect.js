import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { apiKey } = req.body;

    if (!apiKey) {
        return res.status(400).json({ error: 'API key is required', success: false });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Missing Supabase credentials', success: false });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // STEP 0: Fetch existing blueprints to preserve generated concepts
        const { data: existingBlueprints } = await supabase
            .from('os_blueprints')
            .select('pattern, generated_example');

        const conceptCache = new Map();
        if (existingBlueprints) {
            existingBlueprints.forEach(bp => {
                if (bp.pattern && bp.generated_example) {
                    conceptCache.set(bp.pattern, bp.generated_example);
                }
            });
        }

        // Clear existing blueprints
        const { error: deleteError } = await supabase
            .from('os_blueprints')
            .delete()
            .gt('median_score', -100);

        if (deleteError) {
            console.error('Error clearing blueprints:', deleteError);
        }

        // STEP 1: Fetch ALL outliers
        let allOutliers = [];
        let hasMore = true;
        let page = 0;
        const CHUNK_SIZE = 100;

        while (hasMore) {
            const { data: outliers, error } = await supabase
                .from('os_outliers')
                .select('*')
                .order('outlier_score', { ascending: false })
                .range(page * CHUNK_SIZE, (page + 1) * CHUNK_SIZE - 1);

            if (error) {
                console.error('Error fetching outliers chunk:', error);
                break;
            }

            if (!outliers || outliers.length === 0) {
                hasMore = false;
            } else {
                allOutliers = [...allOutliers, ...outliers];
                page++;
                // Limit to prevent timeout - process max 300 outliers
                if (page >= 3) hasMore = false;
            }
        }

        if (allOutliers.length === 0) {
            return res.status(200).json({
                success: true,
                processed: 0,
                message: 'No outliers found to process.'
            });
        }

        // STEP 2: Extract title formats for ALL outliers in batches
        const AI_BATCH_SIZE = 10;
        const allFormats = []; // {format, archetype, outlier}

        for (let i = 0; i < allOutliers.length; i += AI_BATCH_SIZE) {
            const batch = allOutliers.slice(i, i + AI_BATCH_SIZE);

            try {
                const extractPrompt = `
                You are an expert YouTube Packaging Architect. Extract the structural title format from each video title.

                CRITICAL INSTRUCTION: Replace specific words with semantic variables. Do NOT return the original title.
                
                Variable Taxonomy (use ONLY these or similar semantic labels):
                - [Number] - A quantity
                - [Practices/Doctrine] - A repeatable action or principle
                - [Positive Quantifiable Change] - A measurable improvement
                - [Negative Attribute] - Something undesirable to fix
                - [Desired Outcome] - The end goal or result
                - [Undesired State] - A negative state to escape
                - [Starting Point] - A neutral beginning state
                - [Identity] - A role or persona
                - [Authority Figure] - Someone with credibility
                - [Common Method] - A typical approach
                - [Hidden Reality] - A surprising truth
                - [Absurd Consequence] - An extreme result
                - [Descriptive Advantage/Adverb] - A quality modifier
                - [Negative Command] - An action to stop
                - [Short Timeframe] - A compressed time period
                - [Constraint] - A limitation or condition
                - [Skill/Task] - An action or ability
                - [Resource] - A deliverable or asset
                - [Better Alternative] - An upgraded approach
                - [Topic/Subject] - The main topic being discussed
                - [Action/Verb] - An action word

                EXAMPLES:
                Input: "1 Habit That Fixes 90% of Problems"
                Output: "[Number] [Practices/Doctrine] That [Positive Quantifiable Change] [Negative Attribute]"
                
                Input: "How I Made $1,000,000 in 30 Days"
                Output: "How I Made [Desired Outcome] in [Short Timeframe]"
                
                Input: "I Asked an AI How to Get Rich"
                Output: "I Asked [Authority Figure] How to [Desired Outcome]"

                Input Titles:
                ${batch.map((o, idx) => `${idx + 1}. ${o.title}`).join('\n')}

                Return a JSON array with objects containing:
                - index: (number) matching input index (1-based)
                - format: (string) The extracted format with [Variables]
                - archetype: (string) The primary variable type that drives the hook
                `;

                const result = await model.generateContent(extractPrompt);
                const text = result.response.text();
                const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const analysis = JSON.parse(jsonStr);

                analysis.forEach(item => {
                    const outlier = batch[item.index - 1];
                    if (outlier) {
                        allFormats.push({
                            format: item.format,
                            archetype: item.archetype,
                            outlier: outlier
                        });
                    }
                });

            } catch (e) {
                console.error('Error extracting formats for batch:', e.message);
                // Fallback - add raw titles
                batch.forEach(o => {
                    allFormats.push({
                        format: o.title,
                        archetype: 'Unclassified',
                        outlier: o
                    });
                });
            }

            // Rate limit pause
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // STEP 3: Group similar formats using AI
        const formatList = allFormats.map((f, i) => `${i + 1}. "${f.format}"`).join('\n');

        let groupedFormats = [];
        try {
            const groupPrompt = `
            You are analyzing YouTube title formats to find patterns. Below are ${allFormats.length} title formats extracted from high-performing videos.

            YOUR TASK: Group these formats by similarity. Formats are "similar" if they share the same structural pattern, even if specific variables differ slightly.

            EXAMPLES OF SIMILAR FORMATS:
            - "[Number] [Practices/Doctrine] That [Positive Change] [Negative Attribute]" ≈ "[Number] [Habit] That [Fixes] [Problems]"
            - "How I [Achieved] [Desired Outcome] in [Timeframe]" ≈ "How I Made [Money] in [Short Time]"
            - "Why [Authority] [Does Something] (And You Should Too)" ≈ "Why [Experts] [Use This Method] (And You Should Too)"

            EXAMPLES OF DIFFERENT FORMATS (should NOT be grouped):
            - "[Number] [Practices/Doctrine] That..." vs "How I [Achieved]..." (different structure)
            - "I Asked [Authority]..." vs "[Number] Things..." (different hook mechanism)

            FORMATS TO ANALYZE:
            ${formatList}

            Return a JSON array where each object represents a GROUP of similar formats:
            {
                "canonical_format": "The best/most general version of this format pattern",
                "archetype": "The primary hook mechanism (e.g., 'Number', 'Authority', 'How-To')",
                "member_indices": [1, 5, 12, ...] // 1-based indices of formats that belong to this group
            }

            RULES:
            1. Each format should belong to exactly ONE group
            2. If a format is unique, it should be in its own group with just that one index
            3. Focus on structural similarity, not topic similarity
            4. Aim for meaningful groups of 2+ where possible, but don't force dissimilar formats together
            5. Return at least the top 30 most common/interesting groups, ordered by group size (largest first)
            `;

            const groupResult = await model.generateContent(groupPrompt);
            const groupText = groupResult.response.text();
            const groupJsonStr = groupText.replace(/```json/g, '').replace(/```/g, '').trim();
            groupedFormats = JSON.parse(groupJsonStr);

        } catch (e) {
            console.error('Error grouping formats:', e.message);
            // Fallback: each format is its own group
            groupedFormats = allFormats.map((f, i) => ({
                canonical_format: f.format,
                archetype: f.archetype,
                member_indices: [i + 1]
            }));
        }

        // STEP 4: Generate concepts and build final blueprints
        const blueprints = [];

        for (const group of groupedFormats.slice(0, 50)) { // Limit to top 50 groups
            const members = group.member_indices
                .map(idx => allFormats[idx - 1])
                .filter(Boolean);

            if (members.length === 0) continue;

            // Calculate aggregate stats
            const totalScore = members.reduce((sum, m) => sum + (m.outlier.outlier_score || 0), 0);
            const totalViews = members.reduce((sum, m) => sum + (m.outlier.views || 0), 0);
            const medianScore = totalScore / members.length;
            const medianViews = totalViews / members.length;

            // Build examples array (up to 6 examples)
            const examples = members.slice(0, 6).map(m => ({
                title: m.outlier.title,
                thumbnail: m.outlier.thumbnail,
                video_id: m.outlier.video_id,
                views: m.outlier.views,
                score: m.outlier.outlier_score
            }));

            // Generate a concept for this pattern
            let generatedExample = '';

            // Check cache first
            if (conceptCache.has(group.canonical_format)) {
                generatedExample = conceptCache.get(group.canonical_format);
                console.log(`Using cached concept for: ${group.canonical_format}`);
            } else {
                try {
                    const conceptPrompt = `
                    Given this YouTube title format: "${group.canonical_format}"

                    Original examples using this format:
                    ${examples.slice(0, 3).map(e => `- "${e.title}"`).join('\n')}

                    Generate ONE new video title idea using this format in a DIFFERENT niche than the examples.
                    The generated title must:
                    1. Follow the format structure exactly
                    2. Be grammatically correct and natural-sounding
                    3. Be in a completely different topic/niche than the originals
                    4. Sound like a real, clickable YouTube title

                    Return ONLY the generated title, nothing else.
                    `;

                    const conceptResult = await model.generateContent(conceptPrompt);
                    generatedExample = conceptResult.response.text().trim().replace(/"/g, '');
                } catch (e) {
                    generatedExample = 'Concept generation failed';
                }
            }

            blueprints.push({
                pattern: group.canonical_format,
                archetype: group.archetype,
                median_score: parseFloat(medianScore.toFixed(2)),
                median_views: Math.round(medianViews),
                count: members.length,
                example1: examples[0]?.title || '',
                thumbnail1: examples[0]?.thumbnail || '',
                examples: JSON.stringify(examples), // Store all examples as JSON
                generated_example: generatedExample
            });

            // Small delay between concept generations
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // STEP 5: Insert all blueprints
        if (blueprints.length > 0) {
            const { error: insertError } = await supabase
                .from('os_blueprints')
                .insert(blueprints);

            if (insertError) {
                console.error('Error inserting blueprints:', insertError);
            }
        }

        return res.status(200).json({
            success: true,
            processed: allOutliers.length,
            blueprints: blueprints.length,
            message: `Analyzed ${allOutliers.length} outliers, created ${blueprints.length} grouped patterns.`
        });

    } catch (error) {
        console.error('Architect error:', error);
        return res.status(500).json({
            error: error.message || 'Unknown error',
            success: false
        });
    }
}
