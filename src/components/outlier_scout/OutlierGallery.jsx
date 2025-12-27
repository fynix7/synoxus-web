import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { Search, Filter, RefreshCw, Trash2, ExternalLink, Database, Eye } from 'lucide-react';

const OutlierGallery = ({ isPublic = false }) => {
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
    const [viewRange, setViewRange] = useState({ min: '', max: '' });
    const [scoutingStatus, setScoutingStatus] = useState('');
    const [scoutLog, setScoutLog] = useState([]);
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

            // Apply View Range
            if (viewRange.min) query = query.gte('views', parseInt(viewRange.min));
            if (viewRange.max) query = query.lte('views', parseInt(viewRange.max));

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

    const formatViews = (views) => {
        if (!views) return '0';
        if (views >= 1000000) {
            return (views / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        if (views >= 1000) {
            return (views / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        }
        return views.toLocaleString();
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
    }, [search, minScore, sortBy, viewRange]);

    const handleScout = async () => {
        if (!channelUrl) return;

        // Split by comma, newline, OR whitespace and clean up
        const rawUrls = channelUrl.split(/[\n,\s]+/);
        const urls = rawUrls.map(u => u.trim()).filter(u => u.length > 0 && u.startsWith('http'));

        if (urls.length === 0) {
            alert('No valid URLs found. Please ensure they start with http/https.');
            return;
        }

        console.log('Starting batch scout for URLs:', urls);

        setIsScouting(true);
        setProgress(0);
        setScoutingStatus(`Initializing batch of ${urls.length} channels...`);
        setScoutLog([]);

        const SCOUT_API_URL = import.meta.env.VITE_SCOUT_API_URL || 'http://localhost:5000';

        try {
            // 1. Add ALL to Supabase Queue
            if (supabase) {
                const upserts = urls.map(u => ({ url: u, last_scouted: null }));
                const { error } = await supabase
                    .from('os_channels')
                    .upsert(upserts, { onConflict: 'url' });
                if (error) console.warn(`Supabase upsert warning:`, error);
            }

            // 2. Call Scout Service ONCE with list
            setScoutingStatus(`Scouting ${urls.length} channels... (This may take a while)`);

            const response = await fetch(`${SCOUT_API_URL}/scout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelUrls: urls }),
                signal: AbortSignal.timeout(1200000) // 20 minutes timeout for batch
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Scouting failed');
            }

            setScoutLog(prev => [...prev, `✅ Batch Complete!`]);
            setScoutingStatus(`Batch Complete!`);

        } catch (e) {
            console.error(`Failed to scout batch:`, e);
            setScoutLog(prev => [...prev, `❌ Batch Failed: ${e.message}`]);
            setScoutingStatus(`Batch Failed`);
        } finally {
            setProgress(100);
            fetchOutliers();
            setIsScouting(false);
            setChannelUrl('');
            setTimeout(() => setScoutingStatus(''), 10000);
        }
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
            {/* Scout Bar - Show on localhost OR when not public */}
            {(!isPublic || window.location.hostname === 'localhost') && (
                <div className="bg-gradient-to-r from-[#1a1a1a] to-[#121212] p-1 rounded-2xl shadow-2xl border border-white/5">
                    <div className="bg-[#0a0a0a] rounded-xl p-6 flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-bold text-[#ff982b] uppercase tracking-wider mb-2 ml-1">
                                New Target
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Paste Channel URLs (comma or newline separated)..."
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
            )}

            {/* Progress Bar */}
            {progress > 0 && (
                <div className="fixed top-0 left-0 w-full z-50">
                    <div className="h-1 w-full bg-[#121212]">
                        <div
                            className="h-full bg-[#ff982b] transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/90 text-[#ff982b] text-xs font-bold px-4 py-2 rounded-full border border-[#ff982b]/30 shadow-lg flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#ff982b] rounded-full animate-pulse" />
                        {scoutingStatus || `Scouting... ${progress}%`}
                    </div>
                </div>
            )}

            {/* Scout Log - Visible when there are entries */}
            {scoutLog.length > 0 && (
                <div className="bg-[#0a0a0a] p-4 rounded-xl border border-white/10 max-h-60 overflow-y-auto font-mono text-xs">
                    <h4 className="text-[#ff982b] font-bold mb-2 sticky top-0 bg-[#0a0a0a] pb-2 border-b border-white/5">Scout Log</h4>
                    <div className="space-y-1">
                        {scoutLog.map((log, i) => (
                            <div key={i} className={log.startsWith('✅') ? 'text-emerald-500' : 'text-red-500'}>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 bg-[#121212] p-4 rounded-xl border border-white/5 backdrop-blur-sm sticky top-4 z-50 shadow-xl items-center">
                <div className="relative w-full md:w-96">
                    <input
                        type="text"
                        placeholder="Search titles"
                        className="w-full bg-[#0a0a0a] text-white px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-[#ff982b]"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 bg-[#0a0a0a] px-3 py-2 rounded-lg border border-white/10">
                    <span className="text-xs font-bold text-[#52525b] uppercase">Views</span>
                    <input
                        type="number"
                        placeholder="Min"
                        className="w-20 bg-transparent text-white text-sm focus:outline-none border-b border-transparent focus:border-[#ff982b] text-center"
                        value={viewRange.min}
                        onChange={(e) => setViewRange({ ...viewRange, min: e.target.value })}
                    />
                    <span className="text-[#52525b]">-</span>
                    <input
                        type="number"
                        placeholder="Max"
                        className="w-20 bg-transparent text-white text-sm focus:outline-none border-b border-transparent focus:border-[#ff982b] text-center"
                        value={viewRange.max}
                        onChange={(e) => setViewRange({ ...viewRange, max: e.target.value })}
                    />
                </div>

                <div className="flex items-center gap-4 text-[#a1a1aa] overflow-x-auto pb-2 md:pb-0 ml-auto">
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
                            <div key={`${video.video_id}-${index}`} className="group relative bg-[#121212] border border-white/5 rounded-xl overflow-hidden transition-all flex flex-col hover:border-transparent">
                                {/* Orange gradient overlay on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-[#ff982b] to-[#ff6b00] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none z-0" />

                                {/* Left-to-right shine effect with 0.5s delay */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out delay-500" />
                                </div>

                                <div className="relative aspect-video bg-[#0a0a0a] z-20 overflow-hidden">
                                    <img
                                        src={video.thumbnail?.startsWith('data:image') ? video.thumbnail : (video.thumbnail || video.thumbnail_url || '/assets/placeholder.svg')}
                                        alt={video.title}
                                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => { e.target.src = 'https://placehold.co/1280x720/0a0a0a/ff982b?text=No+Thumbnail'; }}
                                    />
                                    <div className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-black/90 border border-white/10 shadow-xl animate-[pulse-scale_2s_ease-in-out_infinite] z-50 group-hover:bg-white group-hover:border-transparent transition-all duration-300">
                                        <span className="text-lg font-black bg-gradient-to-r from-[#ff982b] to-[#ff6b00] text-transparent bg-clip-text group-hover:text-black">
                                            {video.outlier_score}x
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault(); // Prevent link click
                                            handleDelete(video.video_id);
                                        }}
                                        className="absolute top-2 right-2 p-2 rounded-lg bg-black/80 text-white/70 hover:text-red-500 hover:bg-black transition-all opacity-0 group-hover:opacity-100 z-50"
                                        title="Delete Outlier"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                    <a
                                        href={`https://www.youtube.com/watch?v=${video.video_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity z-30"
                                    >
                                        <ExternalLink className="w-8 h-8 text-white" />
                                    </a>
                                </div>
                                <div className="p-4 flex flex-col flex-1 relative z-20">
                                    <h3 className="text-xl text-white group-hover:text-[#0a0a0a] group-hover:scale-[1.02] origin-left font-semibold line-clamp-2 mb-3 transition-all duration-300 leading-snug">
                                        {video.title}
                                    </h3>
                                    <div className="mt-auto pt-3 border-t border-white/5 flex justify-center items-center relative">
                                        <span className="text-sm font-medium text-[#a1a1aa] group-hover:text-white flex items-center gap-2 transition-colors">
                                            <Eye className="w-4 h-4" />
                                            {formatViews(video.views)} views
                                        </span>
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
