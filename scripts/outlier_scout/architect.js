import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env from root
dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const geminiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runArchitect() {
    console.log('🏗️  Starting Architect Engine...');

    if (!geminiKey) {
        console.warn('⚠️  GEMINI_API_KEY not found in .env. Smart analysis will be skipped.');
        console.warn('   Please add GEMINI_API_KEY to .env to enable the advanced Mental Model analysis.');
    }

    const genAI = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;
    const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.0-flash" }) : null;

    // 1. Clear existing blueprints first
    console.log('Clearing existing blueprints...');
    // Since ID is UUID, we can't compare to 0. We use a condition that is always true for existing rows.
    // Deleting where median_score is greater than -1 (assuming it's numeric) is a safe bet.
    const { error: deleteError } = await supabase
        .from('os_blueprints')
        .delete()
        .gt('median_score', -100);

    if (deleteError) {
        console.error('Error clearing blueprints:', deleteError);
    }

    // 2. Process in chunks
    const CHUNK_SIZE = 50; // Process 50 outliers at a time
    let processedCount = 0;
    let hasMore = true;
    let page = 0;

    while (hasMore) {
        console.log(`Fetching chunk ${page + 1}...`);
        const { data: outliers, error } = await supabase
            .from('os_outliers')
            .select('*')
            .range(page * CHUNK_SIZE, (page + 1) * CHUNK_SIZE - 1);

        if (error) {
            console.error('Error fetching outliers chunk:', error);
            break;
        }

        if (!outliers || outliers.length === 0) {
            hasMore = false;
            break;
        }

        console.log(`Processing ${outliers.length} outliers in this chunk...`);

        // Process this chunk in smaller AI batches
        const AI_BATCH_SIZE = 5;
        for (let i = 0; i < outliers.length; i += AI_BATCH_SIZE) {
            const batch = outliers.slice(i, i + AI_BATCH_SIZE);
            console.log(`Processing AI batch ${i / AI_BATCH_SIZE + 1} of ${Math.ceil(outliers.length / AI_BATCH_SIZE)} in chunk ${page + 1}...`);

            const batchResults = [];

            if (model) {
                try {
                    const prompt = `
                    You are an expert YouTube Packaging Architect. Your goal is to extract the "Mental Model" behind high-performing video titles.

                    CRITICAL INSTRUCTION: You must REPLACE specific words in the title with variables. Do NOT return the original title as the format.
                    
                    BAD FORMAT: "How I Made $1,000,000 in 30 Days" (No abstraction)
                    BAD FORMAT: "How I Made [Noun] in [Time]" (Generic grammar labels)
                    GOOD FORMAT: "How I Made [Desired Outcome] in [Short Timeframe]" (Psychological labels)

                    Part 1: Mental Model
                    A good title format is NOT a word swap. It is a structural abstraction of WHY the title works.
                    - Preserve the psychological mechanism, not surface wording.
                    - Separate fixed anchors (inevitability, authority) from swappable variables.
                    - Encode intent, not grammar.
                    - Be generative across topics without breaking logic.

                    Part 2: Extraction Rules
                    1. Identify the core mechanism (promise, tension, non-swappable parts).
                    2. Classify variables using FUNCTIONAL labels (e.g., [Desired Outcome], [Hidden Reality]), NEVER generic buckets like [Noun].
                    3. Preserve directional logic (Pain -> Payoff).
                    4. Handle special cases: Keep unsplittable tokens fixed (e.g., "I Asked Tony Robbins", "I'm 45").

                    Part 3: Variable Taxonomy (Use ONLY these or similar semantic labels)
                    - [Number] - A quantity (e.g., "1", "7", "10", "90%")
                    - [Practices/Doctrine] - A repeatable action or principle (e.g., "habit", "ritual", "rule", "principle", "system")
                    - [Positive Quantifiable Change] - A measurable improvement action (e.g., "fixes 90% of", "eliminates", "reduces by 80%", "heals")
                    - [Negative Attribute] - Something undesirable to fix (e.g., "problems", "insecurities", "procrastination", "overthinking")
                    - [Desired Outcome] - The end goal or result (e.g., "rich", "fit", "successful")
                    - [Undesired State] - A negative state to escape (e.g., "broke", "overweight", "stuck")
                    - [Starting Point] - A neutral beginning state, NOT negative (e.g., "from scratch", "from $0", "as a beginner")
                    - [Identity] - A role or persona (e.g., "CEO", "millionaire", "athlete")
                    - [Authority Figure] - Someone with credibility (e.g., "Tony Robbins", "an AI", "a doctor")
                    - [Common Method] - A typical approach (e.g., "medication", "exercise", "hard work")
                    - [Hidden Reality] - A surprising truth (e.g., "nobody is watching", "it's all fake")
                    - [Absurd Consequence] - An extreme result that sounds almost too good (e.g., "I questioned money", "I avoid people")
                    - [Descriptive Advantage/Adverb] - A quality modifier (e.g., "brilliantly", "effortlessly", "like a pro")
                    - [Negative Command] - An action to stop (e.g., "stop wasting", "quit doing")
                    - [Short Timeframe] - A compressed time period (e.g., "30 days", "54 seconds", "5 minutes")
                    - [Constraint] - A limitation or condition (e.g., "without money", "with no experience")
                    - [Skill/Task] - An action or ability (e.g., "speak", "cook", "code", "invest")
                    - [Resource] - A deliverable or asset (e.g., "course", "guide", "template", "recipe book")
                    - [Better Alternative] - An upgraded approach (e.g., "AI Operating Systems" vs "AI Agents")

                    IMPORTANT: "From Scratch", "From $0", "From Zero", "As a Beginner" are [Starting Point], NOT [Undesired State].
                    [Undesired State] implies something actively bad (broke, fat, depressed). [Starting Point] implies a neutral beginning.

                    CRITICAL FORMAT RULES - ABSOLUTELY NO DUPLICATE VARIABLES:
                    - NEVER put two identical variables back-to-back like [Var][Var] or [Number][Number]
                    - Each WORD or PHRASE in the title gets exactly ONE variable
                    - "1" = [Number] (just once, not [Number][Number])
                    - "90%" = [Number] or include it in a compound like [Positive Quantifiable Change] (e.g., "fixes 90% of")
                    - "Habit" = [Practices/Doctrine] (just once)
                    - Count your brackets - if you see two identical variables touching, YOU MADE A MISTAKE
                    
                    BAD FORMAT: "[Number][Number] Habit That Fixes [Extreme Improvement][Extreme Improvement] of Problems"
                    GOOD FORMAT: "[Number] [Practices/Doctrine] That [Positive Quantifiable Change] [Negative Attribute]"
                    
                    BAD FORMAT: "How To Speak [Descriptive Advantage][Descriptive Advantage] (Free [Resource][Resource])"
                    GOOD FORMAT: "How To [Skill/Task] [Descriptive Advantage/Adverb] (Free [Resource])"

                    CRITICAL: Formats must be BROAD enough to apply across many niches, not specific to original topic.
                    BAD FORMAT: "DON'T Sell [AI Product], Sell [Better AI Product] Instead" (too specific to AI)
                    GOOD FORMAT: "DON'T [Do Common Thing People Try], [Do Better Alternative] Instead" (works for any niche)

                    Part 4: Few-Shot Examples
                    Input: "1 Habit That Fixes 90% of Problems"
                    Output Format: "[Number] [Practices/Doctrine] That [Positive Quantifiable Change] [Negative Attribute]"
                    Generated Examples: "10 Rituals That Eliminate Procrastination", "5 Rules That Reduce Overthinking by 90%", "3 Herbs That Will Heal 80% of Injuries Faster"
                    
                    Input: "DON'T Sell AI Agents, Sell AI Operating Systems Instead"
                    Output Format: "DON'T [Do Common Thing People Try], [Do Better Alternative] Instead"
                    
                    Input: "How To Speak Brilliantly (Free Course)"
                    Output Format: "How To [Skill/Task] [Descriptive Advantage/Adverb] (Free [Resource])"
                    
                    Input: "Easiest Way To Start a Business From Scratch (Exactly What I Did)"
                    Output Format: "Easiest Way To Start [Skill/Business] [Starting Point] (Exactly What I Did)"
                    
                    Input: "Stop Wasting Your Life – 7 Things I Quit to Go From Broke to Millionaire"
                    Output Format: "Stop [Negative Common Action] – [Number] Things I [Quit/Started] to Go From [Undesired State] to [Desired Outcome]"
                    
                    Input: "Your Biggest Edge Is Nobody Is Watching You Fail"
                    Output Format: "Your Biggest [Descriptive Advantage] Is [Hidden Reality]"

                    Input: "I Asked an AI How to Go From Average to Exceptionally Rich"
                    Output Format: "I Asked [Authority Figure/System] How to Go From [Undesired State] to [Desired Outcome]"

                    Part 5: Generation Rules
                    - Never reuse the original topic (if business, generate fitness/relationships).
                    - Never reuse the same variable word twice.
                    - Preserve absurdity level.
                    - Generated examples MUST be grammatically correct and natural sounding.
                    - The format should work even if not followed 1:1 - the underlying principle should still apply.
                    
                    CRITICAL GRAMMAR RULES FOR GENERATED EXAMPLES:
                    - BAD: "Easiest Way To Start Meditating From Overwhelmed" (grammatically broken)
                    - GOOD: "Easiest Way To Start Meditating When You're Overwhelmed" or "Easiest Way To Start Meditating as a Beginner"
                    - BAD: "How I Made Fit in 30 Days" (missing article)
                    - GOOD: "How I Got Fit in 30 Days"
                    - The generated example must read like a real, publishable YouTube title that a native English speaker would write.

                    Input Titles:
                    ${batch.map((o, idx) => `${idx + 1}. ${o.title}`).join('\n')}

                    Return a JSON array of objects with these keys:
                    - index: (number) matching input index
                    - format: (string) The extracted format with [Variables]. MUST contain square brackets. NO duplicate variables.
                    - archetype: (string) One of the variable taxonomy labels that best describes the core hook
                    - generated_example: (string) A new title in a different niche that is GRAMMATICALLY CORRECT
                    `;

                    const result = await model.generateContent(prompt);
                    const response = result.response;
                    const text = response.text();

                    // Clean markdown code blocks if present
                    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
                    const analysis = JSON.parse(jsonStr);

                    // Map back to outlier data
                    analysis.forEach(item => {
                        const outlier = batch[item.index - 1];
                        if (outlier) {
                            batchResults.push({
                                pattern: item.format,
                                archetype: item.archetype,
                                median_score: outlier.outlier_score,
                                median_views: outlier.views,
                                count: 1, // Individual entry
                                example1: outlier.title, // Original Title
                                thumbnail1: outlier.thumbnail,
                                generated_example: item.generated_example
                            });
                        }
                    });

                } catch (e) {
                    console.error('Error processing batch with AI:', e);
                    // Fallback to raw data on error
                    batch.forEach(o => {
                        batchResults.push({
                            pattern: o.title, // Fallback
                            archetype: 'Unclassified',
                            median_score: o.outlier_score,
                            median_views: o.views,
                            count: 1,
                            example1: o.title,
                            thumbnail1: o.thumbnail,
                            generated_example: 'AI Analysis Failed'
                        });
                    });
                }
            } else {
                // No AI, just pass through
                batch.forEach(o => {
                    batchResults.push({
                        pattern: o.title,
                        archetype: 'Unclassified',
                        median_score: o.outlier_score,
                        median_views: o.views,
                        count: 1,
                        example1: o.title,
                        thumbnail1: o.thumbnail,
                        generated_example: 'Add GEMINI_API_KEY for AI Analysis'
                    });
                });
            }

            // Insert batch
            if (batchResults.length > 0) {
                const { error: insertError } = await supabase
                    .from('os_blueprints')
                    .upsert(batchResults, { onConflict: 'pattern' });

                if (insertError) {
                    console.error('Error inserting blueprints:', insertError);
                }
            }

            // Rate limit pause
            if (model) await new Promise(resolve => setTimeout(resolve, 1000));
        }

        page++;
        processedCount += outliers.length;
    }

    console.log('✅ Architect run complete.');
}

runArchitect();
