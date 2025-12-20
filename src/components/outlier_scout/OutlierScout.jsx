import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import OutlierGallery from './OutlierGallery';
import OutlierRankings from './OutlierRankings';
import { LayoutGrid, Type } from 'lucide-react';

const OutlierScout = () => {
    const [activeTab, setActiveTab] = useState('gallery'); // 'gallery' | 'rankings'
    const [stats, setStats] = useState({ outliers: 0, blueprints: 0, totalViews: 0, maxScore: 0 });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        if (!supabase) return;

        try {
            // 1. Get exact count
            const { count: outlierCount, error: countError } = await supabase
                .from('os_outliers')
                .select('*', { count: 'exact', head: true });

            if (countError) console.error('Error counting outliers:', countError);

            // 2. Get Max Score (efficiently)
            const { data: maxData, error: maxError } = await supabase
                .from('os_outliers')
                .select('outlier_score')
                .order('outlier_score', { ascending: false })
                .limit(1);

            const maxScore = maxData?.[0]?.outlier_score || 0;

            // 3. Get Total Views (fetch all in batches if needed, or just large range)
            // Supabase limits to 1000 rows by default. We need to handle this.
            // For ~2000 rows, a single large range works if configured, but safe way is:
            const { data: viewsData, error: viewsError } = await supabase
                .from('os_outliers')
                .select('views')
                .range(0, 9999); // Fetch up to 10k rows

            const totalViews = viewsData?.reduce((sum, item) => sum + (item.views || 0), 0) || 0;

            // 4. Get Blueprints count
            const { count: blueprintCount } = await supabase
                .from('os_blueprints')
                .select('*', { count: 'exact', head: true });

            setStats({
                outliers: outlierCount || 0,
                blueprints: blueprintCount || 0,
                totalViews,
                maxScore: maxScore.toFixed(1)
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const formatCompactNumber = (number) => {
        return Intl.NumberFormat('en-US', {
            notation: "compact",
            maximumFractionDigits: 1
        }).format(number);
    };

    return (
        <div className="space-y-8 p-6 bg-[#050505] min-h-screen text-white">
            {/* Header */}
            <div className="text-center space-y-6 mb-8">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff982b] to-[#ffc972] uppercase tracking-tight">
                    Outlier Scout
                </h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <div className="bg-[#121212] border border-white/10 p-4 rounded-xl flex flex-col items-center">
                        <span className="text-[#a1a1aa] text-sm font-medium uppercase tracking-wider">Views Analyzed</span>
                        <span className="text-3xl font-black text-white mt-1">{formatCompactNumber(stats.totalViews)}</span>
                    </div>
                    <div className="bg-[#121212] border border-white/10 p-4 rounded-xl flex flex-col items-center">
                        <span className="text-[#a1a1aa] text-sm font-medium uppercase tracking-wider">Highest Outlier</span>
                        <span className="text-3xl font-black text-[#ff982b] mt-1">{stats.maxScore}x</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-8">
                <div className="bg-[#121212] p-1 rounded-xl border border-white/10 flex gap-1">
                    <button
                        onClick={() => setActiveTab('gallery')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'gallery'
                            ? 'bg-[#ff982b] text-black shadow-lg shadow-[#ff982b]/20'
                            : 'text-[#a1a1aa] hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Gallery
                    </button>
                    <button
                        onClick={() => setActiveTab('rankings')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'rankings'
                            ? 'bg-[#ff982b] text-black shadow-lg shadow-[#ff982b]/20'
                            : 'text-[#a1a1aa] hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Type className="w-4 h-4" />
                        Title Formats
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto">
                {activeTab === 'gallery' ? <OutlierGallery /> : <OutlierRankings />}
            </div>
        </div>
    );
};

export default OutlierScout;
