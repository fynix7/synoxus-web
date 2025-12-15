import { feedbackStore } from './feedbackStore';

export const generateThumbnail = async (params) => {
    const apiKey = localStorage.getItem('google_api_key')?.trim();
    let modelId = localStorage.getItem('google_model_id');

    // Default to what the user requested if not set, but ensure it has the prefix
    if (!modelId) modelId = 'models/gemini-3-pro-image-preview';

    // Auto-fix legacy/invalid model ID
    if (modelId === 'nano-banana-pro' || modelId === 'models/nano-banana-pro') {
        modelId = 'models/gemini-3-pro-image-preview';
        localStorage.setItem('google_model_id', modelId);
    }
    if (modelId === 'gemini-1.5-flash-001' || modelId === 'models/gemini-1.5-flash-001') {
        modelId = 'models/gemini-1.5-flash';
        localStorage.setItem('google_model_id', modelId);
    }

    // Handle case where user might just type "nano-banana-pro" without prefix
    if (!modelId.includes('/') && !modelId.startsWith('models/') && !modelId.startsWith('tunedModels/')) {
        modelId = `models/${modelId}`;
    }

    const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/${modelId}:generateContent`;

    if (!apiKey) {
        throw new Error('API_KEY_MISSING');
    }

    const { topic, instructions, brandColors, activeCharacters, characterName, refThumbs, baseImage, maskImage, variationCount = 1, refinementContext } = params;

    // SECURITY & TRANSPARENCY LOG: Explicitly list all image sources
    console.group("🔒 GENERATION SECURITY AUDIT");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Active Characters (User Selected/Mentioned):", activeCharacters?.map(c => c.name) || "None");
    console.log("Reference Thumbnails (User Uploaded/Pasted):", refThumbs?.length || 0);
    console.log("Base Image Source:", baseImage ? "User Provided" : "None");
    console.log("Mask Image Source:", maskImage ? "User Drawn" : "None");
    console.groupEnd();

    let userPrompt = "";
    let parts = [];

    // Helper to process image (URL or Base64) and get mimeType + data
    const processImage = async (input) => {
        if (!input) return null;
        try {
            if (input.startsWith('data:')) {
                const matches = input.match(/^data:(.*?);base64,(.*)$/);
                if (matches) {
                    const mimeType = matches[1];
                    const data = matches[2];

                    // Convert AVIF to JPEG (Gemini doesn't support AVIF)
                    if (mimeType === 'image/avif') {
                        const blob = await fetch(input).then(r => r.blob());
                        const convertedData = await convertToJpeg(blob);
                        return { mimeType: 'image/jpeg', data: convertedData };
                    }

                    return { mimeType, data };
                }
                return { mimeType: 'image/jpeg', data: input.split(',')[1] };
            }
            const response = await fetch(input);
            const blob = await response.blob();

            // Convert AVIF to JPEG
            if (blob.type === 'image/avif') {
                const convertedData = await convertToJpeg(blob);
                return { mimeType: 'image/jpeg', data: convertedData };
            }

            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve({
                    data: reader.result.split(',')[1],
                    mimeType: blob.type || 'image/jpeg'
                });
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error("Image processing failed", e);
            return null;
        }
    };

    // Helper to convert AVIF/unsupported formats to JPEG
    const convertToJpeg = async (blob) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(blob);

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // Convert to JPEG base64
                const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95);
                const base64Data = jpegDataUrl.split(',')[1];

                URL.revokeObjectURL(url);
                resolve(base64Data);
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to convert image'));
            };

            img.src = url;
        });
    };

    // CANVAS EDITOR LOGIC ENGINE PROTOCOL
    if (maskImage && baseImage) {
        // Step 1: Prompt Refinement
        const detectEditMode = (text) => {
            const lower = text.toLowerCase();
            if (lower.includes('remove') || lower.includes('delete') || lower.includes('erase') || lower.includes('clean') || lower.includes('gone')) {
                return 'remove';
            }
            return 'insert';
        };

        const editMode = detectEditMode(instructions);

        let refinedPrompt = instructions;
        if (editMode === 'remove') {
            refinedPrompt = "Seamlessly fill with background texture, remove object.";
        } else {
            refinedPrompt = `${instructions}, high fidelity, photorealistic, lighting match.`;
        }

        // Step 2: Tool Execution (Simulated via System Prompt)
        userPrompt = `ROLE: You are an EXPERT Image Inpainting Engine with pixel-perfect mask adherence.

YOUR CRITICAL TASK: Edit ONLY the masked region while keeping everything else COMPLETELY UNCHANGED.

═══════════════════════════════════════════════════════════════════════

📋 INPUT DATA:
   • Base Image: The original, unedited image
   • Mask Image: Binary mask (WHITE pixels = edit zone, BLACK pixels = FORBIDDEN ZONE)
   • User Instruction: "${refinedPrompt}"
   • Edit Mode: ${editMode}

═══════════════════════════════════════════════════════════════════════

⚠️ CRITICAL RULES - VIOLATING THESE WILL CAUSE TOTAL FAILURE:

1. SACRED BOUNDARY LAW:
   - The WHITE pixels in the mask define the ONLY area you may modify
   - BLACK pixels are ABSOLUTELY PROTECTED - they must remain pixel-perfect identical
   - Think of black areas as "locked layers" in Photoshop - UNTOUCHABLE
   - The mask boundary is a HARD EDGE - you cannot blend or feather into protected areas

2. MASK INTERPRETATION:
   - WHITE (255,255,255) = "Edit this pixel"
   - BLACK (0,0,0) = "DO NOT TOUCH THIS PIXEL UNDER ANY CIRCUMSTANCES"
   - This is a BINARY mask - there are NO gray values, only on/off

3. PRESERVATION REQUIREMENTS:
   - ALL elements outside the white mask MUST remain completely unchanged
   - Background? PRESERVE IT if it's in the black area
   - Foreground objects? PRESERVE THEM if they're in the black area
   - Text? PRESERVE IT if it's in the black area
   - Colors? PRESERVE THEM if they're in the black area
   - DO NOT remove, modify, or alter ANYTHING in the black-masked areas

4. EDIT MODE EXECUTION:
   ${editMode === 'remove'
                ? `   - MODE: REMOVAL/INPAINTING
      - Task: Fill the WHITE mask area with contextually appropriate background
      - The background fill should seamlessly blend with the EDGES of the white mask
      - Study the surrounding pixels (at the mask boundary) to understand the background pattern
      - DO NOT remove or alter anything outside the white mask area`
                : `   - MODE: INSERT/GENERATE
      - Task: Generate "${refinedPrompt}" ONLY within the WHITE mask area
      - The new content must blend seamlessly at the mask edges
      - Match lighting, perspective, and style of the base image
      - DO NOT extend the new content beyond the white mask boundaries`}

5. QUALITY REQUIREMENTS:
   - Output resolution MUST match input resolution exactly
   - Aspect ratio MUST be preserved exactly
   - Color space and bit depth must match the original
   - The edit should be photorealistic and seamless at mask boundaries
   - NO visible seams, halos, or artifacts at the mask edge

═══════════════════════════════════════════════════════════════════════

🎯 EXECUTION CHECKLIST:
   ✓ Identify the WHITE mask region
   ✓ ${editMode === 'remove' ? 'Inpaint/fill' : 'Generate content in'} that region ONLY
   ✓ Verify NO changes leaked outside the mask
   ✓ Ensure seamless blending at mask boundaries
   ✓ Return the complete edited image

═══════════════════════════════════════════════════════════════════════

REMEMBER: You are editing a SINGLE LAYER with a PROTECTIVE MASK. The black areas are like a shield - your edits cannot penetrate them. Only the white unmasked pixels are vulnerable to your modifications.
`;

        parts.push({ text: userPrompt });

        // CRITICAL: Show MASK FIRST so the model understands the protected regions
        // Add Mask Image
        const maskData = await processImage(maskImage);
        if (maskData) {
            parts.push({ text: "\n\n🎭 PROTECTION MASK (Study this FIRST):\n   • WHITE pixels = Your edit zone\n   • BLACK pixels = PROTECTED - DO NOT MODIFY\n" });
            parts.push({
                inlineData: {
                    mimeType: maskData.mimeType,
                    data: maskData.data
                }
            });
        }

        // Add Base Image AFTER mask so model knows what to protect
        const baseData = await processImage(baseImage);
        if (baseData) {
            parts.push({ text: "\n\n🖼️ BASE IMAGE (Apply mask to this):\n" });
            parts.push({
                inlineData: {
                    mimeType: baseData.mimeType,
                    data: baseData.data
                }
            });
        }

        // Add Character Images (CRITICAL FIX: Ensure characters are passed in Edit Mode)
        if (activeCharacters && activeCharacters.length > 0) {
            for (const char of activeCharacters) {
                parts.push({ text: `\n[Reference for ${char.name}]:` });
                for (const imgUrl of char.images) {
                    const imgData = await processImage(imgUrl);
                    if (imgData) {
                        parts.push({
                            inlineData: {
                                mimeType: imgData.mimeType,
                                data: imgData.data
                            }
                        });
                    }
                }
            }
        }

    } else {
        // STANDARD THUMBNAIL GENERATION LOGIC
        userPrompt = `ROLE: You are an Advanced Visual Understanding Agent.Your goal is to interpret "Annotated Sketches" and execute high - fidelity image edits.

INPUT DATA:
                - User Instructions: ${instructions}
                - Context / Topic: ${topic || 'General Thumbnail'}
                `;

        if (characterName) {
            userPrompt += `- Main Character: ${characterName} \n`;
        }

        // Explicit Character Instruction
        if (activeCharacters && activeCharacters.length > 0) {
            const names = activeCharacters.map(c => c.name).join(', ');
            userPrompt += `\n\nCHARACTER CONSISTENCY INSTRUCTION:\nYou have been provided with labeled reference images for: ${names}. You MUST use these references to generate the subject. Maintain facial features, hair style, and key characteristics of ${names}.\n`;
        }

        userPrompt += `\nYOUR CORE PROTOCOL(THE "SEE AND SOLVE" LOOP):
STEP 1: VISION ANALYSIS(Semantic Decoding)
                    - Locate the subject or area described in the instructions.
- Identify the specific object or background region.
- Infer context from the user's request.

STEP 2: EXECUTION(Semantic Editing)
                    - Perform the edit using text-based masking logic.
- Target Class: The object identified in Step 1.
                    - Prompt: "${instructions} high quality, 4k, youtube thumbnail style"

STEP 3: CLEANUP & OUTPUT
                    - Ensure the result is clean and high - fidelity.
- Seamlessly blend the edited area.

Brand Colors to use: Primary ${brandColors.primary} `;
        if (brandColors.secondary) userPrompt += `, Secondary ${brandColors.secondary} `;

        if (refinementContext) {
            userPrompt += `\n\nRefinement Mode: Based on previous image, follow these new instructions: ${refinementContext.newInstructions} `;
        }

        userPrompt += `\n\nStyle: Apple - style aesthetic, clean, premium, high contrast, professional lighting.Aspect Ratio: 16: 9.`;

        // Inject User Feedback
        userPrompt += feedbackStore.getFeedbackSummary('thumbnail');

        parts.push({ text: userPrompt });

        // Add Character Images
        if (activeCharacters && activeCharacters.length > 0) {
            for (const char of activeCharacters) {
                parts.push({ text: `\n[Reference for ${char.name}]:` });
                for (const imgUrl of char.images) {
                    const imgData = await processImage(imgUrl);
                    if (imgData) {
                        parts.push({
                            inlineData: {
                                mimeType: imgData.mimeType,
                                data: imgData.data
                            }
                        });
                    }
                }
            }
        }

        // Add Reference Thumbnails
        if (refThumbs && refThumbs.length > 0) {
            parts.push({ text: "\n[Style Reference / Annotated Image]:" });
            for (const imgUrl of refThumbs) {
                const imgData = await processImage(imgUrl);
                if (imgData) {
                    parts.push({
                        inlineData: {
                            mimeType: imgData.mimeType,
                            data: imgData.data
                        }
                    });
                }
            }
        }
    }

    // Function to make a single API call
    const generateSingleImage = async () => {
        const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: parts }],
                generationConfig: {
                    temperature: 0.4,
                    candidateCount: 1 // Always request 1 per call
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Nano Banana Pro API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const images = [];

        if (data.candidates) {
            for (const candidate of data.candidates) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                        images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
                    }
                }
            }
        }

        // Fallback for text URLs
        if (images.length === 0) {
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                const urlMatch = text.match(/https?:\/\/[^\s)]+/g);
                if (urlMatch) images.push(...urlMatch);
            }
        }

        return images;
    };

    try {
        // Execute parallel requests for variations
        const promises = Array(variationCount).fill(null).map(() => generateSingleImage());
        const results = await Promise.all(promises);

        // Flatten results
        const allImages = results.flat();

        if (allImages.length === 0) {
            throw new Error("No images generated by Nano Banana Pro.");
        }

        return {
            success: true,
            images: allImages
        };

    } catch (error) {
        console.error("Generation Error:", error);
        throw error;
    }
};


export const rateThumbnail = async (imageInput) => {
    const apiKey = localStorage.getItem('google_api_key')?.trim();

    if (!apiKey) {
        throw new Error('API_KEY_MISSING');
    }

    // Helper to convert blob/url to base64
    const getBase64 = async (input) => {
        if (typeof input === 'string' && input.startsWith('data:')) {
            return input.split(',')[1];
        }
        if (input instanceof File || input instanceof Blob) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.readAsDataURL(input);
            });
        }
        if (typeof input === 'string') {
            const response = await fetch(input);
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.readAsDataURL(blob);
            });
        }
        return null;
    };

    let base64Data;
    try {
        base64Data = await getBase64(imageInput);
    } catch (e) {
        console.error("Image processing error:", e);
        throw new Error("Failed to process image. If using a URL, try saving the image and uploading it directly (CORS restriction).");
    }

    if (!base64Data) throw new Error("Failed to process image for rating");

    const prompt = `Analyze this YouTube thumbnail as an expert "Outlier Algorithm" consultant. Rate it on 1-10 scale with STRICT calibration.

SCORING CALIBRATION (Be Honest):
- 1-3: Poor - Generic, cluttered, or fails basic design principles
- 4-5: Below Average - Missing key viral elements, weak execution
- 6: Average - Competent but unremarkable, won't stand out
- 7: Good - Has viral potential, well-executed
- 8: Great - Strong outlier qualities, high CTR likely
- 9-10: Exceptional - Near-perfect virality, professional-tier execution

POSITIVE PATTERNS (These indicate higher scores):
1. **Tutorial/Copy Me:** "Step-by-step", "I tried X", actionable format
2. **Achievability:** "No experience", "Beginner friendly", "Lazy method"
3. **Speed/Urgency:** "In 58 seconds", "Fastest way", specific timeframes
4. **Contrarian/Identity:** "Stop doing X", "You need to be BAD", challenges norms
5. **Unfair Advantage:** "Feels like cheating", "Secret loophole", "Accidentally"
6. **Specific Proof:** Exact numbers ($124,255), real dashboards, live data
7. **Visual Metaphors:** Minimalist objects (Red Brain, Notebook), clever symbolism
8. **Comparison/Versus:** Split screen, Before/After, direct comparisons
9. **Physical Proof:** Holding signs, pointing at charts/whiteboards
10. **Negative/Warning:** "Don't do this", "Stop making money" (reverse psychology)
11. **Speedrun/Challenge:** "Hour 11", "24 Hours", time-bound content
12. **Raw/Candid:** "In-field", "Raw footage", authentic vlog style
13. **Status/Appeal:** "How to be Attractive", "Magnetic", aspirational themes
14. **Simplicity/Art:** Clean design, handwritten elements, minimalist composition

NEGATIVE PATTERNS (These LOWER scores significantly):
1. **Generic Guru Aesthetics:** Fanned cash, luxury cars, generic wealth signaling
2. **Clickbait Overload:** Red arrows pointing nowhere, fake shocked faces, excessive circles
3. **Text Overload:** More than 6 words, repeating title verbatim, hard to read fonts
4. **Weak/Stock Emotion:** Generic smiling, no story-driven intensity, stock photo feel
5. **Visual Clutter:** No focal point, too many elements competing for attention
6. **Low Effort:** Poor cropping, pixelated images, amateur execution
7. **Confusing Message:** Unclear value proposition, viewer can't tell what video is about
8. **Template/Cookie-Cutter:** Looks identical to 1000 other thumbnails in niche
9. **Poor Contrast/Readability:** Text blends with background, can't read at small size
10. **Misleading/Deceptive:** Promises unrelated to actual content, fake screenshots
11. **Dated Design:** 2010s aesthetic, outdated fonts/effects, not current
12. **Face Domination (No Context):** Just a face with no supporting elements or story
13. **Lifeless/Boring:** No energy, no curiosity gap, nothing compelling to click
14. **Technical Issues:** Stretched/distorted images, misaligned elements, typos

EVALUATION CRITERIA:
1. **Focal Point (1-10):** Single, unmistakable center of attention?
2. **Composition (1-10):** Rule of thirds, balance, negative space, professional layout?
3. **Virality/CTR (1-10):** Specific outcome promised? Achievable? Curiosity gap?
4. **Clarity/Contrast (1-10):** Readable in split second? Clear at thumbnail size?
5. **Identity/Branding (1-10):** Premium look? Recognizable style? Professional polish?
6. **Outlier Potential (1-10):** "1-of-10" factor? High value? Differentiated?

Return ONLY this JSON (no markdown):
{
  "focal_point": { "score": number, "reasoning": "string" },
  "composition": { "score": number, "reasoning": "string" },
  "virality": { "score": number, "reasoning": "string" },
  "clarity": { "score": number, "reasoning": "string" },
  "identity": { "score": number, "reasoning": "string" },
  "outlier_potential": { "score": number, "reasoning": "string" },
  "positive_patterns": ["string"],
  "negative_patterns": ["string"],
  "overall_score": number,
  "improvement_suggestions": ["string", "string", "string"]
}`;

    const parts = [
        { text: prompt },
        {
            inlineData: {
                mimeType: "image/jpeg",
                data: base64Data
            }
        }
    ];
    const candidateModels = [
        'models/gemini-2.5-flash',
        'models/gemini-2.5-pro',
        'models/gemini-2.0-flash',
        'models/gemini-2.0-pro-exp'
    ];

    let errors = [];

    for (const modelId of candidateModels) {
        try {
            console.log(`Attempting rating with model: ${modelId}`);
            const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/${modelId}:generateContent`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

            const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: parts }],
                    generationConfig: {
                        temperature: 0.2
                    },
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                    ]
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                let errorMessage = response.statusText;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error?.message || errorMessage;
                } catch (e) { }

                if (response.status === 404) {
                    console.warn(`Model ${modelId} not found.`);
                } else {
                    console.warn(`Model ${modelId} failed: ${errorMessage}`);
                }
                throw new Error(`${modelId}: ${errorMessage}`);
            }

            const data = await response.json();

            // Check for safety blocking
            if (data.promptFeedback?.blockReason) {
                throw new Error(`Safety Block: ${data.promptFeedback.blockReason}`);
            }

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                // Check finish reason
                const finishReason = data.candidates?.[0]?.finishReason;
                if (finishReason) throw new Error(`Generation stopped: ${finishReason}`);
                throw new Error("No rating data returned from API.");
            }

            // Robust cleanup for markdown blocks
            let cleanText = text.replace(/```json\n?|\n?```/gi, '').trim();
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) cleanText = jsonMatch[0];

            return {
                success: true,
                data: JSON.parse(cleanText)
            };

        } catch (error) {
            console.error(`Rating failed with ${modelId}:`, error);
            errors.push(error.message);
            if (error.name === 'AbortError') continue;
        }
    }

    const uniqueErrors = [...new Set(errors)];
    throw new Error(`Rating failed. ${uniqueErrors.join('. ')}`);
};

export const compareThumbnails = async (imageInput1, imageInput2) => {
    const apiKey = localStorage.getItem('google_api_key')?.trim();

    if (!apiKey) {
        throw new Error('API_KEY_MISSING');
    }

    // Helper to convert blob/url to base64
    const getBase64 = async (input) => {
        if (typeof input === 'string' && input.startsWith('data:')) {
            return input.split(',')[1];
        }
        if (input instanceof File || input instanceof Blob) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.readAsDataURL(input);
            });
        }
        if (typeof input === 'string') {
            const response = await fetch(input);
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.readAsDataURL(blob);
            });
        }
        return null;
    };

    let base64Data1, base64Data2;
    try {
        [base64Data1, base64Data2] = await Promise.all([
            getBase64(imageInput1),
            getBase64(imageInput2)
        ]);
    } catch (e) {
        console.error("Image processing error:", e);
        throw new Error("Failed to process images. If using URLs, try uploading directly (CORS restriction).");
    }

    if (!base64Data1 || !base64Data2) throw new Error("Failed to process images for comparison");

    const prompt = `Compare these two YouTube thumbnails as an expert "Outlier Algorithm" consultant. Rate BOTH thumbnails using the STRICT 1-10 calibration.

SCORING CALIBRATION:
- 1-3: Poor - Generic, cluttered, or fails basic design principles
- 4-5: Below Average - Missing key viral elements, weak execution
- 6: Average - Competent but unremarkable, won't stand out
- 7: Good - Has viral potential, well-executed
- 8: Great - Strong outlier qualities, high CTR likely
- 9-10: Exceptional - Near-perfect virality, professional-tier execution

Provide individual ratings for BOTH thumbnails, then comparative analysis.

Return ONLY this JSON (no markdown):
{
  "thumbnail1": {
    "focal_point": { "score": number, "reasoning": "string" },
    "composition": { "score": number, "reasoning": "string" },
    "virality": { "score": number, "reasoning": "string" },
    "clarity": { "score": number, "reasoning": "string" },
    "identity": { "score": number, "reasoning": "string" },
    "outlier_potential": { "score": number, "reasoning": "string" },
    "positive_patterns": ["string"],
    "negative_patterns": ["string"],
    "overall_score": number,
    "improvement_suggestions": ["string", "string", "string"]
  },
  "thumbnail2": {
    "focal_point": { "score": number, "reasoning": "string" },
    "composition": { "score": number, "reasoning": "string" },
    "virality": { "score": number, "reasoning": "string" },
    "clarity": { "score": number, "reasoning": "string" },
    "identity": { "score": number, "reasoning": "string" },
    "outlier_potential": { "score": number, "reasoning": "string" },
    "positive_patterns": ["string"],
    "negative_patterns": ["string"],
    "overall_score": number,
    "improvement_suggestions": ["string", "string", "string"]
  },
  "comparison": {
    "winner": "thumbnail1" | "thumbnail2" | "tie",
    "winner_reasoning": "string (2-3 sentences explaining why)",
    "thumbnail1_strengths": ["string", "string"],
    "thumbnail2_strengths": ["string", "string"],
    "key_differences": ["string", "string"]
  }
}`;

    const parts = [
        { text: "THUMBNAIL 1:" },
        { inlineData: { mimeType: "image/jpeg", data: base64Data1 } },
        { text: "\n\nTHUMBNAIL 2:" },
        { inlineData: { mimeType: "image/jpeg", data: base64Data2 } },
        { text: "\n\n" + prompt }
    ];

    const candidateModels = [
        'models/gemini-2.5-flash',
        'models/gemini-2.5-pro',
        'models/gemini-2.0-flash',
        'models/gemini-2.0-pro-exp'
    ];

    let errors = [];

    for (const modelId of candidateModels) {
        try {
            console.log(`Attempting comparison with model: ${modelId}`);
            const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/${modelId}:generateContent`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout

            const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: parts }],
                    generationConfig: {
                        temperature: 0.2
                    },
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                    ]
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                let errorMessage = response.statusText;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error?.message || errorMessage;
                } catch (e) { }

                if (response.status === 404) {
                    console.warn(`Model ${modelId} not found.`);
                } else {
                    console.warn(`Model ${modelId} failed: ${errorMessage}`);
                }
                throw new Error(`${modelId}: ${errorMessage}`);
            }

            const data = await response.json();

            if (data.promptFeedback?.blockReason) {
                throw new Error(`Safety Block: ${data.promptFeedback.blockReason}`);
            }

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                const finishReason = data.candidates?.[0]?.finishReason;
                if (finishReason) throw new Error(`Generation stopped: ${finishReason}`);
                throw new Error("No comparison data returned from API.");
            }

            // Robust cleanup
            let cleanText = text.replace(/```json\n?|\n?```/gi, '').trim();
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) cleanText = jsonMatch[0];

            return {
                success: true,
                data: JSON.parse(cleanText)
            };

        } catch (error) {
            console.error(`Comparison failed with ${modelId}:`, error);
            errors.push(error.message);
            if (error.name === 'AbortError') continue;
        }
    }

    const uniqueErrors = [...new Set(errors)];
    throw new Error(`Comparison failed. ${uniqueErrors.join('. ')}`);
};



export const generatePackage = async (params) => {
    const apiKey = localStorage.getItem('google_api_key')?.trim();
    const textModelId = 'models/gemini-2.5-flash';
    const imageModelId = localStorage.getItem('google_model_id') || 'models/gemini-3-pro-image-preview';

    // Ensure image model has prefix
    let finalImageModelId = imageModelId;
    if (finalImageModelId === 'gemini-1.5-flash-001' || finalImageModelId === 'models/gemini-1.5-flash-001') {
        finalImageModelId = 'models/gemini-1.5-flash';
    }
    if (!finalImageModelId.includes('/') && !finalImageModelId.startsWith('models/') && !finalImageModelId.startsWith('tunedModels/')) {
        finalImageModelId = `models/${finalImageModelId}`;
    }

    const { topic, videoTopic, channelLink, formats, brandColors, activeCharacters, variationCount = 1 } = params;

    if (!apiKey) throw new Error('API_KEY_MISSING');

    const results = [];

    // Helper for text generation
    const generateText = async (prompt) => {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${textModelId}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7 }
            })
        });
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    };

    // Helper for image generation (reusing logic from generateThumbnail but simplified for single call)
    const generateImage = async (imagePrompt, activeChars) => {
        const parts = [{ text: imagePrompt }];

        // Add Character Images
        if (activeChars && activeChars.length > 0) {
            for (const char of activeChars) {
                parts.push({ text: `\n[Reference for ${char.name}]:` });
                for (const imgUrl of char.images) {
                    let base64Data = "";
                    if (imgUrl.startsWith('data:')) {
                        base64Data = imgUrl.split(',')[1];
                    } else {
                        try {
                            const response = await fetch(imgUrl);
                            const blob = await response.blob();
                            base64Data = await new Promise((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                                reader.readAsDataURL(blob);
                            });
                        } catch (e) { console.error(e); }
                    }

                    if (base64Data) {
                        parts.push({
                            inlineData: { mimeType: "image/jpeg", data: base64Data }
                        });
                    }
                }
            }
        }



        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${finalImageModelId}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: parts }],
                generationConfig: { candidateCount: 1 }
            })
        });

        const data = await response.json();

        // More efficient: use for loops with early return instead of nested forEach
        if (data.candidates) {
            for (const candidate of data.candidates) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }
        }
        return "";
    };

    try {
        for (let i = 0; i < variationCount; i++) {
            const format = formats[i % formats.length];

            // 1. Generate Title
            const titlePrompt = `Generate a YouTube video title about "${topic}" (Context: "${videoTopic || ''}") that strictly follows this format structure: "${format.titleFormat}". 
            Swap out the specific nouns and verbs to match the topic, but keep the grammatical structure and "clickbait" style of the original format.
            CRITICAL: Do NOT change any exact numbers or currency figures found in the user's input (e.g., if user says "$10k", do NOT change it to "$5k"). Only change units if it makes sense (e.g. "7 days" -> "1 week"), but never change the underlying value.
            Return ONLY the title text.`;

            const generatedTitle = await generateText(titlePrompt);

            // 2. Generate Thumbnail
            const imagePrompt = `ROLE: You are an Automated Outlier Curator Engine specialized in creating high-performing YouTube thumbnails.
            TASK: Generate a professional, high-CTR YouTube thumbnail.
            
            BLUEPRINT: ${format.formatDNA.blueprint}
            FOCUS: ${format.formatDNA.focus}
            KEY ELEMENTS: ${format.formatDNA.elements.join(', ')}
            
            CONTEXT:
            - Topic/Keyword: ${topic}
            - Video Title: "${videoTopic || generatedTitle}"
            - Channel Context: ${channelLink || 'None'}
            - Brand Colors: Primary ${brandColors.primary || 'None'}${brandColors.secondary ? `, Secondary ${brandColors.secondary}` : ''}
            ${activeCharacters && activeCharacters.length > 0 ? `- Main Character: ${activeCharacters.map(c => c.name).join(', ')} (See labeled reference images)` : ''}
            
            ${activeCharacters && activeCharacters.length > 0 ? `CHARACTER CONSISTENCY INSTRUCTION:
            You have been provided with labeled reference images for: ${activeCharacters.map(c => c.name).join(', ')}. 
            You MUST use these references to generate the subject. Maintain facial features, hair style, and key characteristics of ${activeCharacters.map(c => c.name).join(' and ')}.` : ''}
            
            CRITICAL THUMBNAIL DESIGN RULES:
            
            1. **TEXT QUALITY (MOST IMPORTANT)**:
               - Use a MAXIMUM of 3-5 BOLD words total
               - Text must be LARGE, CLEAN, and EXTREMELY READABLE
               - Never repeat time stamps or contradictory information (e.g., "Hour 14" twice, or "Hour 14" when title says "5 minutes")
               - Text should REINFORCE the title, not contradict it
               - Use high-contrast colors (white/black or brand colors) with dark stroke/shadow
               - Font should be BOLD, SANS-SERIF, and PROFESSIONAL (like Arial Black, Bebas, or Impact)
            
            2. **CONTENT TYPE DETECTION**:
               - IF the title mentions a TOOL, SOFTWARE, or PLATFORM (e.g., "Antigravity", "n8n", "Docker"):
                 * Include the tool's LOGO prominently in the thumbnail
                 * Show a darkened screenshot of the tool in action in the background
                 * Foreground text should be SHORT and CLEAR (e.g., "SELF HOST", "IN MINUTES")
                 * Subject (if included) should look CONFIDENT, not tired or stressed
               
               - IF the title is about SPEED/TIME (e.g., "in 5 minutes", "fastest way"):
                 * Progressive time stamps (e.g., "MIN 3", "HOUR 2") CAN be used IF they are LESS than the time mentioned in the title AND make contextual sense
                 * Example: Title says "in 24 hours" → can use "HOUR 6", "HOUR 12" etc. (NOT "HOUR 48")
                 * Example: Title says "in 5 minutes" → can use "MIN 2", "MIN 4" (NOT "MIN 10" or "HOUR 1")
                 * These stamps are OPTIONAL and should only be used if they enhance the narrative
                 * Subject should look FOCUSED and EFFICIENT, not exhausted
                 * Visual should emphasize SIMPLICITY and EASE, not difficulty
               
               - IF the title is about a CHALLENGE or SPEEDRUN:
                 * CAN use dramatic lighting, tired expressions, time stamps
                 * Text can emphasize effort ("HOUR 11", "DAY 3")
               
               - For INFORMATIONAL/TUTORIAL content:
                 * Clean, minimalist design
                 * Logo-forward if applicable
                 * Professional, trustworthy aesthetic
                 * Text reinforces the core benefit
            
            3. **VISUAL HIERARCHY**:
               - Background: Subtly darkened (50-70% opacity overlay), showing context
               - Midground: Logo or tool interface if applicable
               - Foreground: Bold text and/or subject (character reference)
               - Avoid cluttered, noisy backgrounds
            
            4. **CONSISTENCY**:
               - The thumbnail MUST tell the same story as the title
               - If the title says "easy" or "quick", the thumbnail should NOT look difficult
               - If the title mentions a specific tool, INCLUDE its logo
               - Time references must EXACTLY match what's in the title
            
            5. **SUBJECT EXPRESSION** (if human present):
               - Informational/Tutorial: Confident, friendly, pointing gesture
               - Challenge/Dramatic: Intense, focused, or exhausted (context-dependent)
               - Speed/Quick: Focused, efficient looking
            
            EXECUTION INSTRUCTIONS:
            - Create a high-resolution (1920x1080), photorealistic thumbnail
            - Integrate the provided Character Reference naturally if provided
            - Use the Brand Colors for text and accents
            - Ensure the final result is CLEAN, PROFESSIONAL, and THUMB-STOPPING
            - NEVER include random or contradictory text elements
            `;

            // Inject User Feedback
            imagePrompt += feedbackStore.getFeedbackSummary('thumbnail');

            const generatedImage = await generateImage(imagePrompt, activeCharacters);

            if (generatedImage) {
                results.push({
                    title: generatedTitle,
                    image: generatedImage,
                    format: format,
                    id: Date.now() + i
                });
            }
        }

        return {
            success: true,
            packages: results
        };
    } catch (error) {
        console.error("Package Generation Error:", error);
        throw error;
    }
};

export const generateViralTitles = async (params) => {
    const apiKey = localStorage.getItem('google_api_key');
    // Use stable Pro model
    const modelId = 'models/gemini-2.5-flash';

    const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/${modelId}:generateContent`;

    if (!apiKey) {
        throw new Error('API_KEY_MISSING');
    }

    const { topic, transcript } = params;

    const prompt = `
# ROLE & OBJECTIVE
The tab's goal is to analyze raw content (User Topics or Video Transcripts) and map them to specific, high-performing Viral Title Architectures.

# INPUT VARIABLES
1. **Topic Description:** ${topic || 'N/A'}
2. **Transcript Text:** ${transcript ? transcript.substring(0, 30000) : 'N/A'}

# STEP 1: CONTENT ANALYSIS
* **If Transcript is provided:** Read the full text. Ignore filler words. Extract the following:
    * *The Hard Numbers:* (Revenue, timeframes, data points).
    * *The "Aha" Moment:* The unique insight or mechanism.
    * *The Pain Point:* The specific struggle the speaker solves.
    * *The Outcome:* The final transformation.
* **If only Topic is provided:** Extrapolate the likely pain points and outcomes associated with that niche.

# STEP 2: THE "FEASIBILITY CHECK" (CRITICAL)
You possess a library of **12 Viral Architectures** (listed below). You must iterate through each one and ask:
* *"Does this content logically fit this structure?"*
* **DO NOT FORCE IT.** (e.g., If the content is a philosophical rant, do not force a "Speedrun" title).
* If the content does not fit a format, mark that format as "N/A" in the output.
* However, try to adapt the angle if a logical bridge exists (e.g., framing a philosophical lesson as a "Boring Truth").

# STEP 3: THE VIRAL LIBRARY (Architectures)
1.  **THE SPEEDRUN:** \`speedrunning [task] from $0 to [outcome] (i show everything)\`
2.  **THE EXACT PATH:** \`the EXACT path to [Goal] (without [Pain Point])\`
3.  **THE CONDITIONAL COMMAND:** \`[Relatable Failure/Feeling]? Watch This.\`
4.  **THE RESOURCE WARNING:** \`If You Have Less Than [$ Amount] Saved, Please Watch This\`
5.  **THE "JUST COPY ME" SOP:** \`how i [action] to [result] every time (just copy me)\`
6.  **THE BORING TRUTH:** \`This Isn’t [Exciting/New], But It Will [Desirable Outcome]\`
7.  **THE "NOW WHAT?" PIVOT:** \`I [Achieved Small Win], Now What Do I Do?\`
8.  **THE FORENSIC AUDIT:** \`Why [Person/Business] Isn’t Making Money (Breakdown)\`
9.  **THE AGGREGATE:** \`How [Number] Everyday People Earn [Amount] with [Topic]\`
10. **THE CONTRARIAN REBUTTAL:** \`Why [Popular Advice] Is A Scam / Keeping You Poor\`
11. **THE PROPRIETARY MECHANISM:** \`The [Unique Name] Method: How to [Benefit]\`
12. **THE TIME ARBITRAGE:** \`It Only Takes [Small Number] Minutes/Days\`

# OUTPUT INSTRUCTIONS
Output a list of valid matches. If the transcript/topic cannot fit *any* of the formats (highly unlikely), output: "Content type does not match known viral formats."

**Format the response as a JSON object** with a key "results" containing an array of objects.
Each object should have:
- "architecture": "Architecture Name"
- "status": "MATCH" or "N/A"
- "title": "The generated title"
- "thumbnail_concept": "Visual description"
- "why_it_works": "Brief sentence"

Example JSON Structure:
{
  "results": [
    {
      "architecture": "THE SPEEDRUN",
      "status": "MATCH",
      "title": "Speedrunning Drop Shipping from $0 to $10k (I Show Everything)",
      "thumbnail_concept": "Split screen: Day 1 ($0) vs Day 30 ($10k)",
      "why_it_works": "Promises a complete, transparent process."
    }
  ]
}
Do not include markdown formatting like \`\`\`json. Just the raw JSON string.
`;

    try {
        const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7
                    // responseMimeType removed for gemini-pro compatibility
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Title API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error("No title data returned.");

        let cleanText = text.replace(/```json\n?|\n?```/gi, '').trim();
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) cleanText = jsonMatch[0];

        return JSON.parse(cleanText);

    } catch (error) {
        console.error("Title Generation Error:", error);
        throw error;
    }
};
