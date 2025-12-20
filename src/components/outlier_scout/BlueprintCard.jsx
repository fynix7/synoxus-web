import React, { useState, useEffect, useRef } from 'react';
import { LayoutTemplate, TrendingUp, Copy, Check } from 'lucide-react';

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

const BlueprintCard = ({ blueprint, index, showRank = true }) => {
    const [variableValues, setVariableValues] = useState({});
    const [copied, setCopied] = useState(false);

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
                {/* Thumbnail */}
                <div className="w-full aspect-video bg-[#0a0a0a] rounded-lg overflow-hidden border border-white/10 relative">
                    <img
                        src={blueprint.thumbnail1?.startsWith('data:image') ? blueprint.thumbnail1 : (blueprint.thumbnail1 || '/assets/placeholder.svg')}
                        alt="Original"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/320x180?text=No+Thumbnail'; }}
                    />
                </div>

                {/* Original Title */}
                <div>
                    <h4 className="text-[#a1a1aa] text-xs font-bold uppercase tracking-wider mb-1">Original Title</h4>
                    <p className="text-white text-base font-medium leading-snug">{blueprint.example1}</p>
                </div>

                {/* Interactive Format */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[#ff982b] text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                            <LayoutTemplate className="w-3 h-3" />
                            Format / Builder
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
                        <div className="text-base font-semibold text-white leading-relaxed">
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
                        Generated Concept
                    </h4>
                    <p className="text-emerald-400/90 text-base font-medium italic">
                        "{blueprint.generated_example || 'No generated concept available'}"
                    </p>
                </div>

                {/* Stats Footer */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                    <div className="bg-[#1a1a1a] px-2 py-1 rounded-md border border-white/5 flex items-center gap-1.5">
                        <span className="text-[#a1a1aa] text-xs">Score:</span>
                        <span className="text-white font-bold text-xs">{blueprint.median_score}x</span>
                    </div>
                    <div className="bg-[#1a1a1a] px-2 py-1 rounded-md border border-white/5 flex items-center gap-1.5">
                        <span className="text-[#a1a1aa] text-xs">Views:</span>
                        <span className="text-white font-bold text-xs">{blueprint.median_views?.toLocaleString()}</span>
                    </div>
                    <div className="bg-[#1a1a1a] px-2 py-1 rounded-md border border-white/5 flex items-center gap-1.5">
                        <span className="text-[#a1a1aa] text-xs">Archetype:</span>
                        <span className="text-[#ff982b] font-medium text-xs">{blueprint.archetype || 'Unclassified'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlueprintCard;

