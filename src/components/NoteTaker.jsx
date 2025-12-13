import React, { useState } from 'react';
import { Youtube, FileText, CheckSquare, Square, Loader2, ArrowRight, BookOpen, Copy, Check, AlertCircle } from 'lucide-react';
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

    // Mock data for channel videos - tailored to look professional/agency related
    const generateMockChannelVideos = (channelName) => {
        const baseVideos = [
            { title: "How to Scale Your Agency to $100k/mo", views: "125K" },
            { title: "The Secret to High Ticket Sales", views: "89K" },
            { title: "Client Acquisition Systems That Work", views: "210K" },
            { title: "Stop Doing This If You Want To Grow", views: "45K" },
            { title: "My Full Productivity Workflow", views: "320K" },
            { title: "The Truth About AI Automation", views: "150K" },
            { title: "Why Most Agencies Fail", views: "78K" },
            { title: "Building a Personal Brand in 2024", views: "95K" },
            { title: "Cold Email Masterclass", views: "67K" },
            { title: "How to Hire A-Players", views: "42K" }
        ];

        return baseVideos.map((video, i) => ({
            id: `mock_vid_${i}`,
            title: video.title,
            duration: `${Math.floor(Math.random() * 20) + 5}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
            date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString(),
            thumbnail: `https://img.youtube.com/vi/${['P5yE9wUaH2U', '9PYGGN_IgNQ', 'v2wQx8_000s', 'rCgXy7m159M', 'n_A7p1B-n_Q'][i % 5]}/mqdefault.jpg`,
            author: channelName || "Channel Name"
        }));
    };

    const extractVideoId = (inputUrl) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = inputUrl.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const fetchVideoDetails = async (videoUrl) => {
        try {
            // Use noembed to get video title without API key
            const response = await fetch(`https://noembed.com/embed?url=${videoUrl}`);
            const data = await response.json();

            if (data.error) throw new Error(data.error);

            return {
                title: data.title,
                author: data.author_name,
                thumbnail: data.thumbnail_url
            };
        } catch (err) {
            console.error("Failed to fetch video details:", err);
            return null;
        }
    };

    const handleFetch = async () => {
        if (!url) return;
        setIsFetching(true);
        setVideos([]);
        setSelectedVideos([]);
        setNotes('');
        setError('');

        try {
            if (url.includes('channel') || url.includes('@')) {
                setMode('channel');
                // Simulate fetching channel videos
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Extract channel name for better mock data
                const channelName = url.split('/').pop().replace('@', '');
                setVideos(generateMockChannelVideos(channelName));
            } else {
                setMode('video');
                const videoId = extractVideoId(url);

                if (videoId) {
                    // Try to fetch real details
                    const details = await fetchVideoDetails(url);

                    setVideos([{
                        id: videoId,
                        title: details ? details.title : 'Video Title (Could not fetch)',
                        duration: '10:00', // Placeholder as noembed doesn't return duration
                        date: new Date().toLocaleDateString(),
                        thumbnail: details ? details.thumbnail : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                        author: details ? details.author : 'Unknown Channel'
                    }]);
                    setSelectedVideos([videoId]);
                } else {
                    setError('Invalid YouTube URL');
                }
            }
        } catch (err) {
            setError('Failed to fetch video. Please check the URL.');
        } finally {
            setIsFetching(false);
        }
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

        const mainVideo = videos.find(v => v.id === selectedVids[0]);
        const title = mainVideo ? mainVideo.title : "Selected Video";
        const author = mainVideo ? mainVideo.author : "Unknown Creator";

        const prompt = `You are an expert note-taker and content synthesizer. 
        I need comprehensive notes for a YouTube video titled "${title}" by "${author}".
        
        Since I cannot provide the full transcript right now, please generate a high-quality, structured summary based on what is typically covered in a video with this specific title and by this creator (if known).
        
        Infer the likely key points, strategies, and actionable advice.
        
        Format the output in clean Markdown. YOU MUST FOLLOW THIS EXACT STRUCTURE:

        # Key Takeaways (TL;DR)
        [Provide a bulleted list of the 3 most critical insights. Make this section stand out.]

        # Executive Summary
        [A concise paragraph summarizing the video's core message and value proposition.]

        # Core Concepts & Frameworks
        [Detail the main ideas. Use bolding for key terms.]

        # Actionable Steps
        [A checklist of things the viewer can implement immediately.]

        # Notable Quotes
        > [Include 1-2 powerful, hypothetical quotes that capture the essence.]
        
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

            return generatedText;

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
            'Analyzing video metadata...',
            'Identifying key themes...',
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

            {/* Input Section */}
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Youtube className="text-[#52525b] w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Paste YouTube Video or Channel URL..."
                            className="w-full bg-[#050505] border border-white/10 rounded-xl pl-14 pr-4 py-4 text-white focus:outline-none focus:border-[#ff982b] transition-colors"
                            onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                        />
                    </div>
                    <button
                        onClick={handleFetch}
                        disabled={!url || isFetching}
                        className="px-6 py-4 bg-gradient-to-r from-[#ff982b] to-[#ffc972] text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(255,152,43,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[80px]"
                    >
                        {isFetching ? <Loader2 className="animate-spin w-6 h-6" /> : <ArrowRight className="w-6 h-6" />}
                    </button>
                </div>
                {error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}
            </div>

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
                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex gap-3 group ${selectedVideos.includes(video.id)
                                        ? 'bg-[#ff982b]/10 border-[#ff982b] shadow-[0_0_15px_rgba(255,152,43,0.1)]'
                                        : 'bg-[#0a0a0a] border-white/5 hover:border-white/20'
                                        }`}
                                >
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
