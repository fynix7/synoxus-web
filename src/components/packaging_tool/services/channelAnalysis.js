// Cache for channel analysis to avoid redundant API calls
const channelAnalysisCache = new Map();

export const analyzeChannelOutliers = async (channelUrl, topic) => {
    const apiKey = localStorage.getItem('google_api_key');
    if (!apiKey) {
        throw new Error('API_KEY_MISSING');
    }

    try {
        // Extract channel ID or handle from URL
        const channelMatch = channelUrl.match(/youtube\.com\/@([^\/\?]+)|youtube\.com\/channel\/([^\/\?]+)/);
        if (!channelMatch) {
            throw new Error('Invalid YouTube channel URL');
        }

        const channelHandle = channelMatch[1] || channelMatch[2];
        const cacheKey = `${channelHandle}_${topic}`;

        // Check cache first
        if (channelAnalysisCache.has(cacheKey)) {
            console.log('Using cached channel analysis for:', channelHandle);
            return channelAnalysisCache.get(cacheKey);
        }

        // Use Gemini to analyze the channel and extract outlier patterns
        const analysisPrompt = `You are analyzing a YouTube channel to identify high-performing "outlier" video styles.

Channel: ${channelHandle}
Topic Context: ${topic}

TASK:
1. Based on the channel handle, identify the typical visual and title patterns of their HIGHEST VIEW videos
2. Analyze what makes these videos outliers (10x+ above channel average views)
3. Extract specific visual DNA elements

Return a JSON object with this structure:
{
    "outlierMultiplier": <number between 10-20>,
    "titleFormat": "<extracted title pattern with [PLACEHOLDERS]>",
    "formatDNA": {
        "blueprint": "<detailed visual description>",
        "focus": "<core psychological trigger>",
        "elements": ["<element1>", "<element2>", "<element3>"]
    },
    "insights": "<brief explanation of why this format works>"
}

Focus on:
- Thumbnail composition (text placement, subject positioning, colors)
- Title structure (power words, number patterns, emotional triggers)
- Visual consistency across top videos
- Brand-specific elements (logos, color schemes, fonts)

Return ONLY valid JSON, no markdown formatting.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: analysisPrompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    responseMimeType: "application/json"
                }
            })
        });

        const data = await response.json();
        const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!analysisText) {
            throw new Error('Failed to get channel analysis');
        }

        // Parse the JSON response
        const analysis = JSON.parse(analysisText);

        const result = {
            id: `channel_${channelHandle}_${Date.now()}`,
            outlierMultiplier: analysis.outlierMultiplier || 12.0,
            titleFormat: analysis.titleFormat,
            channel: channelHandle,
            referenceVideo: {
                title: "Channel Outlier Pattern",
                thumbnailUrl: "https://via.placeholder.com/120x68/222/00e676?text=CHANNEL"
            },
            formatDNA: analysis.formatDNA,
            insights: analysis.insights
        };

        // Cache the result
        channelAnalysisCache.set(cacheKey, result);

        return result;

    } catch (error) {
        console.error("Channel Analysis Error:", error);
        // Return a fallback generic format
        return {
            id: `fallback_${Date.now()}`,
            outlierMultiplier: 12.0,
            titleFormat: "How to [ACTION] [RESULT] (Step-by-Step)",
            channel: "Generic",
            referenceVideo: {
                title: "Generic Tutorial Format",
                thumbnailUrl: "https://via.placeholder.com/120x68/222/00e676?text=GENERIC"
            },
            formatDNA: {
                blueprint: "Clean composition with subject pointing at text or diagram",
                focus: "Educational, step-by-step guidance",
                elements: ["Clear Text", "Subject Pointing", "Professional Setting"]
            }
        };
    }
};
