import React, { useState } from 'react';
import { Youtube, FileText, CheckSquare, Square, Loader2, ArrowRight, BookOpen, Copy, Check, AlertCircle, ClipboardPaste, Settings, X } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const NoteTaker = () => {
    const [url, setUrl] = useState('');
    const [mode, setMode] = useState('video'); // 'video' or 'channel'
    const [videos, setVideos] = useState([]);
    const [selectedVideos, setSelectedVideos] = useState([]);
    const [isFetching, setIsFetching] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [notes, setNotes] = useState('');
    const [progress, setProgress] = useState('');
    const [copied, setCopied] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');
    const [manualTranscript, setManualTranscript] = useState('');
    const [showManualInput, setShowManualInput] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [tempApiKey, setTempApiKey] = useState(localStorage.getItem('google_api_key') || '');

    const handleSaveSettings = () => {
        localStorage.setItem('google_api_key', tempApiKey);
        setShowSettings(false);
    };



    const extractVideoId = (inputUrl) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = inputUrl.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const extractAllVideoIds = (text) => {
        if (!text) return [];
        const urls = text.match(/\bhttps?:\/\/\S+/gi) || [];
        const ids = new Set();

        // Check the raw text first for any single ID if no URLs found (fallback)
        const singleId = extractVideoId(text);
        if (singleId) ids.add(singleId);

        // Process all found URLs
        urls.forEach(url => {
            const id = extractVideoId(url);
            if (id) ids.add(id);
        });

        return Array.from(ids);
    };

    const handleFetch = async (urlOverride) => {
        const inputUrl = typeof urlOverride === 'string' ? urlOverride : url;
        if (!inputUrl) return;

        setIsFetching(true);
        setError('');
        setShowManualInput(false);
        setManualTranscript('');

        try {
            // Check for channel URL first
            if (inputUrl.includes('channel') || inputUrl.includes('@') || inputUrl.includes('/c/') || inputUrl.includes('/user/')) {
                setMode('channel');
                setVideos([]); // Clear existing for channel fetch
                setSelectedVideos([]);

                const response = await fetch(`/api/channel?url=${encodeURIComponent(inputUrl)}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch channel videos');
                }

                const channelVideos = await response.json();
                if (channelVideos.length === 0) {
                    throw new Error('No videos found for this channel');
                }

                setVideos(channelVideos);
                setUrl(''); // Clear input
            } else {
                setMode('video');
                const videoIds = extractAllVideoIds(inputUrl);

                if (videoIds.length > 0) {
                    const newVideos = [];
                    const newSelected = [];

                    // Filter out IDs that are already in the list
                    const uniqueIds = videoIds.filter(id => !videos.some(v => v.id === id));

                    if (uniqueIds.length === 0 && videoIds.length > 0) {
                        setError('Video(s) already added.');
                        setIsFetching(false);
                        setUrl('');
                        return;
                    }

                    // Process all videos in parallel
                    await Promise.all(uniqueIds.map(async (videoId) => {
                        try {
                            // Fetch real details using our robust metadata endpoint
                            const response = await fetch(`/api/metadata?videoId=${videoId}`);
                            if (!response.ok) throw new Error('Failed to fetch metadata');

                            const details = await response.json();
                            newVideos.push({
                                id: videoId,
                                title: details.title,
                                duration: details.duration,
                                date: new Date().toLocaleDateString(),
                                thumbnail: details.thumbnail,
                                author: details.author
                            });
                            newSelected.push(videoId);
                        } catch (e) {
                            console.error(`Metadata fetch failed for ${videoId}, falling back to noembed:`, e);
                            try {
                                const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
                                const data = await response.json();
                                newVideos.push({
                                    id: videoId,
                                    title: data.title || 'Video Title',
                                    duration: '??:??',
                                    date: new Date().toLocaleDateString(),
                                    thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                                    author: data.author_name || 'Unknown Channel'
                                });
                                newSelected.push(videoId);
                            } catch (fallbackErr) {
                                console.error(`Fallback failed for ${videoId}`, fallbackErr);
                            }
                        }
                    }));

                    if (newVideos.length > 0) {
                        setVideos(prev => [...prev, ...newVideos]);
                        setSelectedVideos(prev => [...prev, ...newSelected]);
                        setUrl(''); // Clear input on success
                    } else {
                        setError('Could not fetch details for any of the provided videos.');
                    }
                } else {
                    setError('Invalid YouTube URL(s)');
                }
            }
        } catch (err) {
            setError('Failed to fetch videos. Please check the URLs.');
        } finally {
            setIsFetching(false);
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        if (pastedData) {
            // Allow the paste to update the input value visually (default behavior), 
            // but trigger the fetch with the pasted data immediately.
            // We set the URL state to the pasted data to ensure sync if handleFetch needs it,
            // but we pass pastedData explicitly to handleFetch to avoid race conditions.
            setUrl(pastedData);
            handleFetch(pastedData);
        }
    };

    const removeVideo = (id) => {
        setVideos(prev => prev.filter(v => v.id !== id));
        setSelectedVideos(prev => prev.filter(v => v !== id));
    };

    const toggleVideoSelection = (id) => {
        if (selectedVideos.includes(id)) {
            setSelectedVideos(prev => prev.filter(v => v !== id));
        } else {
            setSelectedVideos(prev => [...prev, id]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedVideos.length === videos.length) {
            setSelectedVideos([]);
        } else {
            setSelectedVideos(videos.map(v => v.id));
        }
    };

    const generateNotesWithGemini = async (selectedVids) => {
        const apiKey = localStorage.getItem('google_api_key');
        if (!apiKey) {
            return "## Error: API Key Missing\n\nPlease add your Google API Key in the settings to generate AI notes.";
        }

        let combinedTranscript = "";
        let failedVideos = [];

        // Process all selected videos
        for (const vidId of selectedVids) {
            const video = videos.find(v => v.id === vidId);
            if (!video) continue;

            // Skip mock videos for now unless we have a way to get their transcript
            if (vidId.startsWith('mock_')) continue;

            try {
                console.log(`Fetching transcript for videoId: ${vidId}`);
                const transcriptRes = await fetch(`/api/transcript?videoId=${vidId}`);

                if (transcriptRes.ok) {
                    const transcriptData = await transcriptRes.json();
                    combinedTranscript += `\n\n=== VIDEO START: "${video.title}" by ${video.author} ===\n${transcriptData.transcript}\n=== VIDEO END ===\n`;
                } else {
                    console.warn(`Transcript fetch failed for ${vidId}:`, await transcriptRes.text());
                    failedVideos.push(video.title);
                }
            } catch (e) {
                console.warn(`Could not fetch transcript for ${vidId}:`, e);
                failedVideos.push(video.title);
            }
        }

        // If manual transcript is provided, append it as well (useful for fallbacks or extra context)
        if (manualTranscript) {
            combinedTranscript += `\n\n=== MANUAL TRANSCRIPT / EXTRA CONTEXT ===\n${manualTranscript}\n=== END MANUAL CONTEXT ===\n`;
        }

        if (!combinedTranscript.trim()) {
            setShowManualInput(true);
            return "## Error: No Transcripts Available\n\nCould not retrieve transcripts for the selected videos. Please paste the transcript manually in the box below and try again.";
        }

        const prompt = `You are an expert note-taker and content synthesizer. 
            I need comprehensive, combined notes for the following video(s).
            
            Here is the TRANSCRIPT content (potentially from multiple videos):
            """
            ${combinedTranscript}
            """
            
            Based on this content, generate a high-quality, structured summary.
            If there are multiple videos, synthesize the information into a single cohesive narrative, removing overlaps and highlighting unique insights from each where relevant. Build upon the concepts to create a masterclass-level summary.
            
            Format the output in clean Markdown. YOU MUST FOLLOW THIS EXACT STRUCTURE:

            # Key Takeaways (TL;DR)
            [Provide a bulleted list of the 3-5 most critical insights across all content. Make this section stand out.]

            # Executive Summary
            [A concise paragraph summarizing the core messages and value proposition of the combined content.]

            # Core Concepts & Frameworks
            [Detail the main ideas. Use bolding for key terms. Group related concepts together.]

            # Actionable Steps
            [A checklist of things the viewer can implement immediately.]

            # Notable Quotes
            > [Include powerful quotes directly from the transcripts.]
            
            Tone: Professional, insightful, and action-oriented. Use formatting (bolding, lists) to make it highly readable.`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!generatedText) {
                throw new Error("Failed to generate content");
            }

            let finalText = generatedText;
            if (failedVideos.length > 0) {
                finalText = `> [!WARNING]\n> Failed to fetch transcripts for: ${failedVideos.join(', ')}. Notes are based on successfully retrieved content only.\n\n` + finalText;
            }

            return finalText;

        } catch (error) {
            console.error("Gemini Generation Error:", error);
            return "## Error: Generation Failed\n\nCould not generate notes at this time. Please try again later.";
        }
    };

    const handleGenerate = async () => {
        if (selectedVideos.length === 0) return;
        setIsGenerating(true);
        setNotes('');

        const steps = [
            'Fetching transcript...',
            'Analyzing content...',
            'Synthesizing insights...',
            'Formatting with AI...'
        ];

        // Start the generation in the background while showing progress
        const generationPromise = generateNotesWithGemini(selectedVideos);

        for (const step of steps) {
            setProgress(step);
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        const generatedNotes = await generationPromise;
        setNotes(generatedNotes);
        setIsGenerating(false);
        setProgress('');
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(notes);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Pagination Logic
    const currentPage = 1; // Simplified for now
    const videosPerPage = 100;
    const currentVideos = videos.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="h-full flex flex-col gap-6 max-w-5xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <BookOpen className="text-[#ff982b]" />
                    Note Taker
                </h2>
                <p className="text-[#a1a1aa]">Turn YouTube videos and channels into comprehensive, synthesized notes.</p>
            </div>

            {/* Global Settings Button (FAB) */}
            <button
                onClick={() => setShowSettings(true)}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#1e1e1e]/80 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center shadow-lg hover:scale-110 hover:bg-white hover:text-black hover:shadow-[0_8px_30px_rgba(255,255,255,0.2)] transition-all duration-300 z-50"
                title="Settings"
            >
                <Settings className="w-6 h-6" />
            </button>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-[#ff982b]" />
                            Settings
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#a1a1aa] mb-1">
                                    Google API Key (Gemini)
                                </label>
                                <input
                                    type="password"
                                    value={tempApiKey}
                                    onChange={(e) => setTempApiKey(e.target.value)}
                                    placeholder="Enter your API Key..."
                                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff982b] transition-colors"
                                />
                                <p className="text-xs text-[#52525b] mt-2">
                                    Required for AI note generation. Your key is stored locally in your browser.
                                </p>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="px-4 py-2 text-[#a1a1aa] hover:text-white font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveSettings}
                                    className="px-6 py-2 bg-[#ff982b] text-black font-bold rounded-lg hover:bg-[#ffc972] transition-colors"
                                >
                                    Save Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Input Section */}
            <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            id="youtube-url-input"
                            name="youtube-url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onPaste={handlePaste}
                            placeholder="Paste YouTube Video URL..."
                            className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#ff982b] transition-colors"
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleFetch()}
                        />
                    </div>
                    <button
                        onClick={() => handleFetch()}
                        disabled={!url || isFetching}
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center shadow-[0_0_20px_rgba(255,152,43,0.3)] hover:scale-110 transition-transform cursor-pointer group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0"
                    >
                        {isFetching ? (
                            <Loader2 className="animate-spin w-5 h-5 text-black relative z-10" />
                        ) : (
                            <ArrowRight className="w-6 h-6 text-[#050505] relative z-10" strokeWidth={2.5} />
                        )}
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-0 group-hover:duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    </button>
                </div>
                {error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}
            </div>

            {/* Manual Transcript Fallback */}
            {showManualInput && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#121212] border border-orange-500/30 rounded-2xl p-6 flex flex-col gap-4"
                >
                    <div className="flex items-center gap-2 text-orange-400">
                        <AlertCircle className="w-5 h-5" />
                        <h3 className="font-bold">Transcript Unavailable</h3>
                    </div>
                    <p className="text-sm text-[#a1a1aa]">
                        We couldn't automatically fetch the transcript for this video. Please paste the transcript manually below to generate notes.
                    </p>
                    <div className="relative">
                        <div className="absolute top-3 left-3 pointer-events-none">
                            <ClipboardPaste className="text-[#52525b] w-5 h-5" />
                        </div>
                        <textarea
                            id="manual-transcript-input"
                            name="manual-transcript"
                            value={manualTranscript}
                            onChange={(e) => setManualTranscript(e.target.value)}
                            placeholder="Paste transcript text here..."
                            className="w-full h-40 bg-[#050505] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#ff982b] transition-colors resize-none font-mono text-sm"
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={handleGenerate}
                            disabled={!manualTranscript || isGenerating}
                            className="px-6 py-2 bg-[#ff982b] text-black font-bold rounded-lg hover:bg-[#ffc972] transition-colors disabled:opacity-50"
                        >
                            Generate with Manual Transcript
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Content Area */}
            {videos.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                    {/* Video List */}
                    <div className="lg:col-span-1 bg-[#121212] border border-white/10 rounded-2xl p-4 flex flex-col h-full overflow-hidden">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="font-bold text-white">Videos Found ({videos.length})</h3>
                            {mode === 'channel' && (
                                <button
                                    onClick={toggleSelectAll}
                                    className="text-xs text-[#ff982b] hover:text-[#ffc972] font-medium"
                                >
                                    {selectedVideos.length === videos.length ? 'Deselect All' : 'Select All'}
                                </button>
                            )}
                        </div>

                        {/* Search Bar */}
                        <div className="px-2 mb-3">
                            <input
                                type="text"
                                id="video-search-input"
                                name="video-search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search videos..."
                                className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff982b] transition-colors"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {currentVideos.map((video) => (
                                <div
                                    key={video.id}
                                    onClick={() => toggleVideoSelection(video.id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex gap-3 group relative ${selectedVideos.includes(video.id)
                                        ? 'bg-[#ff982b]/10 border-[#ff982b] shadow-[0_0_15px_rgba(255,152,43,0.1)]'
                                        : 'bg-[#0a0a0a] border-white/5 hover:border-white/20'
                                        }`}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeVideo(video.id);
                                        }}
                                        className="absolute -top-2 -right-2 bg-[#121212] border border-white/20 text-[#a1a1aa] hover:text-red-400 hover:border-red-400 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all z-10 shadow-lg"
                                        title="Remove video"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                    <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                        <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">
                                            {video.duration}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                        <div>
                                            <h4 className={`text-sm font-medium truncate leading-tight ${selectedVideos.includes(video.id) ? 'text-[#ff982b]' : 'text-white group-hover:text-white/90'}`}>
                                                {video.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1 text-[10px] text-[#71717a]">
                                                <span>{video.date}</span>
                                                <span>•</span>
                                                <span>{video.duration}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {selectedVideos.includes(video.id) ? (
                                                <CheckSquare className="w-4 h-4 text-[#ff982b]" />
                                            ) : (
                                                <Square className="w-4 h-4 text-[#52525b]" />
                                            )}
                                            <span className="text-xs text-[#52525b]">Select</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto pt-4 border-t border-white/10 flex flex-col items-center gap-2">
                            <button
                                onClick={handleGenerate}
                                disabled={selectedVideos.length === 0 || isGenerating}
                                className="w-16 h-16 bg-gradient-to-r from-[#ff982b] to-[#ffc972] text-black font-bold rounded-full hover:shadow-[0_0_20px_rgba(255,152,43,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center hover:scale-105 active:scale-95"
                                title="Generate Notes"
                            >
                                {isGenerating ? (
                                    <Loader2 className="animate-spin w-8 h-8" />
                                ) : (
                                    <FileText className="w-8 h-8" />
                                )}
                            </button>
                            <span className="text-xs text-[#52525b] font-medium">
                                {selectedVideos.length} video{selectedVideos.length !== 1 ? 's' : ''} selected
                            </span>
                        </div>
                    </div>

                    {/* Notes Output */}
                    <div className="lg:col-span-2 bg-[#121212] border border-white/10 rounded-2xl p-6 flex flex-col h-full overflow-hidden relative">
                        {isGenerating && (
                            <div className="absolute inset-0 bg-[#121212]/90 z-10 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                                <Loader2 className="w-12 h-12 text-[#ff982b] animate-spin" />
                                <p className="text-white font-medium animate-pulse">{progress}</p>
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-white">Generated Notes</h3>
                            {notes && (
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#a1a1aa] hover:text-white transition-colors text-xs font-medium"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? 'Copied' : 'Copy Text'}
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto bg-[#050505] rounded-xl p-6 border border-white/5 font-mono text-sm leading-relaxed text-[#d4d4d8] custom-scrollbar">
                            {notes ? (
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-[#ff982b] mb-4 mt-6 border-b border-[#ff982b]/20 pb-2" {...props} />,
                                            h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-white mb-3 mt-6 flex items-center gap-2" {...props} />,
                                            h3: ({ node, ...props }) => <h3 className="text-lg font-medium text-[#ffc972] mb-2 mt-4" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-2 mb-4 text-[#d4d4d8]" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-2 mb-4 text-[#d4d4d8]" {...props} />,
                                            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-[#ff982b] pl-4 py-1 my-4 bg-[#ff982b]/5 rounded-r italic text-[#a1a1aa]" {...props} />,
                                            strong: ({ node, ...props }) => <strong className="text-white font-bold" {...props} />,
                                            p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
                                        }}
                                    >
                                        {notes}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-[#52525b] gap-3">
                                    <FileText className="w-12 h-12 opacity-20" />
                                    <p>Select videos and click generate to create notes.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NoteTaker;
