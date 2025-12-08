// OCE Bank - Outlier Curator Engine Data Store
// Simulates the storage of high-performance thumbnail formats

const MOCK_OCE_BANK = [
    {
        id: 'oce_001',
        outlierMultiplier: 14.2, // 14.2x better than average
        titleFormat: "7 [NOUN] That Will Change Your [TOPIC] Forever",
        channel: "Alex Hormozi",
        referenceVideo: {
            title: "7 Money Rules That Will Change Your Life Forever",
            thumbnailUrl: "https://i.ytimg.com/vi/2X8h_M_oO1I/maxresdefault.jpg"
        },
        formatDNA: {
            blueprint: "Split screen comparison, high contrast text on left, emotion face on right.",
            focus: "Before/After transformation or stark contrast.",
            elements: ["Bold Sans-Serif Text", "Red Arrow", "Expressive Face"]
        }
    },
    {
        id: 'oce_002',
        outlierMultiplier: 8.5,
        titleFormat: "I Tried [TOPIC] for 30 Days",
        channel: "Matt D'Avella",
        referenceVideo: {
            title: "I Tried KETO for 30 Days",
            thumbnailUrl: "https://i.ytimg.com/vi/1X8h_M_oO1I/maxresdefault.jpg"
        },
        formatDNA: {
            blueprint: "Minimalist background, centered subject, calendar or progress bar graphic.",
            focus: "Passage of time, experiment results.",
            elements: ["Clean Background", "Calendar Icon", "Neutral Face"]
        }
    },
    {
        id: 'oce_003',
        outlierMultiplier: 6.1,
        titleFormat: "Stop Doing [TOPIC] (Do This Instead)",
        channel: "Ali Abdaal",
        referenceVideo: {
            title: "Stop Studying (Do This Instead)",
            thumbnailUrl: "https://i.ytimg.com/vi/3X8h_M_oO1I/maxresdefault.jpg"
        },
        formatDNA: {
            blueprint: "Subject holding object with 'X' mark, alternative object with checkmark.",
            focus: "Mistake correction, better alternative.",
            elements: ["Red X", "Green Checkmark", "Split Background"]
        }
    },
    {
        id: 'oce_004',
        outlierMultiplier: 5.4,
        titleFormat: "The [ADJECTIVE] Truth About [TOPIC]",
        channel: "Iman Gadzhi",
        referenceVideo: {
            title: "The Dark Truth About Dropshipping",
            thumbnailUrl: "https://i.ytimg.com/vi/4X8h_M_oO1I/maxresdefault.jpg"
        },
        formatDNA: {
            blueprint: "Dark moody lighting, serious face close-up, single word text overlay.",
            focus: "Revelation, secret knowledge, seriousness.",
            elements: ["Dark Gradient", "Cinematic Lighting", "Serif Font"]
        }
    },
    {
        id: 'oce_005',
        outlierMultiplier: 4.8,
        titleFormat: "How I Made $[FIGURE] in [TIME_PERIOD]",
        channel: "Liam Ottley",
        referenceVideo: {
            title: "How I Made $10,000 in 30 Days",
            thumbnailUrl: "https://i.ytimg.com/vi/5X8h_M_oO1I/maxresdefault.jpg"
        },
        formatDNA: {
            blueprint: "Dashboard screenshot background, subject pointing at revenue figure.",
            focus: "Proof of results, financial success.",
            elements: ["Revenue Graph", "Green Arrow", "Excited Face"]
        }
    },
    {
        id: 'FKYP-001',
        outlierMultiplier: 15.5, // Proven High Outlier
        titleFormat: "[CONTROVERSIAL PHRASE] Your [TOPIC]",
        channel: "Viral Outlier",
        referenceVideo: {
            title: "F*ck Your Passion",
            thumbnailUrl: "https://i.ytimg.com/vi/placeholder/maxresdefault.jpg"
        },
        formatDNA: {
            blueprint: "Text dominant overlay with controversial statement. High contrast background.",
            focus: "Contrarian advice, shocking statement.",
            elements: ["Bold Caps Text", "Controversial Hook", "Serious/Angry Face"]
        }
    },
    {
        id: 'oce_fastest_way',
        outlierMultiplier: 12.5,
        titleFormat: "Fastest way to get [NUMBER] in your [NOUN] asap",
        channel: "Financial Outlier",
        referenceVideo: {
            title: "Fastest way to get $3,000 or $5,000 in your bank account asap",
            thumbnailUrl: "https://i.ytimg.com/vi/placeholder_a/maxresdefault.jpg"
        },
        formatDNA: {
            blueprint: "Subject in studio with microphone, thoughtful hand-on-chin pose. Text highlights specific numbers.",
            focus: "Speed and specific financial outcome.",
            elements: ["Studio Setting", "Microphone", "Thoughtful Pose", "Specific Numbers"]
        }
    },
    {
        id: 'oce_time_exchange',
        outlierMultiplier: 13.9,
        titleFormat: "Give me [TIME]...I'll [ACTION] your [NOUN]",
        channel: "Sales Outlier",
        referenceVideo: {
            title: "Give me 58 sec...I'll DELETE your fear of rejection",
            thumbnailUrl: "https://i.ytimg.com/vi/placeholder_b/maxresdefault.jpg"
        },
        formatDNA: {
            blueprint: "Extreme close-up, intense eye contact. Split text: 'I got' vs '[TIME]' in contrasting colors.",
            focus: "High value promise in short time.",
            elements: ["Intense Gaze", "Yellow/White Text Contrast", "Time Constraint"]
        }
    },
    {
        id: 'oce_contrarian_identity',
        outlierMultiplier: 11.0,
        titleFormat: "You NEED To Be A '[ADJECTIVE]' Person To [ACTION]",
        channel: "Manifestation Outlier",
        referenceVideo: {
            title: "You NEED To Be A 'BAD' Person To Manifest",
            thumbnailUrl: "https://i.ytimg.com/vi/placeholder_c/maxresdefault.jpg"
        },
        formatDNA: {
            blueprint: "Split screen: Cool/Edgy subject with sunglasses vs Technical Diagram/Schema.",
            focus: "Counter-intuitive advice, combining cool factor with technical proof.",
            elements: ["Sunglasses/Edgy Look", "Technical Diagram", "Split Screen"]
        }
    },
    {
        id: 'oce_accidental_success',
        outlierMultiplier: 16.2,
        titleFormat: "How I Accidentally Made [AMOUNT] in [TIME]",
        channel: "Copywriting Outlier",
        referenceVideo: {
            title: "how i accidentally made $124,255 in a month as a copywriter",
            thumbnailUrl: "https://i.ytimg.com/vi/placeholder_d/maxresdefault.jpg"
        },
        formatDNA: {
            blueprint: "Casual selfie-style shot, looking slightly confused or surprised. Background is a normal room/couch.",
            focus: "Low effort, high reward, relatability.",
            elements: ["Casual Look", "Confused/Surprised Expression", "Normal Room Background"]
        }
    },
    {
        id: 'oce_unfair_advantage',
        outlierMultiplier: 14.8,
        titleFormat: "The Secret to [RESULT] (Feels Like Cheating)",
        channel: "Growth Outlier",
        referenceVideo: {
            title: "The Secret to Instant Sexual Tension (feels like cheating)",
            thumbnailUrl: "https://i.ytimg.com/vi/placeholder_e/maxresdefault.jpg"
        },
        formatDNA: {
            blueprint: "Candid street shot or social setting. Text overlay emphasizes 'Works Every Time' or 'Cheating'.",
            focus: "Unfair advantage, secret loophole, social dynamics.",
            elements: ["Candid/Blurry Background", "Bold 'Cheating' Claim", "Social Context"]
        }
    },
    {
        id: 'oce_ai_automation',
        outlierMultiplier: 15.1,
        titleFormat: "This Simple AI Automation Generates [AMOUNT]/mo",
        channel: "Tech Outlier",
        referenceVideo: {
            title: "This Simple Make.com Automation Generates $20K/mo on Upwork",
            thumbnailUrl: "https://i.ytimg.com/vi/placeholder_f/maxresdefault.jpg"
        },
        formatDNA: {
            blueprint: "Excited face close-up, holding head or pointing. Background filled with logos (Upwork, OpenAI, Make).",
            focus: "Tech leverage, modern opportunity, high income.",
            elements: ["Tech Logos", "Excited/Shocked Face", "Income Claim Badge"]
        }
    },
    {
        id: 'oce_visual_metaphor',
        outlierMultiplier: 14.5,
        titleFormat: "The [METHOD_NAME] Method: How to [ACTION] [RESULT]",
        channel: "Philosophy Outlier",
        referenceVideo: {
            title: "How to Force Your BRAIN to Do HARD Things: The Lotus Method",
            thumbnailUrl: "https://i.ytimg.com/vi/placeholder_g/maxresdefault.jpg"
        },
        formatDNA: {
            blueprint: "Minimalist, high-contrast central object (e.g., Red Brain, Lotus) on dark background. Text is integrated or minimal.",
            focus: "Conceptual depth, intrigue, 'The Art of'.",
            elements: ["Central Object", "High Contrast Black/Red", "Minimalist"]
        }
    },
    {
        id: 'oce_transformation_comparison',
        outlierMultiplier: 15.8,
        titleFormat: "[OLD_WAY] vs [NEW_WAY]: Why [NEW_WAY] Wins",
        channel: "Life Hack Outlier",
        referenceVideo: {
            title: "Seriously, watch this before you go to college",
            thumbnailUrl: "https://i.ytimg.com/vi/placeholder_h/maxresdefault.jpg"
        },
        formatDNA: {
            blueprint: "Split screen comparison. Left side 'Old/Bad' (Red), Right side 'New/Good' (Green). Clear visual dichotomy.",
            focus: "Choice architecture, better alternative, 'Stop doing this'.",
            elements: ["Split Screen", "Red/Green Contrast", "Before/After"]
        }
    },
    {
        id: 'oce_proof_pointing',
        outlierMultiplier: 16.5,
        titleFormat: "My Exact [STRATEGY] to [RESULT] (Step-by-Step)",
        channel: "Biz Strategy Outlier",
        referenceVideo: {
            title: "my exact $1.5M content strategy to sign $10k+ clients",
            thumbnailUrl: "https://i.ytimg.com/vi/placeholder_i/maxresdefault.jpg"
        },
        formatDNA: {
            blueprint: "Subject standing next to a whiteboard, screen, or chart, pointing specifically at a data point or diagram.",
            focus: "Hard evidence, 'Look at this', breakdown.",
            elements: ["Whiteboard/Chart", "Pointing Finger", "Specific Data"]
        }
    },
    {
        id: 'oce_sign_holding',
        outlierMultiplier: 13.5,
        titleFormat: "[CONTROVERSIAL_STATEMENT]. Here's What I Learned.",
        channel: "Opinion Outlier",
        referenceVideo: {
            title: "I Trained 1000 Elite Athletes. Here's What I Learned.",
            thumbnailUrl: "https://i.ytimg.com/vi/placeholder_j/maxresdefault.jpg"
        },
        formatDNA: {
            blueprint: "Subject holding a physical sign or piece of paper with a bold, contrarian statement written on it.",
            focus: "Direct address, controversial take, 'Truth bomb'.",
            elements: ["Physical Sign", "Bold Text on Sign", "Direct Eye Contact"]
        }
    },
    {
        id: 'oce_speedrun_challenge',
        outlierMultiplier: 17.0,
        titleFormat: "I [ACTION] in [SHORT_TIME] (Speedrun)",
        channel: "Challenge Outlier",
        referenceVideo: {
            title: "How I Learn to Speak Any Language in 24 Hours",
            thumbnailUrl: "https://i.ytimg.com/vi/placeholder_k/maxresdefault.jpg"
        },
        formatDNA: {
            blueprint: "Dark room/focus environment. Time stamp overlay (e.g., 'Hour 11'). Intense focus or exhaustion.",
            focus: "Extreme effort, time constraint, 'impossible' task.",
            elements: ["Time Stamp Overlay", "Dark Mode/Focus Lighting", "Laptop/Workstation"]
        }
    },
    {
        id: 'oce_simple_truth',
        outlierMultiplier: 14.2,
        titleFormat: "The Simple Art of [DESIRABLE_RESULT]",
        channel: "Minimalist Outlier",
        referenceVideo: {
            title: "The Simple Art of Blowing Up on YouTube",
            thumbnailUrl: "https://i.ytimg.com/vi/placeholder_l/maxresdefault.jpg"
        },
        formatDNA: {
            blueprint: "Minimalist composition. Central object framed (like a painting) or handwritten text on clean background.",
            focus: "Simplicity, clarity, 'The Truth'.",
            elements: ["Gold Frame or Handwritten Text", "Minimalist Background", "Central Icon"]
        }
    },
    {
        id: 'oce_social_status',
        outlierMultiplier: 15.5,
        titleFormat: "How to [MULTIPLIER] Your [SOCIAL_ATTRIBUTE]",
        channel: "Social Dynamics Outlier",
        referenceVideo: {
            title: "How to 10x Your Sex Appeal",
            thumbnailUrl: "https://i.ytimg.com/vi/placeholder_m/maxresdefault.jpg"
        },
        formatDNA: {
            blueprint: "Subject in high-status attire (suit). Background implies social success (blurred crowd/party). Bold red/white text.",
            focus: "Status upgrade, desirability, social proof.",
            elements: ["High Status Attire", "Blurred Social Background", "Bold Red/White Text"]
        }
    },
    {
        id: 'oce_raw_reality',
        outlierMultiplier: 16.8,
        titleFormat: "[PAIN_POINT]? Watch This.",
        channel: "Realist Outlier",
        referenceVideo: {
            title: "Terrified to approach? Watch this.",
            thumbnailUrl: "https://i.ytimg.com/vi/placeholder_n/maxresdefault.jpg"
        },
        formatDNA: {
            blueprint: "Candid, handheld camera style. Looks like a vlog or security footage. Unpolished and 'real'.",
            focus: "Authenticity, 'in the field', raw advice.",
            elements: ["Candid/Grainy Quality", "Real World Setting", "Night/Street Vibe"]
        }
    }
];

class OCEStore {
    constructor() {
        this.bank = [...MOCK_OCE_BANK];
    }

    getTopFormats(count = 3) {
        return this.bank.sort((a, b) => b.outlierMultiplier - a.outlierMultiplier).slice(0, count);
    }

    // Simulate "Autonomous Data Sourcing" by returning the static bank for now
    getBank() {
        return this.bank;
    }

    // Helper to find relevant formats based on topic (simple keyword match simulation)
    findRelevantFormats(topic) {
        // In a real engine, this would use semantic search. 
        // For now, we just return the top formats as "universally relevant" high performers.
        return this.getTopFormats(5);
    }
}

export const oceStore = new OCEStore();
