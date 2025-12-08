export const enhancePrompt = (prompt) => {
    if (!prompt) return "";

    const p = prompt.toLowerCase();
    let enhancements = [];

    // 1. Detect Category & Add Specific Boosters
    if (p.includes('money') || p.includes('cash') || p.includes('dollar') || p.includes('finance') || p.includes('invest')) {
        enhancements.push("high stakes", "stacks of cash", "green arrows", "dramatic lighting");
    }
    if (p.includes('game') || p.includes('gaming') || p.includes('play') || p.includes('minecraft') || p.includes('roblox')) {
        enhancements.push("vibrant neon colors", "action shot", "dynamic composition", "4k render", "unreal engine 5 style");
    }
    if (p.includes('food') || p.includes('eat') || p.includes('burger') || p.includes('cook')) {
        enhancements.push("delicious", "steam rising", "macro photography", "golden hour lighting", "appetizing");
    }
    if (p.includes('tech') || p.includes('phone') || p.includes('review') || p.includes('laptop')) {
        enhancements.push("sleek product shot", "studio lighting", "clean background", "bokeh", "futuristic");
    }
    if (p.includes('vlog') || p.includes('travel') || p.includes('day in')) {
        enhancements.push("wide angle gopro shot", "sunny bright atmosphere", "high energy", "travel aesthetic");
    }
    if (p.includes('scary') || p.includes('horror') || p.includes('ghost')) {
        enhancements.push("dark moody atmosphere", "fog", "mysterious shadows", "high contrast", "cinematic horror");
    }

    // 2. Universal Quality Boosters (if not already present)
    const qualityBoosters = ["YouTube trending style", "high contrast", "expressive facial features", "detailed background", "8k resolution"];

    qualityBoosters.forEach(booster => {
        if (!p.includes(booster.toLowerCase())) {
            enhancements.push(booster);
        }
    });

    // 3. Construct new prompt
    // We append the enhancements, but we try to weave them in naturally or just append as tags
    const uniqueEnhancements = [...new Set(enhancements)]; // Remove dupes

    return `${prompt}, ${uniqueEnhancements.join(", ")}`;
};
