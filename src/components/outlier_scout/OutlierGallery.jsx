import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { Search, Filter, RefreshCw, Trash2, ExternalLink, Database } from 'lucide-react';

const OutlierGallery = () => {
    const [outliers, setOutliers] = useState([]);
    const [search, setSearch] = useState('');
    const [minScore, setMinScore] = useState(1.5);
    const [channelUrl, setChannelUrl] = useState('');
    const [isScouting, setIsScouting] = useState(false);
    const [sortBy, setSortBy] = useState('score'); // 'score' | 'views'
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [debugError, setDebugError] = useState(null);
    const observerTarget = useRef(null);

    const PAGE_SIZE = 24;

    const fetchOutliers = async (isLoadMore = false) => {
        if (!isLoadMore) setLoading(true);

        if (!supabase) {
            setLoading(false);
            return;
        }

        try {
            let query = supabase
                .from('os_outliers')
                .select('*')
                .gte('outlier_score', minScore);

            // Apply Search
            if (search) {
                query = query.ilike('title', `%${search}%`);
            }

            // Apply Sort
            if (sortBy === 'score') {
                query = query.order('outlier_score', { ascending: false });
            } else {
                query = query.order('views', { ascending: false });
            }
            // Apply Pagination
            const from = (isLoadMore ? page + 1 : 0) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            query = query.range(from, to);

            const { data, error } = await query;

            if (error) throw error;

            if (isLoadMore) {
                setOutliers(prev => [...prev, ...(data || [])]);
                setPage(prev => prev + 1);
            } else {
                setOutliers(data || []);
                setPage(0);
            }

            setHasMore(data?.length === PAGE_SIZE);

        } catch (error) {
            console.error('Error fetching outliers:', error);
            setDebugError(error);
        } finally {
            setLoading(false);
        }
    };

    // Infinite Scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    fetchOutliers(true);
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore, loading, page]);

    // Debounce search and filter changes
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOutliers(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, minScore, sortBy]);

    const handleScout = async () => {
        if (!channelUrl) return;
        setIsScouting(true);
        setProgress(10);

        // Simulate progress
        const interval = setInterval(() => {
            setProgress(p => p < 90 ? p + 5 : p);
        }, 500);

        try {
            // Add to queue (Channels table)
            if (supabase) {
                const { error } = await supabase
                    .from('os_channels')
                    .upsert([{ url: channelUrl, last_scouted: null }], { onConflict: 'url' });

                if (error) throw error;
            }

            // Call Scout Server (Hosted or Local)
            const SCOUT_API_URL = import.meta.env.VITE_SCOUT_API_URL || 'http://localhost:5000';

            try {
                const response = await fetch(`${SCOUT_API_URL}/scout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ channelUrl })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Scouting failed');
                }

                setProgress(100);
                setTimeout(() => fetchOutliers(), 1000);

            } catch (networkError) {
                console.error("Scout server error:", networkError);
                setDebugError(networkError);
                alert(
                    `Could not connect to Scout Service.\n\n` +
                    `Please ensure the Scout Service is deployed and running.\n` +
                    `Technical: Failed to connect to ${SCOUT_API_URL}`
                );
                setLoading(false);
                return;
            }
        } catch (e) {
            console.error("Scouting Error:", e);
            alert(`Error adding channel to queue: ${e.message || JSON.stringify(e)}`);
        }

        clearInterval(interval);
        setIsScouting(false);
        setChannelUrl('');
        setTimeout(() => setProgress(0), 2000);
    };

    const handleDelete = async (videoId) => {
        if (!confirm('Are you sure you want to delete this outlier?')) return;

        if (supabase) {
            await supabase.from('os_outliers').delete().eq('video_id', videoId);
            setOutliers(prev => prev.filter(o => o.video_id !== videoId));
        } else {
            setOutliers(prev => prev.filter(o => o.video_id !== videoId));
        }
    };

    return (
        <div className="space-y-8">
            {/* Scout Bar */}
            <div className="bg-gradient-to-r from-[#1a1a1a] to-[#121212] p-1 rounded-2xl shadow-2xl border border-white/5">
                <div className="bg-[#0a0a0a] rounded-xl p-6 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-[#ff982b] uppercase tracking-wider mb-2 ml-1">
                            New Target
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Paste YouTube Channel URL..."
                                className="w-full bg-[#121212] text-white px-5 py-3 rounded-lg border border-white/10 focus:outline-none focus:border-[#ff982b] focus:ring-1 focus:ring-[#ff982b] transition-all placeholder:text-[#52525b]"
                                value={channelUrl}
                                onChange={(e) => setChannelUrl(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleScout}
                        disabled={isScouting}
                        className="w-full md:w-auto bg-[#ff982b] hover:bg-[#e08624] text-black px-8 py-3 rounded-lg font-bold disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(255,152,43,0.2)] mt-6 md:mt-0"
                    >
                        {isScouting ? 'Scouting...' : 'Scout Channel'}
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            {progress > 0 && (
                <div className="fixed top-0 left-0 w-full h-1 bg-[#121212] z-50">
                    <div
                        className="h-full bg-[#ff982b] transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                    <div className="absolute top-2 right-4 bg-black/90 text-[#ff982b] text-xs font-bold px-3 py-1 rounded-full border border-[#ff982b]/30">
                        Scouting... {progress}%
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 bg-[#121212] p-4 rounded-xl border border-white/5 backdrop-blur-sm sticky top-4 z-10 shadow-xl">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b] w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search titles or channels..."
                        className="w-full bg-[#0a0a0a] text-white pl-10 pr-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-[#ff982b]"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4 text-[#a1a1aa] overflow-x-auto pb-2 md:pb-0">
                    <div className="flex items-center gap-2 bg-[#0a0a0a] px-3 py-1.5 rounded-lg border border-white/10">
                        <span className="text-xs font-bold text-[#52525b] uppercase">Sort By</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-transparent text-sm font-medium focus:outline-none text-white"
                        >
                            <option value="score">Outlier Score</option>
                            <option value="views">Total Views</option>
                        </select>
                    </div>

                    <div className="h-6 w-px bg-white/10 mx-1"></div>

                    <button
                        onClick={() => fetchOutliers(false)}
                        className="p-2 hover:bg-white/5 rounded-lg text-[#a1a1aa] hover:text-white transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-3">
                        <Filter className="w-4 h-4 text-[#52525b]" />
                        <span className="text-sm font-medium whitespace-nowrap">Min: <span className="text-white font-bold">{minScore}x</span></span>
                        <input
                            type="range"
                            min="1.5"
                            max="10"
                            step="0.1"
                            value={minScore}
                            onChange={(e) => setMinScore(parseFloat(e.target.value))}
                            className="w-24 accent-[#ff982b]"
                        />
                    </div>
                </div>
            </div>

            {/* Grid */}
            {loading && page === 0 ? (
                <div className="text-center py-20 text-[#52525b]">Loading outliers...</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {outliers.map((video, index) => (
                            <div key={`${video.video_id}-${index}`} className="group bg-[#121212] border border-white/5 rounded-xl overflow-hidden hover:border-[#ff982b]/50 transition-all hover:shadow-[0_0_20px_rgba(255,152,43,0.1)] flex flex-col">
                                <div className="relative aspect-video bg-[#0a0a0a]">
                                    <img
                                        src={video.thumbnail?.startsWith('data:image') ? video.thumbnail : (video.thumbnail || video.thumbnail_url || '/assets/placeholder.svg')}
                                        alt={video.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => { e.target.src = 'https://placehold.co/320x180?text=No+Thumbnail'; }}
                                    />
                                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-bold shadow-lg ${video.outlier_score >= 5 ? 'bg-yellow-500 text-black' : 'bg-[#ff982b] text-black'
                                        }`}>
                                        {video.outlier_score}x
                                    </div>
                                    <a
                                        href={`https://www.youtube.com/watch?v=${video.video_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <ExternalLink className="w-8 h-8 text-white" />
                                    </a>
                                </div>
                                <div className="p-4 flex flex-col flex-1">
                                    <h3 className="text-white font-semibold line-clamp-2 mb-3 group-hover:text-[#ff982b] transition-colors leading-snug">
                                        {video.title}
                                    </h3>
                                    <div className="mt-auto pt-3 border-t border-white/5 flex justify-between items-center">
                                        <span className="text-xs font-medium text-[#71717a] flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500/50"></span>
                                            {video.views ? video.views.toLocaleString() : 0} views
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(video.video_id);
                                            }}
                                            className="text-[#52525b] hover:text-red-500 transition-colors p-1"
                                            title="Delete Outlier"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                        ))}
                    </div>

                    {/* Infinite Scroll Loader */}
                    {hasMore && (
                        <div ref={observerTarget} className="flex justify-center py-8">
                            <div className="w-8 h-8 border-4 border-[#ff982b] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </>
            )}






            {/* Debug Info */}
            <div className="mt-8 p-4 bg-black/50 rounded-lg border border-white/10 text-xs font-mono text-[#52525b]">
                <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-white">System Status</p>
                    <div className="flex items-center gap-2">
                        <span className="text-[#a1a1aa]">Scout Service:</span>
                        <span className={`w-2 h-2 rounded-full ${debugError ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                    </div>
                </div>
                <p>Loading: {loading.toString()}</p>
                <p>Outliers Count: {outliers.length}</p>
                <p>Supabase Connected: {!!supabase ? 'Yes' : 'No'}</p>
                {debugError && <p className="text-red-500 mt-2">Error: {JSON.stringify(debugError)}</p>}
                <p className="mt-2 text-[#3f3f46]">Service URL: {import.meta.env.VITE_SCOUT_API_URL || 'Localhost (Default)'}</p>
            </div>
        </div>
    );
};

export default OutlierGallery;
