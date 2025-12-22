import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import OutlierGallery from './OutlierGallery';
import OutlierRankings from './OutlierRankings';
import { LayoutGrid, Type, Settings, Key, X, Check, Loader2, Play } from 'lucide-react';

const OutlierScout = ({ isPublic }) => {
    const [activeTab, setActiveTab] = useState('gallery'); // 'gallery' | 'rankings'
    const [stats, setStats] = useState({ outliers: 0, blueprints: 0, totalViews: 0, maxScore: 0 });
    const [showSettings, setShowSettings] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [savedApiKey, setSavedApiKey] = useState('');
    const [isRunningArchitect, setIsRunningArchitect] = useState(false);
    const [architectStatus, setArchitectStatus] = useState('');

    useEffect(() => {
        fetchStats();
        // Load saved API key from localStorage
        const stored = localStorage.getItem('gemini_api_key');
        if (stored) {
            setSavedApiKey(stored);
            setApiKey(stored);
        }

        if (isPublic) {
            document.title = 'Outlier Scout - Synoxus';
        }
    }, [isPublic]);

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
            const { data: viewsData, error: viewsError } = await supabase
                .from('os_outliers')
                .select('views')
                .range(0, 9999);

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

    const saveApiKey = () => {
        localStorage.setItem('gemini_api_key', apiKey);
        setSavedApiKey(apiKey);
        setShowSettings(false);
    };

    const clearApiKey = () => {
        localStorage.removeItem('gemini_api_key');
        setSavedApiKey('');
        setApiKey('');
    };

    const runArchitect = async () => {
        if (!savedApiKey) {
            setShowSettings(true);
            return;
        }

        setIsRunningArchitect(true);
        setArchitectStatus('Starting Architect Engine...');

        try {
            const response = await fetch('/api/architect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: savedApiKey })
            });

            const result = await response.json();

            if (result.success) {
                setArchitectStatus(`✅ Complete! Analyzed ${result.processed} outliers → Created ${result.blueprints || 0} grouped patterns.`);
                fetchStats(); // Refresh stats
            } else {
                setArchitectStatus(`❌ Error: ${result.error}`);
            }
        } catch (error) {
            setArchitectStatus(`❌ Error: ${error.message}`);
        } finally {
            setIsRunningArchitect(false);
            setTimeout(() => setArchitectStatus(''), 5000);
        }
    };

    const maskApiKey = (key) => {
        if (!key || key.length < 8) return '••••••••';
        return key.slice(0, 4) + '••••' + key.slice(-4);
    };

    return (
        <div className="space-y-8 p-6 bg-[#050505] min-h-screen text-white">
            {/* Header */}
            <div className="text-center space-y-6 mb-8">
                <div className="flex items-center justify-center gap-4">
                    <div className="w-20 h-20">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <defs>
                                <linearGradient id="binoculars-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#ff982b" />
                                    <stop offset="100%" stopColor="#ffc972" />
                                </linearGradient>
                            </defs>
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M6 4C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20C7.10457 20 8 19.1046 8 18V13H16V18C16 19.1046 16.8954 20 18 20C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4C16.8954 4 16 4.89543 16 6V11H8V6C8 4.89543 7.10457 4 6 4ZM6 6V9H8V6H6ZM16 6V9H18V6H16Z"
                                fill="url(#binoculars-gradient)"
                            />
                        </svg>
                    </div>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 rounded-lg bg-[#121212] border border-white/10 text-[#a1a1aa] hover:text-white hover:border-[#ff982b]/50 transition-all"
                        title="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>

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

                {/* Architect Status */}
                {architectStatus && (
                    <div className="max-w-2xl mx-auto bg-[#121212] border border-white/10 p-3 rounded-lg text-sm text-[#a1a1aa]">
                        {architectStatus}
                    </div>
                )}
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

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Settings className="w-5 h-5 text-[#ff982b]" />
                                Settings
                            </h2>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="text-[#52525b] hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* API Key Section */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-[#a1a1aa] flex items-center gap-2">
                                <Key className="w-4 h-4" />
                                Gemini API Key
                            </label>
                            <p className="text-xs text-[#52525b]">
                                Required to run the Architect engine for generating title formats.
                                Get your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[#ff982b] hover:underline">Google AI Studio</a>.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your Gemini API key..."
                                    className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-[#52525b] focus:outline-none focus:border-[#ff982b]/50"
                                />
                            </div>
                            {savedApiKey && (
                                <p className="text-xs text-green-500 flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    API Key saved: {maskApiKey(savedApiKey)}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            {savedApiKey && (
                                <button
                                    onClick={clearApiKey}
                                    className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
                                >
                                    Clear Key
                                </button>
                            )}
                            <button
                                onClick={saveApiKey}
                                disabled={!apiKey}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${apiKey
                                    ? 'bg-[#ff982b] text-black hover:bg-[#ff982b]/90'
                                    : 'bg-[#27272a] text-[#52525b] cursor-not-allowed'
                                    }`}
                            >
                                Save API Key
                            </button>
                        </div>

                        {/* Run Architect */}
                        <div className="pt-4 border-t border-white/10">
                            <button
                                onClick={runArchitect}
                                disabled={!savedApiKey || isRunningArchitect}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-sm transition-all ${savedApiKey && !isRunningArchitect
                                    ? 'bg-gradient-to-r from-[#ff982b] to-[#ffc972] text-black hover:opacity-90'
                                    : 'bg-[#27272a] text-[#52525b] cursor-not-allowed'
                                    }`}
                            >
                                {isRunningArchitect ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Running Architect...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4" />
                                        Run Architect Engine
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-[#52525b] mt-2 text-center">
                                Analyzes outliers and generates title formats using AI.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OutlierScout;
