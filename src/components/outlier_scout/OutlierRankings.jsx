import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { Type, LayoutTemplate, ChevronLeft, ChevronRight, Users, TrendingUp, Filter } from 'lucide-react';
import BlueprintCard from './BlueprintCard';

const OutlierRankings = () => {
    const [blueprints, setBlueprints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPageData, setNextPageData] = useState(null);
    const [loadingNext, setLoadingNext] = useState(false);
    const [sortBy, setSortBy] = useState('count'); // 'count' | 'score' | 'views'
    const [minExamples, setMinExamples] = useState(1);
    const PAGE_SIZE = 12;

    useEffect(() => {
        fetchBlueprints(0);
        fetchTotalCount();
    }, [sortBy, minExamples]);

    // Preload next page when current page loads
    useEffect(() => {
        if (blueprints.length > 0 && hasNextPage) {
            preloadNextPage();
        }
    }, [page, blueprints]);

    const hasNextPage = (page + 1) * PAGE_SIZE < totalCount;
    const hasPrevPage = page > 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const fetchTotalCount = async () => {
        if (!supabase) return;
        let query = supabase
            .from('os_blueprints')
            .select('*', { count: 'exact', head: true });

        if (minExamples > 1) {
            query = query.gte('count', minExamples);
        }

        const { count } = await query;
        setTotalCount(count || 0);
    };

    const buildQuery = (pageNum) => {
        let query = supabase
            .from('os_blueprints')
            .select('*');

        if (minExamples > 1) {
            query = query.gte('count', minExamples);
        }

        // Apply sort
        switch (sortBy) {
            case 'count':
                query = query.order('count', { ascending: false });
                break;
            case 'score':
                query = query.order('median_score', { ascending: false });
                break;
            case 'views':
                query = query.order('median_views', { ascending: false });
                break;
            default:
                query = query.order('count', { ascending: false });
        }

        const from = pageNum * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        query = query.range(from, to);

        return query;
    };

    const fetchBlueprints = async (pageNum) => {
        setLoading(true);
        if (!supabase) {
            setLoading(false);
            return;
        }

        const { data, error } = await buildQuery(pageNum);

        if (error) {
            console.error('Error fetching blueprints:', error);
        } else {
            setBlueprints(data || []);
            setPage(pageNum);
        }
        setLoading(false);
    };

    const preloadNextPage = async () => {
        if (!supabase || !hasNextPage || loadingNext) return;

        setLoadingNext(true);
        const nextPageNum = page + 1;
        const { data, error } = await buildQuery(nextPageNum);

        if (!error) {
            setNextPageData(data || []);
        }
        setLoadingNext(false);
    };

    const goToNextPage = () => {
        if (nextPageData) {
            setBlueprints(nextPageData);
            setPage(page + 1);
            setNextPageData(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (hasNextPage) {
            fetchBlueprints(page + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const goToPrevPage = () => {
        if (hasPrevPage) {
            fetchBlueprints(page - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Calculate some stats
    const multiExampleCount = blueprints.filter(b => (b.count || 1) > 1).length;

    if (loading && page === 0) return <div className="text-center py-20 text-[#52525b]">Loading title formats...</div>;

    if (blueprints.length === 0 && !loading) {
        return (
            <div className="text-center py-20">
                <div className="bg-[#121212] border border-white/10 rounded-2xl p-10 max-w-2xl mx-auto">
                    <LayoutTemplate className="w-16 h-16 text-[#52525b] mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-white mb-2">No Title Formats Found</h3>
                    <p className="text-[#a1a1aa] mb-6">
                        Run the Architect engine to analyze outliers and generate grouped title formats.
                    </p>
                    <div className="text-sm text-[#52525b] font-mono bg-black/50 p-4 rounded-lg">
                        Open Settings → Run Architect Engine
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Grouped Title Formats</h2>
                    <p className="text-[#a1a1aa]">Common patterns found across multiple high-performing videos.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-[#121212] px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2">
                        <Type className="w-4 h-4 text-[#ff982b]" />
                        <span className="text-white font-bold">{totalCount}</span>
                        <span className="text-[#52525b]">Patterns</span>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 bg-[#121212] p-4 rounded-xl border border-white/5 sticky top-4 z-10 shadow-xl">
                <div className="flex items-center gap-4 flex-wrap">
                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2 bg-[#0a0a0a] px-3 py-1.5 rounded-lg border border-white/10">
                        <TrendingUp className="w-4 h-4 text-[#52525b]" />
                        <span className="text-xs font-bold text-[#52525b] uppercase">Sort</span>
                        <select
                            value={sortBy}
                            onChange={(e) => {
                                setSortBy(e.target.value);
                                setPage(0);
                            }}
                            className="bg-transparent text-sm font-medium focus:outline-none text-white"
                        >
                            <option value="count">Most Examples</option>
                            <option value="score">Highest Score</option>
                            <option value="views">Most Views</option>
                        </select>
                    </div>

                    <div className="h-6 w-px bg-white/10"></div>

                    {/* Min Examples Filter */}
                    <div className="flex items-center gap-2 bg-[#0a0a0a] px-3 py-1.5 rounded-lg border border-white/10">
                        <Users className="w-4 h-4 text-[#52525b]" />
                        <span className="text-xs font-bold text-[#52525b] uppercase">Min</span>
                        <select
                            value={minExamples}
                            onChange={(e) => {
                                setMinExamples(parseInt(e.target.value));
                                setPage(0);
                            }}
                            className="bg-transparent text-sm font-medium focus:outline-none text-white"
                        >
                            <option value="1">1+ examples</option>
                            <option value="2">2+ examples</option>
                            <option value="3">3+ examples</option>
                            <option value="5">5+ examples</option>
                        </select>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-3 ml-auto text-sm">
                    <span className="text-[#52525b]">Showing</span>
                    <span className="text-white font-bold">{blueprints.length}</span>
                    <span className="text-[#52525b]">of</span>
                    <span className="text-[#ff982b] font-bold">{totalCount}</span>
                    <span className="text-[#52525b]">patterns</span>
                </div>
            </div>

            {/* Grid Layout - 2 columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {blueprints.map((bp) => (
                    <BlueprintCard key={bp.id} blueprint={bp} showRank={false} />
                ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-4 pt-8 pb-4">
                <button
                    onClick={goToPrevPage}
                    disabled={!hasPrevPage}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${hasPrevPage
                        ? 'bg-[#121212] border border-white/10 text-white hover:border-[#ff982b]/50 hover:bg-[#1a1a1a]'
                        : 'bg-[#0a0a0a] border border-white/5 text-[#52525b] cursor-not-allowed'
                        }`}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                </button>

                <div className="flex items-center gap-2 text-[#a1a1aa]">
                    <span className="text-white font-bold">{page + 1}</span>
                    <span>/</span>
                    <span>{totalPages || 1}</span>
                </div>

                <button
                    onClick={goToNextPage}
                    disabled={!hasNextPage}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${hasNextPage
                        ? 'bg-[#121212] border border-white/10 text-white hover:border-[#ff982b]/50 hover:bg-[#1a1a1a]'
                        : 'bg-[#0a0a0a] border border-white/5 text-[#52525b] cursor-not-allowed'
                        }`}
                >
                    Next
                    <ChevronRight className="w-4 h-4" />
                    {loadingNext && <span className="text-xs text-[#52525b]">(preloading...)</span>}
                </button>
            </div>
        </div>
    );
};

export default OutlierRankings;
