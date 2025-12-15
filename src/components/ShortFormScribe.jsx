import React, { useState } from 'react';
import { Edit3, Sparkles, Zap, Copy, Check, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const ShortFormScribe = () => {
    const [script, setScript] = useState('');
    const [optimizedScript, setOptimizedScript] = useState('');
    const [hooks, setHooks] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [copiedScript, setCopiedScript] = useState(false);
    const [error, setError] = useState('');

    // --- Logic: Client-Side Optimization ---
    const handleOptimize = () => {
        setIsOptimizing(true);
        setError('');

        // 1. Replace Plural with "You"
        // Regex looks for common plural addressing terms
        let newScript = script.replace(/\b(everyone|people|y'all|guys|folks|everybody)\b/gi, "you");

        // 2. Highlight changes (simple for now, just text replacement)
        // In a more advanced version, we could wrap changes in spans for highlighting

        setOptimizedScript(newScript);
        setIsOptimizing(false);
    };

    // --- Logic: AI Hook Generation ---
    const generateHooks = async () => {
        if (!script) return;
        setIsGeneratingHooks(true);
        setError('');

        const apiKey = localStorage.getItem('google_api_key');
        if (!apiKey) {
            setError('API Key Missing. Please add your Google API Key in Settings.');
            setIsGeneratingHooks(false);
            return;
        }

        const prompt = `
            You are a viral short-form content expert.
            Generate 4 viral hooks for the following script.
            The hooks must be punchy, curiosity-inducing, and under 3 seconds to say.
            
            Script:
            "${script}"
            
            Format output as a simple JSON array of strings: ["Hook 1", "Hook 2", "Hook 3", "Hook 4"]
        `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            // Attempt to parse JSON from the response (it might be wrapped in markdown code blocks)
            const jsonMatch = text.match(/\[.*\]/s);
            if (jsonMatch) {
                setHooks(JSON.parse(jsonMatch[0]));
            } else {
                // Fallback if not valid JSON
                setHooks([text]);
            }
        } catch (err) {
            console.error("Hook Generation Error:", err);
            setError('Failed to generate hooks. Please try again.');
        } finally {
            setIsGeneratingHooks(false);
        }
    };

    // --- Logic: AI Analysis ---
    const analyzeScript = async () => {
        if (!script) return;
        setIsAnalyzing(true);
        setError('');

        const apiKey = localStorage.getItem('google_api_key');
        if (!apiKey) {
            setError('API Key Missing. Please add your Google API Key in Settings.');
            setIsAnalyzing(false);
            return;
        }

        const prompt = `
            Analyze this short-form script for "Value Density" and "Power Words".
            
            Script:
            "${script}"
            
            Provide a brief analysis in Markdown format:
            1. **Value Density Score**: (1-10)
            2. **Power Words Found**: List them.
            3. **Suggestions**: 1-2 sentences on how to make it punchier.
        `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            setAnalysis(text);
        } catch (err) {
            console.error("Analysis Error:", err);
            setError('Failed to analyze script.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedScript(true);
        setTimeout(() => setCopiedScript(false), 2000);
    };

    return (
        <div className="h-full flex flex-col gap-6 max-w-6xl mx-auto w-full p-4">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Edit3 className="text-[#ff982b]" />
                    ShortForm Scribe
                </h2>
                <p className="text-[#a1a1aa]">Optimize your scripts for maximum retention and engagement.</p>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                {/* Left Column: Input & Controls */}
                <div className="flex flex-col gap-4 h-full">
                    <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 flex-1 flex flex-col">
                        <label className="text-xs font-medium text-[#52525b] uppercase tracking-wider mb-2 block">Original Script</label>
                        <textarea
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                            placeholder="Paste your script here..."
                            className="flex-1 w-full bg-[#050505] border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#ff982b] transition-colors resize-none font-mono text-sm leading-relaxed"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={handleOptimize}
                            disabled={!script || isOptimizing}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                            {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Optimize
                        </button>
                        <button
                            onClick={generateHooks}
                            disabled={!script || isGeneratingHooks}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#ff982b]/10 hover:bg-[#ff982b]/20 text-[#ff982b] border border-[#ff982b]/20 rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                            {isGeneratingHooks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Gen Hooks
                        </button>
                        <button
                            onClick={analyzeScript}
                            disabled={!script || isAnalyzing}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            Analyze
                        </button>
                    </div>
                </div>

                {/* Right Column: Output */}
                <div className="flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pr-2">

                    {/* Optimized Script Output */}
                    {optimizedScript && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#121212] border border-white/10 rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    Optimized Script
                                </h3>
                                <button
                                    onClick={() => handleCopy(optimizedScript)}
                                    className="text-xs text-[#a1a1aa] hover:text-white flex items-center gap-1"
                                >
                                    {copiedScript ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    {copiedScript ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <div className="bg-[#050505] rounded-xl p-4 text-[#d4d4d8] text-sm font-mono whitespace-pre-wrap leading-relaxed border border-white/5">
                                {optimizedScript}
                            </div>
                        </motion.div>
                    )}

                    {/* Hooks Output */}
                    {hooks.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-[#121212] border border-[#ff982b]/20 rounded-2xl p-6"
                        >
                            <h3 className="font-bold text-[#ff982b] mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Viral Hooks
                            </h3>
                            <div className="space-y-3">
                                {hooks.map((hook, i) => (
                                    <div key={i} className="bg-[#ff982b]/5 border border-[#ff982b]/10 p-3 rounded-lg text-white text-sm flex justify-between items-center group">
                                        <span>{hook}</span>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(hook)}
                                            className="opacity-0 group-hover:opacity-100 text-[#ff982b] hover:text-white transition-opacity"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Analysis Output */}
                    {analysis && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-[#121212] border border-purple-500/20 rounded-2xl p-6"
                        >
                            <h3 className="font-bold text-purple-400 mb-4 flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                Script Analysis
                            </h3>
                            <div className="prose prose-invert prose-sm max-w-none text-[#d4d4d8]">
                                <ReactMarkdown>{analysis}</ReactMarkdown>
                            </div>
                        </motion.div>
                    )}

                    {!optimizedScript && !hooks.length && !analysis && (
                        <div className="h-full flex flex-col items-center justify-center text-[#52525b] border border-dashed border-white/10 rounded-2xl bg-[#121212]/50">
                            <Edit3 className="w-12 h-12 opacity-20 mb-4" />
                            <p>Enter a script and choose an action to see results.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShortFormScribe;
