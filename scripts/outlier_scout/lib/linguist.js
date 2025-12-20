export class Linguist {
    constructor() {
        this.structures = [
            {
                // Structure: I Asked [Authority] How to Go From [State] to [Outcome]
                check: (t) => /i\s+asked\s+(.+)\s+how\s+to\s+go\s+from\s+(.+)\s+to\s+(.+)/i.test(t),
                format: (t) => `I Asked [Authority Figure/AI/Company] How to Go From [Common Negative Current State] to [Desired Outcome]`,
                example: "I Asked Elon Musk How to Go From Broke to Billionaire"
            },
            {
                // Structure: I'm [Age/Status]. If I Was [Age/Status] Again, Here's What I'd Do
                // Fixed regex to handle "I'm 45. If I Was..." correctly
                check: (t) => /i[\'’]m\s+(\d+|[a-z]+)[\.,]?\s+if\s+i\s+was\s+(\d+|[a-z]+)\s+again/i.test(t),
                format: (t) => `I'm [Current Age/Status]. If I Was [Previous Age/Status] Again, Here's What I'd Do`,
                example: "I'm 45. If I Was 20 Again, Here's What I'd Do"
            },
            {
                // Structure: I [Action] [Topic] for [Time]
                check: (t) => /i\s+(\w+)\s+(.+)\s+for\s+(\d+\s*\w+)/i.test(t),
                format: (t) => `I [Extreme Action] [Topic] for [Time Period]`,
                example: "I Ate Only Pizza for 30 Days"
            },
            {
                // Structure: These [Things] Made Me So [Outcome] I [Ridiculous Consequence]
                check: (t) => /these\s+(.+)\s+made\s+me\s+so\s+(.+)\s+i\s+(.+)/i.test(t),
                format: (t) => `These [Effective Method/Principles] Made Me So [Desired Outcome] I [Ridiculous Statement That Only Makes Sense to Happen After Desired Outcome Achieved]`,
                example: "These Books Made Me So Good at Making Friends, I Wanna Be Lonely"
            },
            {
                // Structure: Give me [Time] and I'll [Make you] [Outcome]
                check: (t) => /give\s+me\s+(.+)\s+and\s+i\'ll\s+(.+)/i.test(t),
                format: (t) => `Give me [Time Period] and I'll [Make You/Turn You Into] [Dramatic Descriptor] [Desired Outcome/Identity]`,
                example: "Give me 10 Minutes and I'll Make You Dangerously Productive"
            },
            {
                // Structure: How [Identity] [Action]
                check: (t) => /how\s+(.+s)\s+(.+)/i.test(t) && !/how\s+i\s+/i.test(t) && !/how\s+to\s+/i.test(t),
                format: (t) => `How [Desired Identity] [Does Common Practice]`,
                example: "How Billionaires Find Time to Workout"
            },
            {
                // Structure: [Adjective] Truths That Give You [Benefit] in [Context]
                check: (t) => /(\w+)\s+truths\s+that\s+give\s+you\s+(.+)/i.test(t),
                format: (t) => `[Dramatic Adjective] Truths That Give You [Desired Benefit] in [Market/Situation/Topic]`,
                example: "Brutal Truths That Give You Unfair Advantage in Dating"
            },
            {
                // Structure: You're [Action] Wrong
                check: (t) => /you\'re\s+(\w+ing)\s+(.+)\s+wrong/i.test(t),
                format: (t) => `You're [Common Action] Wrong`,
                example: "You're Drinking Water Wrong"
            },
            {
                // Structure: How I [Action] [Topic] in [Time] ([Condition])
                check: (t) => /how i\s+(\w+)\s+(.+)\s+in\s+(\d+\s*\w+)/i.test(t),
                format: (t) => `How I [Creative Action] [Topic] in [Time Period] [Condition]`,
                example: "How I Built a $1M Business in 30 Days (Without Employees)"
            },
            {
                // Structure: If you're [Adjective] and in [Demographic], watch this
                check: (t) => /if you\'re\s+(\w+)\s+and\s+in\s+(.+),\s+(please\s+)?watch\s+this/i.test(t),
                format: (t) => `If You're [Adjective] and in [Specific Demographic], Please Watch This`,
                example: "If You're Broke and in Your 20s, Please Watch This"
            },
            {
                // Structure: Your biggest [Descriptive Noun] is [Statement]
                check: (t) => /your\s+biggest\s+(\w+)\s+is\s+(.+)/i.test(t),
                format: (t) => `Your Biggest [Descriptive Noun] is [Statement]`,
                example: "Your Biggest Enemy is Yourself"
            },
            {
                // Structure: Stop [Action] [Topic]
                check: (t) => /stop\s+(\w+ing)\s+(.+)/i.test(t),
                format: (t) => `Stop [Negative Action] [Topic]`,
                example: "Stop Wasting Your Life on Social Media"
            }
        ];

        this.fallbacks = [
            { regex: /\b(202\d|20\d\d)\b/g, replacement: '[Year]' },
            { regex: /\b(\d+)\s*(days|hours|minutes|weeks|months|years|seconds|sec|min)\b/gi, replacement: '[Time Period]' },
            { regex: /\b(stop|don\'t|never|avoid|mistake|worst|quit)\b/gi, replacement: '[Negative Command]' },
            { regex: /\b(how i|how to)\b/gi, replacement: '[How-To]' },
            { regex: /\b(build|make|create|design|craft|learn|master)\b/gi, replacement: '[Creative Action]' },
            { regex: /\b(business|money|wealth|offer|thumbnail|channel)\b/gi, replacement: '[Topic]' },
            { regex: /\b(millionaire|billionaire|ceo|founder|expert|pro)\b/gi, replacement: '[Authority Figure]' }
        ];

        // Diverse options for generation
        this.vocab = {
            'Topic': ['Fitness', 'Dating', 'Coding', 'Sales', 'Meditation', 'Public Speaking', 'Chess'],
            'Time Period': ['7 Days', '24 Hours', '1 Year', '30 Days', '10 Minutes'],
            'Authority Figure': ['Warren Buffet', 'ChatGPT', 'Google', 'My Mom', 'A Navy SEAL'],
            'Creative Action': ['Mastered', 'Destroyed', 'Fixed', 'Hacked', 'Automated'],
            'Negative Command': ['Stop', 'Never', 'Quit', 'Avoid', 'Don\'t'],
            'Desired Outcome': ['Financial Freedom', 'Six Pack Abs', 'Fluent Spanish', 'Viral Success'],
            'Common Negative Current State': ['Depressed', 'In Debt', 'Lonely', 'Overweight'],
            'Effective Method/Principles': ['These 3 Habits', 'This Ancient Rule', 'The 1% Method'],
            'Ridiculous Statement That Only Makes Sense to Happen After Desired Outcome Achieved': ['I Forgot My Own Name', 'I Had to Hire a Bodyguard', 'I Bought a Private Island'],
            'Desired Identity': ['Billionaires', 'Navy SEALs', 'Olympians', 'CEOs'],
            'Does Common Practice': ['Sleep 8 Hours', 'Eat Breakfast', 'Check Email', 'Meditate'],
            'Common Action': ['Drinking Water', 'Breathing', 'Sleeping', 'Walking'],
            'Dramatic Adjective': ['Brutal', 'Dark', 'Hidden', 'Uncomfortable'],
            'Desired Benefit': ['Unfair Advantage', 'Total Control', 'Infinite Energy'],
            'Market/Situation/Topic': ['in Dating', 'in Business', 'in Life', 'in 2025'],
            'Make You/Turn You Into': ['Make You', 'Turn You Into'],
            'Dramatic Descriptor': ['Dangerously', 'Insanely', 'Unstoppably'],
            'Extreme Action': ['Ate Only Pizza', 'Drank Only Water', 'Did 1000 Pushups', 'Code for 24 Hours']
        };
    }

    analyze(title) {
        let blueprint = title;
        let archetype = 'General';
        let example = null;

        // 1. Try Structural Matching first
        for (const s of this.structures) {
            if (s.check(title)) {
                blueprint = s.format(title);
                archetype = 'Structured Formula';
                example = s.example;
                break; // Found match
            }
        }

        // 2. Fallback to Slot Filling if no structure matched
        if (archetype === 'General') {
            for (const p of this.fallbacks) {
                blueprint = blueprint.replace(p.regex, p.replacement);
            }

            // CRITICAL: If the blueprint is still identical to the original, force generic replacement
            // This ensures we NEVER return the raw title as the blueprint
            if (blueprint === title) {
                // Aggressive replacement for common words to force a format
                blueprint = blueprint
                    .replace(/\b(I|Me|My)\b/g, '[Pronoun]')
                    .replace(/\b(How|Why|What)\b/g, '[Question]')
                    .replace(/[0-9]+/g, '[Number]');
            }
        }

        // 3. Generate a diverse example
        if (!example) {
            example = blueprint.replace(/\[(.*?)\]/g, (match, p1) => {
                // Try to find a random item from vocab
                const key = Object.keys(this.vocab).find(k => p1.includes(k) || k.includes(p1));
                if (key) {
                    const options = this.vocab[key];
                    return options[Math.floor(Math.random() * options.length)];
                }

                // Fallbacks for unknown slots
                if (p1.includes('Year')) return '2025';
                return 'Something';
            });
        }

        return {
            original: title,
            blueprint: blueprint.trim(),
            archetype,
            example
        };
    }
}
