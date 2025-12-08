import React, { useState } from 'react';
import { Youtube, FileText, CheckSquare, Square, Loader2, ArrowRight, BookOpen, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const NoteTaker = () => {
    const [url, setUrl] = useState('');
    console.log("NoteTaker v3 loaded");
    const [mode, setMode] = useState('video'); // 'video' or 'channel'
    const [videos, setVideos] = useState([]);
    const [selectedVideos, setSelectedVideos] = useState([]);
    const [isFetching, setIsFetching] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [notes, setNotes] = useState('');
    const [progress, setProgress] = useState('');
    const [copied, setCopied] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Mock data for channel videos since we can't really fetch channel videos without API key/backend
    const generateMockVideos = () => {
        const videoMapping = [
            { title: "How to Scale Your Agency to $100k/mo", id: "P5yE9wUaH2U" },
            { title: "The Secret to High Ticket Sales", id: "9PYGGN_IgNQ" },
            { title: "Client Acquisition Systems That Work", id: "v2wQx8_000s" },
            { title: "Stop Doing This If You Want To Grow", id: "rCgXy7m159M" },
            { title: "My Full Productivity Workflow", id: "n_A7p1B-n_Q" },
            { title: "The Truth About AI Automation", id: "0h9Vz4Z8f_g" }, // Keeping this as placeholder if no better match found, or use a generic one
            { title: "Why Most Agencies Fail", id: "M7lc1UVf-VE" }, // Keeping placeholder
            { title: "Building a Personal Brand in 2024", id: "sT6kF5H0j8I" }, // Keeping placeholder
            { title: "Cold Email Masterclass", id: "JsdGTNssgcI" },
            { title: "How to Hire A-Players", id: "1ebuu0KLRfk" }, // Updated
            { title: "The Ultimate Sales Script", id: "KPM78PmkobM" },
            { title: "Content Creation Strategy", id: "9bZkp7q19f0" }, // Keeping placeholder
            { title: "From $0 to $10k in 30 Days", id: "dQw4w9WgXcQ" }, // Keeping placeholder
            { title: "Mindset Shift for Success", id: "j4uG2u-qjX0" },
            { title: "Automating Your Business", id: "L_jWHffIx5E" } // Keeping placeholder
        ];

        return videoMapping.map((video, i) => ({
            id: `vid_${i}`,
            title: video.title,
            duration: `${Math.floor(Math.random() * 20) + 5}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
            thumbnail: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`
        }));
    };

    const MOCK_CHANNEL_VIDEOS = generateMockVideos();
    const [currentPage, setCurrentPage] = useState(1);
    const videosPerPage = 5;

    const extractVideoId = (inputUrl) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = inputUrl.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleFetch = async () => {
        if (!url) return;
        setIsFetching(true);
        setVideos([]);
        setSelectedVideos([]);
        setNotes('');

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (url.includes('channel') || url.includes('@')) {
            setMode('channel');
            setVideos(MOCK_CHANNEL_VIDEOS);
        } else {
            setMode('video');
            const videoId = extractVideoId(url);
            if (videoId) {
                setVideos([{
                    id: videoId,
                    title: 'Extracted Video Title', // In real app, fetch title
                    duration: '10:00',
                    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                }]);
                setSelectedVideos([videoId]);
            } else {
                alert('Invalid YouTube URL');
            }
        }
        setIsFetching(false);
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

    const handleGenerate = async () => {
        if (selectedVideos.length === 0) return;
        setIsGenerating(true);
        setNotes('');

        const steps = [
            'Extracting transcripts...',
            'Analyzing content...',
            'Identifying key themes...',
            'Synthesizing notes...',
            'Formatting output...'
        ];

        for (const step of steps) {
            setProgress(step);
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        // Mock Generated Notes
        const mockNotes = `# Comprehensive Notes

## Executive Summary
This collection of videos focuses on scaling agencies, high-ticket sales, and productivity systems. The core message is that systematic client acquisition combined with disciplined workflow management is the key to breaking past revenue plateaus.

## Key Themes & Insights

### 1. Agency Scaling Systems
- **The "Flywheel" Effect**: Consistency in outreach leads to compounding results over time.
- **Delegation**: You cannot scale if you are doing everything. Hire for your weaknesses.
- **SOPs**: Standard Operating Procedures are the backbone of a scalable business.

### 2. High Ticket Sales Psychology
- **Value over Price**: Clients buy the transformation, not the deliverables.
- **The "Gap"**: Identify where they are vs. where they want to be. Your service is the bridge.
- **Objection Handling**: Treat objections as requests for more information, not rejections.

### 3. Productivity & Workflow
- **Time Blocking**: Dedicate specific blocks of time to deep work.
- **Eliminate Distractions**: Turn off notifications during deep work sessions.
- **Review**: Weekly reviews of what worked and what didn't are crucial for improvement.

## Actionable Takeaways
1. [ ] Create SOPs for your top 3 recurring tasks.
2. [ ] Audit your time usage for one week to identify waste.
3. [ ] Refine your sales script to focus more on the client's desired outcome.
4. [ ] Implement a daily "deep work" block of at least 2 hours.

## Conclusion
Success in this domain is less about finding a "magic bullet" and more about executing fundamentals with extreme consistency and high quality.
`;

        setNotes(mockNotes);
        setIsGenerating(false);
        setProgress('');
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(notes);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Pagination Logic
    const indexOfLastVideo = currentPage * videosPerPage;
    const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
    const currentVideos = videos.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(indexOfFirstVideo, indexOfLastVideo);
    const totalPages = Math.ceil(videos.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase())).length / videosPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
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
                                        <h4 className={`text-sm font-medium truncate leading-tight ${selectedVideos.includes(video.id) ? 'text-[#ff982b]' : 'text-white group-hover:text-white/90'}`}>
                                            {video.title}
                                        </h4>
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

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-3 mb-3">
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 bg-[#0a0a0a] border border-white/10 rounded text-xs text-white disabled:opacity-50"
                                >
                                    Prev
                                </button>
                                <span className="text-xs text-[#a1a1aa] flex items-center">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 bg-[#0a0a0a] border border-white/10 rounded text-xs text-white disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}

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
                                <div className="whitespace-pre-wrap">{notes}</div>
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
