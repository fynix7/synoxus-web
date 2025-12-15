import React, { useState, useEffect } from 'react';
import { HexColorPicker } from "react-colorful";
import CharacterManager from './CharacterManager';
import HistoryModal from './HistoryModal';
import SavedModal from './SavedModal';
import { getCharacters } from '../services/characterStore';
import { queueStore } from '../services/queueStore';
import { oceStore } from '../services/oceStore';
import { analyzeChannelOutliers } from '../services/channelAnalysis';
import { Box, Palette, Users, X, Clock, Bookmark, RefreshCw, Wand2, Star, Tag, Link2, Copy, Download } from 'lucide-react';
import ModeTabs from './ModeTabs';
import MentionInput from './MentionInput';
import './SingleGenerator.css'; // Reuse existing styles

const PackageGenerator = ({ activeTab, onTabChange, onRateImage }) => {
    const [inputType, setInputType] = useState('keyword'); // 'keyword' or 'channel'
    const [keyword, setKeyword] = useState('');
    const [videoTopic, setVideoTopic] = useState('');
    const [channelLink, setChannelLink] = useState('');
    const [characters, setCharacters] = useState([]);
    const [showCharManager, setShowCharManager] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const [primaryColor, setPrimaryColor] = useState('#0071e3');
    const [secondaryColor, setSecondaryColor] = useState('#ffffff');
    const [useSecondaryColor, setUseSecondaryColor] = useState(false);
    const [activeColorPicker, setActiveColorPicker] = useState(null);
    const [variationCount, setVariationCount] = useState(1);
    const [queueState, setQueueState] = useState(queueStore.getState() || { queue: [], processing: false, completedJobs: [] });

    const [selectedCharId, setSelectedCharId] = useState('');

    useEffect(() => {
        const loadChars = async () => {
            const chars = await getCharacters();
            setCharacters(chars);

        };
        loadChars();
    }, []); // Only run once on mount

    useEffect(() => {
        const unsubscribe = queueStore.subscribe(setQueueState);
        return () => unsubscribe();
    }, []); // Only run once on mount

    const handleGenerate = async () => {
        if (inputType === 'keyword' && !keyword) {
            alert("Please enter a keyword.");
            return;
        }
        if (inputType === 'channel' && !channelLink) {
            alert("Please enter a channel link.");
            return;
        }

        const activeChar = characters.find(c => c.id === selectedCharId);
        if (!activeChar) {
            alert("Please select an active character.");
            return;
        }

        try {
            // 1. Determine which formats to use
            let relevantFormats = [];

            if (inputType === 'channel' && channelLink) {
                // CHANNEL MODE: Analyze the provided channel for outlier patterns
                alert('Analyzing channel for outlier patterns... This may take a moment.');

                try {
                    const channelFormat = await analyzeChannelOutliers(channelLink, videoTopic || 'general');
                    relevantFormats = [channelFormat];
                } catch (err) {
                    console.error("Channel Analysis Error:", err);
                    alert('Failed to analyze channel. Using default formats.');
                    // Fallback to keyword-based formats
                    const searchTerm = keyword || videoTopic;
                    if (searchTerm) {
                        relevantFormats = oceStore.findRelevantFormats(searchTerm);
                    }
                }
            } else {
                // KEYWORD MODE: Use OCE bank formats
                const searchTerm = keyword || videoTopic;
                try {
                    if (searchTerm) {
                        relevantFormats = oceStore.findRelevantFormats(searchTerm);
                    }
                } catch (err) {
                    console.error("OCE Store Error:", err);
                    relevantFormats = [];
                }
            }

            // 2. Add Job to Queue
            queueStore.addJob({
                type: 'package',
                apiParams: {
                    topic: keyword || videoTopic, // Fallback for API
                    videoTopic,
                    channelLink,
                    formats: relevantFormats,
                    brandColors: {
                        primary: primaryColor,
                        secondary: useSecondaryColor ? secondaryColor : null
                    },
                    activeCharacters: [{ name: activeChar.name, images: activeChar.images }],
                    variationCount,
                    instructions: `Package generation for ${inputType}: ${inputType === 'keyword' ? keyword : channelLink}. Title context: ${videoTopic}. Ensure the character appears ONLY ONCE in the composition.`
                },
                meta: {
                    topic: keyword || videoTopic,
                    instructions: `Package generation for ${inputType}`,
                    brandColors: { primary: primaryColor, secondary: useSecondaryColor ? secondaryColor : null }
                }
            });
        } catch (error) {
            console.error("Queue addition failed:", error);
            alert(`Failed to queue: ${error.message}`);
        }
    };

    const handleRemix = (pkg) => {
        try {
            queueStore.addJob({
                type: 'package',
                apiParams: {
                    topic: keyword || videoTopic,
                    videoTopic,
                    channelLink,
                    formats: [pkg.format],
                    brandColors: {
                        primary: primaryColor,
                        secondary: useSecondaryColor ? secondaryColor : null
                    },
                    activeCharacters: characters.find(c => c.id === selectedCharId) ? [{ name: characters.find(c => c.id === selectedCharId).name, images: characters.find(c => c.id === selectedCharId).images }] : [],
                    variationCount: 1,
                    instructions: `Remix of package. Ensure the character appears ONLY ONCE.`
                },
                meta: {
                    topic: `Remix: ${keyword || videoTopic}`,
                    instructions: `Remix of package`,
                    brandColors: { primary: primaryColor, secondary: useSecondaryColor ? secondaryColor : null }
                }
            });
        } catch (error) {
            console.error("Remix failed:", error);
        }
    };

    const downloadImage = (imageUrl, index) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `package-${index + 1}.png`;
        link.click();
    };

    const handleCopyImage = async (imageUrl) => {
        try {
            // Fetch as blob first
            const response = await fetch(imageUrl);
            const blob = await response.blob();

            // If it's already PNG, try writing directly
            if (blob.type === 'image/png') {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ [blob.type]: blob })
                    ]);
                    alert('Image copied to clipboard!');
                    return;
                } catch (e) {
                    console.warn("Direct PNG copy failed, trying canvas conversion", e);
                }
            }

            // Fallback: Convert to PNG using Canvas
            const img = new Image();
            const blobUrl = URL.createObjectURL(blob);
            img.src = blobUrl;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            URL.revokeObjectURL(blobUrl);

            canvas.toBlob(async (pngBlob) => {
                if (!pngBlob) {
                    alert('Failed to process image for copying.');
                    return;
                }
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': pngBlob })
                    ]);
                    alert('Image copied to clipboard!');
                } catch (err) {
                    console.error('Clipboard write failed:', err);
                    alert('Failed to copy image to clipboard. Browser might not support this.');
                }
            }, 'image/png');

        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy image. ' + err.message);
        }
    };

    if (!queueState) return <div>Loading...</div>;

    return (
        <div className="generator-container" style={{ outline: 'none', gridTemplateColumns: '340px 1fr' }}>
            {/* Header Buttons */}
            <button className="characters-btn" onClick={() => setShowCharManager(true)} title="Manage Characters">
                <Users size={20} /> CHARACTERS
            </button>

            {/* Saved Button */}
            <button
                className="saved-btn"
                onClick={() => setShowSaved(true)}
                title="View Saved"
            >
                <Bookmark size={20} />
            </button>

            {/* History Button */}
            <button
                className="history-btn"
                onClick={() => setShowHistory(true)}
                title="View History"
            >
                <Clock size={20} />
            </button>

            {/* Input Column */}
            <div className="panels-column input-column" style={{ width: '340px', minWidth: '340px' }}>
                <div className="glass-panel input-panel" style={{ position: 'relative', zIndex: 10 }}>
                    <div className="panel-header">
                        <ModeTabs activeTab={activeTab} onTabChange={onTabChange} />
                    </div>

                    <div className="panel-content">
                        <div style={{ background: 'rgba(255, 152, 43, 0.1)', border: '1px solid #ff982b', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff982b', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                                <Box size={18} />
                                <span>OCE is in Beta</span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                                Autonomous Outlier Curator Engine is a work in progress.
                            </div>
                        </div>

                        {/* Input Source Toggle */}
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            marginBottom: '16px',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '6px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <button
                                onClick={() => setInputType('keyword')}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: inputType === 'keyword' ? '#ff982b' : 'rgba(255,255,255,0.05)',
                                    color: inputType === 'keyword' ? 'white' : 'rgba(255,255,255,0.5)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                <Tag size={16} />
                                Keyword
                            </button>
                            <button
                                onClick={() => setInputType('channel')}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: inputType === 'channel' ? '#ff982b' : 'rgba(255,255,255,0.05)',
                                    color: inputType === 'channel' ? 'white' : 'rgba(255,255,255,0.5)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                <Link2 size={16} />
                                Channel
                            </button>
                        </div>

                        {/* Conditional Input: Keyword OR Channel Link */}
                        {inputType === 'keyword' ? (
                            <div className="input-group">
                                <label>Keyword</label>
                                <MentionInput
                                    type="text"
                                    className="glass-input"
                                    placeholder="e.g. Money, Minecraft, AI"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    characters={characters}
                                />
                            </div>
                        ) : (
                            <div className="input-group">
                                <label>Channel Link</label>
                                <input
                                    type="text"
                                    className="glass-input"
                                    placeholder="e.g. https://youtube.com/@MrBeast"
                                    value={channelLink}
                                    onChange={(e) => setChannelLink(e.target.value)}
                                />
                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    Analyze this channel's top outliers to generate formats.
                                </p>
                            </div>
                        )}

                        {/* Video Title Input (Always Visible) */}
                        <div className="input-group">
                            <label>Video Topic / Title</label>
                            <input
                                type="text"
                                className="glass-input"
                                placeholder="e.g. I Made $10k in 24 Hours"
                                value={videoTopic}
                                onChange={(e) => setVideoTopic(e.target.value)}
                            />
                        </div>

                        {/* Character Selection Dropdown */}
                        <div className="input-group">
                            <label>Active Character</label>
                            <div className="select-wrapper" style={{ position: 'relative' }}>
                                <select
                                    className="glass-input"
                                    value={selectedCharId}
                                    onChange={(e) => setSelectedCharId(e.target.value)}
                                >
                                    <option value="" disabled>-- Select Character --</option>
                                    {characters.map(char => (
                                        <option key={char.id} value={char.id}>
                                            {char.name}
                                        </option>
                                    ))}
                                </select>
                                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }}>
                                    ▼
                                </div>
                            </div>
                            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    className="btn-glass"
                                    onClick={() => setShowCharManager(true)}
                                    style={{ fontSize: '12px', padding: '4px 8px', height: 'auto' }}
                                >
                                    Manage Characters
                                </button>
                            </div>
                        </div>

                        {/* Brand Colors */}
                        <div className="input-group">
                            <label>Brand Colors</label>
                            <div className="colors-container-row">
                                <div className="color-wrapper" style={{ position: 'relative' }}>
                                    <button className="color-swatch-btn" style={{ backgroundColor: primaryColor }} onClick={() => setActiveColorPicker(activeColorPicker === 'primary' ? null : 'primary')} />
                                    <input type="text" className="color-hex-input-compact" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                                    {activeColorPicker === 'primary' && (
                                        <>
                                            <div className="color-picker-backdrop" onClick={() => setActiveColorPicker(null)} />
                                            <div className="color-picker-dropdown" onClick={e => e.stopPropagation()}>
                                                <HexColorPicker color={primaryColor} onChange={setPrimaryColor} />
                                            </div>
                                        </>
                                    )}
                                </div>
                                {useSecondaryColor ? (
                                    <div className="color-wrapper" style={{ position: 'relative' }}>
                                        <button className="color-swatch-btn" style={{ backgroundColor: secondaryColor }} onClick={() => setActiveColorPicker(activeColorPicker === 'secondary' ? null : 'secondary')} />
                                        <input type="text" className="color-hex-input-compact" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
                                        <button onClick={() => setUseSecondaryColor(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={16} /></button>
                                        {activeColorPicker === 'secondary' && (
                                            <>
                                                <div className="color-picker-backdrop" onClick={() => setActiveColorPicker(null)} />
                                                <div className="color-picker-dropdown" onClick={e => e.stopPropagation()}>
                                                    <HexColorPicker color={secondaryColor} onChange={setSecondaryColor} />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <button className="btn-glass icon-only" onClick={() => setUseSecondaryColor(true)} title="Add Secondary Color">
                                        <Palette size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Variations */}
                        <div className="input-group">
                            <label>{variationCount} Variation{variationCount !== 1 ? 's' : ''}</label>
                            <input
                                type="range"
                                className="glass-slider"
                                min="1"
                                max="5"
                                value={variationCount}
                                onChange={(e) => setVariationCount(parseInt(e.target.value))}
                            />
                        </div>

                        {/* Generate Button */}
                        <button
                            className="generate-btn"
                            onClick={handleGenerate}
                            disabled={queueState.processing || (inputType === 'keyword' && !keyword) || (inputType === 'channel' && !channelLink)}
                        >
                            {queueState.processing || queueState.queue.some(j => j.type === 'package') ? (
                                <div className="spinner-small"></div>
                            ) : (
                                <Wand2 size={24} />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Column */}
            <div className="panels-column results-column">
                {queueState.completedJobs.filter(job => job.type === 'package').map(job => (
                    <div key={job.id} className="glass-panel result-panel" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    {new Date(job.timestamp).toLocaleTimeString()}
                                </span>
                                <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                    {job.meta.topic}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                            {job.result && job.result.map((pkg, idx) => (
                                <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    {/* Thumbnail */}
                                    <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                                        <img src={pkg.image} alt="Generated" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>

                                    {/* Title & Info */}
                                    <div style={{ padding: '16px' }}>
                                        <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Generated Title
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: '12px', lineHeight: '1.4' }}>
                                            {pkg.title}
                                        </div>

                                        {/* Reference Source */}
                                        {pkg.format.referenceVideo && (
                                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                                <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px', textTransform: 'uppercase' }}>
                                                    Reference Source
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                                    <div style={{ width: '60px', height: '34px', borderRadius: '4px', overflow: 'hidden', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <img
                                                            src={pkg.format.referenceVideo.thumbnailUrl}
                                                            alt="Ref"
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.parentNode.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>';
                                                            }}
                                                        />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: '12px', color: 'white', fontWeight: '500', lineHeight: '1.2', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pkg.format.referenceVideo.title}>
                                                            {pkg.format.referenceVideo.title}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#666' }}>
                                                            {pkg.format.channel}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '12px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => downloadImage(pkg.image, idx)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', padding: '6px 8px', color: 'white', cursor: 'pointer', fontSize: '12px' }}
                                                    title="Download"
                                                >
                                                    <Download size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleCopyImage(pkg.image)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', padding: '6px 8px', color: 'white', cursor: 'pointer', fontSize: '12px' }}
                                                    title="Copy"
                                                >
                                                    <Copy size={14} />
                                                </button>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => onRateImage && onRateImage(pkg.image)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,113,227,0.1)', border: '1px solid rgba(0,113,227,0.3)', borderRadius: '4px', padding: '6px 12px', color: '#0071e3', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                                >
                                                    <Star size={12} /> Rate
                                                </button>
                                                <button
                                                    onClick={() => handleRemix(pkg)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', padding: '6px 12px', color: 'white', cursor: 'pointer', fontSize: '12px' }}
                                                >
                                                    <RefreshCw size={12} /> Remix
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Character Manager Modal */}
            {showCharManager && (
                <CharacterManager
                    isOpen={showCharManager}
                    onClose={() => setShowCharManager(false)}
                    onSaveSuccess={async () => {
                        const chars = await getCharacters();
                        setCharacters(chars);
                    }}
                    initialCharacters={characters}
                />
            )}

            {/* History Modal */}
            {showHistory && (
                <HistoryModal
                    isOpen={showHistory}
                    onClose={() => setShowHistory(false)}
                    activeTab={activeTab}
                />
            )}

            {/* Saved Modal */}
            {showSaved && (
                <SavedModal
                    isOpen={showSaved}
                    onClose={() => setShowSaved(false)}
                />
            )}
        </div>
    );
};

export default PackageGenerator;
