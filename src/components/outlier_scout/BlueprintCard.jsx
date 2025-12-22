import React, { useState, useEffect, useRef } from 'react';
import { LayoutTemplate, TrendingUp, Copy, Check, ChevronLeft, ChevronRight, ExternalLink, Users, Eye } from 'lucide-react';

const VariablePill = ({ label, value, onChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const displayValue = value || label;
    const isPlaceholder = !value;

    return (
        <span className="relative inline-block mx-1 align-middle group">
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={() => setIsEditing(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
                    className="bg-[#1a1a1a] text-[#ff982b] border border-[#ff982b] rounded px-2 py-0.5 text-lg font-medium focus:outline-none focus:ring-1 focus:ring-[#ff982b] min-w-[100px]"
                    placeholder={label}
                />
            ) : (
                <button
                    onClick={() => setIsEditing(true)}
                    className={`px-2 py-0.5 rounded border transition-all text-lg font-medium ${isPlaceholder
                        ? 'bg-[#ff982b]/10 text-[#ff982b] border-[#ff982b] border-dashed hover:bg-[#ff982b]/20'
                        : 'bg-[#ff982b] text-black border-[#ff982b] hover:bg-[#ff982b]/90'
                        }`}
                >
                    {displayValue}
                </button>
            )}

            {/* Tooltip */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-[#a1a1aa] text-xs rounded border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-10">
                {label}
            </span>
        </span>
    );
};

const ThumbnailCarousel = ({ examples }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!examples || examples.length === 0) {
        return (
            <div className="w-full aspect-video bg-[#0a0a0a] rounded-lg flex items-center justify-center border border-white/10">
                <span className="text-[#52525b]">No thumbnails</span>
            </div>
        );
    }

    const currentExample = examples[currentIndex];
    const hasMultiple = examples.length > 1;

    const goNext = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % examples.length);
    };

    const goPrev = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + examples.length) % examples.length);
    };

    return (
        <div className="relative group/carousel">
            {/* Main Thumbnail */}
            <div className="w-full aspect-video bg-[#0a0a0a] rounded-lg overflow-hidden border border-white/10 relative">
                <img
                    src={currentExample.thumbnail?.startsWith('data:image') ? currentExample.thumbnail : (currentExample.thumbnail || '/assets/placeholder.svg')}
                    alt={currentExample.title}
                    className="w-full h-full object-cover transition-all duration-300"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/320x180?text=No+Thumbnail'; }}
                />

                {/* Score Badge */}
                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-bold shadow-lg ${currentExample.score >= 5 ? 'bg-yellow-500 text-black' : 'bg-[#ff982b] text-black'
                    }`}>
                    {currentExample.score?.toFixed(1)}x
                </div>

                {/* YouTube Link */}
                {currentExample.video_id && (
                    <a
                        href={`https://www.youtube.com/watch?v=${currentExample.video_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 left-2 p-1.5 bg-black/70 rounded-md text-white hover:bg-black/90 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                )}

                {/* Navigation Arrows */}
                {hasMultiple && (
                    <>
                        <button
                            onClick={goPrev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/70 rounded-full text-white hover:bg-black/90 transition-all opacity-0 group-hover/carousel:opacity-100"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={goNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/70 rounded-full text-white hover:bg-black/90 transition-all opacity-0 group-hover/carousel:opacity-100"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>

            {/* Thumbnail Strip (Mini thumbnails) */}
            {hasMultiple && (
                <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                    {examples.map((ex, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrentIndex(idx);
                            }}
                            className={`flex-shrink-0 w-14 h-8 rounded overflow-hidden border-2 transition-all ${idx === currentIndex
                                ? 'border-[#ff982b] opacity-100'
                                : 'border-transparent opacity-60 hover:opacity-100'
                                }`}
                        >
                            <img
                                src={ex.thumbnail?.startsWith('data:image') ? ex.thumbnail : (ex.thumbnail || '/assets/placeholder.svg')}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/56x32?text=...'; }}
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Current Title */}
            <div className="mt-2">
                <p className="text-white text-sm font-medium leading-snug line-clamp-2">
                    {currentExample.title}
                </p>
                {currentExample.views && (
                    <p className="text-[#71717a] text-xs mt-1 flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {currentExample.views.toLocaleString()} views
                    </p>
                )}
            </div>
        </div>
    );
};

const BlueprintCard = ({ blueprint, index, showRank = true }) => {
    const [variableValues, setVariableValues] = useState({});
    const [copied, setCopied] = useState(false);

    // Parse examples from JSON
    let examples = [];
    try {
        examples = blueprint.examples ? JSON.parse(blueprint.examples) : [];
    } catch (e) {
        // Fallback to legacy single example
        if (blueprint.example1 && blueprint.thumbnail1) {
            examples = [{
                title: blueprint.example1,
                thumbnail: blueprint.thumbnail1,
                video_id: blueprint.video_id || '',
                views: blueprint.median_views,
                score: blueprint.median_score
            }];
        }
    }

    // Fallback for legacy blueprints without examples JSON
    if (examples.length === 0 && blueprint.example1) {
        examples = [{
            title: blueprint.example1,
            thumbnail: blueprint.thumbnail1,
            video_id: '',
            views: blueprint.median_views,
            score: blueprint.median_score
        }];
    }

    // Parse pattern to identify variables
    const parts = blueprint.pattern.split(/(\[.*?\])/g);

    const handleCopy = () => {
        // Construct the final string
        const finalString = parts.map((part, i) => {
            if (part.startsWith('[') && part.endsWith(']')) {
                return variableValues[i] || part;
            }
            return part;
        }).join('');

        navigator.clipboard.writeText(finalString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-[#121212] border border-white/10 rounded-xl p-5 hover:border-[#ff982b]/30 transition-all group h-full">
            <div className="flex flex-col gap-4">
                {/* Header with count badge */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-[#ff982b]/10 text-[#ff982b] px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {blueprint.count || 1} example{(blueprint.count || 1) > 1 ? 's' : ''}
                        </div>
                        <span className="text-[#52525b] text-xs">|</span>
                        <span className="text-[#ff982b] text-xs font-medium">{blueprint.archetype || 'Unclassified'}</span>
                    </div>
                    <div className="bg-[#1a1a1a] px-2 py-0.5 rounded-md border border-white/5 text-white font-bold text-xs">
                        {blueprint.median_score}x avg
                    </div>
                </div>

                {/* Thumbnail Carousel */}
                <ThumbnailCarousel examples={examples} />

                {/* Interactive Format */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[#ff982b] text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                            <LayoutTemplate className="w-3 h-3" />
                            Title Format
                        </h4>
                        <button
                            onClick={handleCopy}
                            className="text-[#52525b] hover:text-white transition-colors"
                            title="Copy generated title"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className="bg-[#0a0a0a] p-3 rounded-lg border border-white/5 border-l-4 border-l-[#ff982b]">
                        <div className="text-base font-semibold text-white leading-relaxed flex flex-wrap items-center">
                            {parts.map((part, i) => {
                                if (part.startsWith('[') && part.endsWith(']')) {
                                    return (
                                        <VariablePill
                                            key={i}
                                            label={part}
                                            value={variableValues[i] || ''}
                                            onChange={(val) => setVariableValues(prev => ({ ...prev, [i]: val }))}
                                        />
                                    );
                                }
                                return <span key={i}>{part}</span>;
                            })}
                        </div>
                    </div>
                </div>

                {/* Generated Concept */}
                <div>
                    <h4 className="text-emerald-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        AI Generated Concept
                    </h4>
                    <p className="text-emerald-400/90 text-sm font-medium italic bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                        "{blueprint.generated_example || 'No generated concept available'}"
                    </p>
                </div>

                {/* Stats Footer */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                    <div className="bg-[#1a1a1a] px-2 py-1 rounded-md border border-white/5 flex items-center gap-1.5">
                        <span className="text-[#a1a1aa] text-xs">Avg Score:</span>
                        <span className="text-white font-bold text-xs">{blueprint.median_score}x</span>
                    </div>
                    <div className="bg-[#1a1a1a] px-2 py-1 rounded-md border border-white/5 flex items-center gap-1.5">
                        <span className="text-[#a1a1aa] text-xs">Avg Views:</span>
                        <span className="text-white font-bold text-xs">{blueprint.median_views?.toLocaleString()}</span>
                    </div>
                    <div className="bg-[#1a1a1a] px-2 py-1 rounded-md border border-white/5 flex items-center gap-1.5">
                        <span className="text-[#a1a1aa] text-xs">Examples:</span>
                        <span className="text-[#ff982b] font-bold text-xs">{blueprint.count || 1}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlueprintCard;
