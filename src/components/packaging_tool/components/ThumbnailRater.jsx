import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Upload, Star, X, Clock, Users, AlertCircle, CheckCircle, Bookmark, Target, Layout, Zap, Eye, Fingerprint, Link, Pentagon } from 'lucide-react';
import ModeTabs from './ModeTabs';
import { rateThumbnail, compareThumbnails } from '../services/api';
import CharacterManager from './CharacterManager';
import HistoryModal from './HistoryModal';
import SavedModal from './SavedModal';
import { getCharacters } from '../services/characterStore';
import { queueStore } from '../services/queueStore';
import { extractYoutubeThumbnail, fetchImageAsBlob } from '../utils/youtubeUtils';
import './SingleGenerator.css';

const RadarChart = ({ data }) => {
    const size = 300;
    const center = size / 2;
    const radius = size / 2 - 40; // Padding
    const categories = [
        { key: 'focal_point', label: 'Focal Point', icon: Target, color: '#ff3b30' },
        { key: 'composition', label: 'Composition', icon: Layout, color: '#0071e3' },
        { key: 'virality', label: 'Virality', icon: Zap, color: '#af52de' },
        { key: 'clarity', label: 'Clarity', icon: Eye, color: '#34c759' },
        { key: 'identity', label: 'Identity', icon: Fingerprint, color: '#ff9500' }
    ];

    const angleStep = (Math.PI * 2) / categories.length;

    // Helper to get coordinates
    const getCoords = (value, index) => {
        const angle = index * angleStep - Math.PI / 2; // Start at top
        const r = (value / 10) * radius;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle)
        };
    };

    // Generate points for the data polygon
    const points = categories.map((cat, i) => {
        const score = data[cat.key]?.score || 0;
        const { x, y } = getCoords(score, i);
        return `${x},${y}`;
    }).join(' ');

    // Generate grid lines (pentagons)
    const gridLevels = [2, 4, 6, 8, 10];

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
            {/* Grid */}
            {gridLevels.map(level => (
                <polygon
                    key={level}
                    points={categories.map((_, i) => {
                        const { x, y } = getCoords(level, i);
                        return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="1"
                />
            ))}

            {/* Axes */}
            {categories.map((cat, i) => {
                const { x, y } = getCoords(10, i);
                return (
                    <line
                        key={i}
                        x1={center}
                        y1={center}
                        x2={x}
                        y2={y}
                        stroke={cat.color}
                        strokeOpacity="0.3"
                        strokeWidth="1"
                    />
                );
            })}

            <defs>
                <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0071e3" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#af52de" stopOpacity="0.2" />
                </linearGradient>
            </defs>

            {/* Data Polygon */}
            <polygon
                points={points}
                fill="url(#radarGradient)"
                stroke="white"
                strokeWidth="2"
                strokeOpacity="0.8"
            />

            {/* Data Points */}
            {categories.map((cat, i) => {
                const score = data[cat.key]?.score || 0;
                const { x, y } = getCoords(score, i);
                return (
                    <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="4"
                        fill={cat.color}
                        stroke="white"
                        strokeWidth="1"
                    />
                );
            })}

            {/* Labels */}
            {categories.map((cat, i) => {
                const { x, y } = getCoords(12, i); // Push labels out a bit
                const Icon = cat.icon;
                return (
                    <g key={i} transform={`translate(${x}, ${y})`}>
                        <foreignObject x="-50" y="-15" width="100" height="30">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: cat.color, fontSize: '12px', fontWeight: 'bold' }}>
                                <Icon size={12} />
                                <span style={{ textShadow: '0 1px 2px black' }}>{cat.label}</span>
                            </div>
                        </foreignObject>
                    </g>
                );
            })}
        </svg>
    );
};

const ThumbnailRater = ({ activeTab, onTabChange, imageToRate, onClearImageToRate }) => {
    const [refThumbs, setRefThumbs] = useState([]);
    const [previewImage, setPreviewImage] = useState(null);
    const [ratingResult, setRatingResult] = useState(null);

    const [characters, setCharacters] = useState([]);
    const [showCharManager, setShowCharManager] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showSaved, setShowSaved] = useState(false);

    const [urlInput, setUrlInput] = useState('');

    // Compare mode state
    const [compareMode, setCompareMode] = useState(false);
    const [thumb1, setThumb1] = useState(null);
    const [thumb2, setThumb2] = useState(null);
    const [comparisonResult, setComparisonResult] = useState(null);

    const [queueState, setQueueState] = useState(queueStore.getState() || { queue: [], processing: false, completedJobs: [] });

    useEffect(() => {
        const unsubscribe = queueStore.subscribe(setQueueState);
        return unsubscribe;
    }, []);

    useEffect(() => {
        console.log("ThumbnailRater: queueState updated", queueState);
        // Find the LATEST completed rating job (reverse search to get most recent)
        const ratingJobs = queueState.completedJobs.filter(job => job.type === 'rating');
        const latestRatingJob = ratingJobs[0]; // Get first item (newest, since queueStore unshifts)
        console.log("ThumbnailRater: latestRatingJob", latestRatingJob);

        if (latestRatingJob) {
            if (latestRatingJob.status === 'completed') {
                const res = latestRatingJob.result;
                console.log("ThumbnailRater: Setting rating result", res);
                // Recalculate score with new weights: Virality x2
                const focal = res.focal_point?.score || 0;
                const comp = res.composition?.score || 0;
                const clarity = res.clarity?.score || 0;
                const identity = res.identity?.score || 0;
                const virality = res.virality?.score || 0;

                // Total weight = 1+1+1+1+2 = 6
                const newScore = (focal + comp + clarity + identity + (virality * 2)) / 6;

                setRatingResult({ ...res, overall_score: newScore.toFixed(1) });
            } else if (latestRatingJob.status === 'failed') {
                console.error("ThumbnailRater: Rating failed", latestRatingJob.error);
                alert(`Rating failed: ${latestRatingJob.error}`);
                setRatingResult(null);
            }
        }
    }, [queueState.completedJobs]);

    const loadCharacters = async () => {
        const chars = await getCharacters();
        setCharacters(chars);
    };

    useEffect(() => {
        loadCharacters();
    }, [showCharManager]);

    // Auto-load image when imageToRate prop is provided
    useEffect(() => {
        if (imageToRate) {
            // Convert data URL to blob if needed
            if (imageToRate.startsWith('data:')) {
                fetch(imageToRate)
                    .then(res => res.blob())
                    .then(blob => {
                        const url = URL.createObjectURL(blob);
                        setRefThumbs([{
                            file: blob,
                            preview: url,
                            original: url,
                            isAnnotated: false
                        }]);
                        setRatingResult(null);
                        if (onClearImageToRate) onClearImageToRate();
                    });
            } else {
                setRefThumbs([{
                    file: null,
                    preview: imageToRate,
                    original: imageToRate,
                    isAnnotated: false
                }]);
                setRatingResult(null);
                if (onClearImageToRate) onClearImageToRate();
            }
        }
    }, [imageToRate]); // Removed onClearImageToRate from dependencies to prevent loops

    const handleAddUrl = async () => {
        if (!urlInput.trim()) return;

        let finalUrl = urlInput.trim();
        let file = null;

        // Check if it's a YouTube URL
        const ytThumb = extractYoutubeThumbnail(finalUrl);
        if (ytThumb) {
            finalUrl = ytThumb;
            // Try to fetch as blob
            const blob = await fetchImageAsBlob(finalUrl);
            if (blob) {
                finalUrl = URL.createObjectURL(blob);
                file = blob;
            }
        }

        setRefThumbs(prev => [...prev, {
            file: file,
            preview: finalUrl,
            original: finalUrl,
            isAnnotated: false
        }]);

        setUrlInput('');
    };

    const handleRefThumbUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            // Replace existing thumbnails with the new one
            setRefThumbs([{
                file,
                preview: url,
                original: url,
                isAnnotated: false
            }]);
            // Clear previous results when a new image is uploaded
            setRatingResult(null);
        }
    };

    const removeRefThumb = (index) => {
        setRefThumbs(prev => prev.filter((_, i) => i !== index));
        setRatingResult(null);
    };

    const handlePaste = async (e) => {
        const items = e.clipboardData.items;
        let newThumb = null;

        // 1. Handle Images
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                const url = URL.createObjectURL(blob);
                newThumb = {
                    file: blob,
                    preview: url,
                    original: url,
                    isAnnotated: false
                };
                break; // Only take the first image
            }
        }

        // 2. Handle Text (YouTube URLs) if no image found
        if (!newThumb) {
            const pastedText = e.clipboardData.getData('text');
            if (pastedText) {
                const ytThumbUrl = extractYoutubeThumbnail(pastedText);
                if (ytThumbUrl) {
                    let finalUrl = ytThumbUrl;
                    let file = null;

                    const blob = await fetchImageAsBlob(ytThumbUrl);
                    if (blob) {
                        finalUrl = URL.createObjectURL(blob);
                        file = blob;
                    }

                    newThumb = {
                        file: file,
                        preview: finalUrl,
                        original: finalUrl,
                        isAnnotated: false
                    };
                }
            }
        }

        if (newThumb) {
            setRefThumbs([newThumb]); // Replace existing
            setRatingResult(null); // Clear previous results
        }
    };

    const handleRate = async () => {
        if (refThumbs.length === 0) {
            alert("Please upload a thumbnail to rate.");
            return;
        }

        try {
            queueStore.addJob({
                type: 'rating',
                // Pass file if available, otherwise pass the preview URL
                apiParams: refThumbs[0].file || refThumbs[0].preview,
                meta: {
                    topic: "Thumbnail Rating",
                    instructions: "Rate this thumbnail",
                    brandColors: {}
                }
            });
        } catch (error) {
            console.error("Queue addition failed:", error);
            alert(`Failed to queue: ${error.message}`);
        }
    };

    const handleCompare = async () => {
        if (!thumb1 || !thumb2) {
            alert("Please upload both thumbnails to compare.");
            return;
        }

        try {
            setComparisonResult(null);
            const result = await compareThumbnails(thumb1.file || thumb1.preview, thumb2.file || thumb2.preview);
            if (result.success) {
                const calcScore = (data) => {
                    const focal = data.focal_point?.score || 0;
                    const comp = data.composition?.score || 0;
                    const clarity = data.clarity?.score || 0;
                    const identity = data.identity?.score || 0;
                    const virality = data.virality?.score || 0;
                    return ((focal + comp + clarity + identity + (virality * 2)) / 6).toFixed(1);
                };

                setComparisonResult({
                    ...result.data,
                    thumbnail1: { ...result.data.thumbnail1, overall_score: calcScore(result.data.thumbnail1) },
                    thumbnail2: { ...result.data.thumbnail2, overall_score: calcScore(result.data.thumbnail2) }
                });
            }
        } catch (error) {
            console.error("Comparison failed:", error);
            alert(`Comparison failed: ${error.message}`);
        }
    };

    const handleThumbUpload = (slot) => (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            const thumbData = { file, preview: url, original: url };
            if (slot === 1) setThumb1(thumbData);
            else setThumb2(thumbData);
        }
    };

    const handleThumbPaste = (slot) => async (pastedData) => {
        const thumbData = { file: pastedData.file || null, preview: pastedData.preview, original: pastedData.original };
        if (slot === 1) setThumb1(thumbData);
        else setThumb2(thumbData);
    };


    const handleReset = () => {
        setRefThumbs([]);
        setRatingResult(null);
        setUrlInput('');
    };

    return (
        <div className="generator-container" onPaste={handlePaste} tabIndex="0" style={{ outline: 'none', gridTemplateColumns: '340px 1fr' }}>
            {/* Characters Button - Top Left */}
            <button
                className="characters-btn"
                onClick={() => setShowCharManager(true)}
                title="Manage Characters"
            >
                <Users size={20} />
                CHARACTERS
            </button>

            {/* Saved Button - Top Right (Fixed via CSS) */}
            <button
                className="saved-btn"
                onClick={() => setShowSaved(true)}
                title="View Saved"
            >
                <Bookmark size={20} />
            </button>

            {/* History Button - Top Right (icon only) */}
            <button
                className="history-btn"
                onClick={() => setShowHistory(true)}
                title="View History"
            >
                <Clock size={20} />
            </button>

            <div className="panels-column input-column" style={{ width: '340px', minWidth: '340px' }}>
                <div className="glass-panel input-panel" style={{ position: 'relative', zIndex: 10 }}>
                    <div className="panel-header">
                        <ModeTabs activeTab={activeTab} onTabChange={onTabChange} />
                    </div>
                    <div className="panel-content">
                        {/* Compare Mode Toggle */}
                        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                                <input
                                    type="checkbox"
                                    checked={compareMode}
                                    onChange={(e) => {
                                        setCompareMode(e.target.checked);
                                        setRefThumbs([]);
                                        setThumb1(null);
                                        setThumb2(null);
                                        setRatingResult(null);
                                        setComparisonResult(null);
                                    }}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <span>Compare Mode</span>
                            </label>
                            {compareMode && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Upload 2 thumbnails to compare</span>}
                        </div>

                        {/* Conditional Upload UI */}
                        {compareMode ? (
                            // COMPARE MODE: Dual Upload Slots
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {[1, 2].map(slot => {
                                    const thumb = slot === 1 ? thumb1 : thumb2;
                                    return (
                                        <div key={slot} className="input-group" style={{ margin: 0 }}>
                                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Thumbnail {slot}</label>
                                            <div className="mini-upload" onClick={() => document.getElementById(`thumb-upload-${slot}`).click()}>
                                                <input
                                                    id={`thumb-upload-${slot}`}
                                                    type="file"
                                                    accept="image/*"
                                                    hidden
                                                    onChange={handleThumbUpload(slot)}
                                                />
                                                <Upload size={14} style={{ marginRight: '6px' }} />
                                                <span style={{ fontSize: '12px' }}>Upload</span>
                                            </div>
                                            {thumb && (
                                                <div style={{ position: 'relative', marginTop: '8px', height: '120px' }}>
                                                    <img src={thumb.preview} alt={`Thumb ${slot}`} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }} />
                                                    <button
                                                        onClick={() => slot === 1 ? setThumb1(null) : setThumb2(null)}
                                                        style={{
                                                            position: 'absolute', top: 4, right: 4,
                                                            background: 'var(--error)', color: 'white',
                                                            border: 'none', borderRadius: '50%',
                                                            width: '24px', height: '24px',
                                                            cursor: 'pointer', display: 'flex',
                                                            alignItems: 'center', justifyContent: 'center'
                                                        }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            // SINGLE MODE: Regular Upload
                            <div className="input-group">
                                <label>Upload Thumbnail to Rate</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <div className="mini-upload" onClick={() => document.getElementById('thumb-upload').click()} style={{ width: 'auto', padding: '0 16px' }}>
                                        <input
                                            id="thumb-upload"
                                            type="file"
                                            accept="image/*"
                                            hidden
                                            onChange={handleRefThumbUpload}
                                        />
                                        <Upload size={16} style={{ marginRight: '8px' }} />
                                        <span>Upload</span>
                                    </div>
                                    <div className="glass-input" style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 12px', gap: '8px', height: '40px' }}>
                                        <Link size={16} style={{ color: 'var(--text-secondary)' }} />
                                        <input
                                            placeholder="Paste YouTube or Image URL..."
                                            value={urlInput}
                                            onChange={(e) => setUrlInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--text-primary)',
                                                width: '100%',
                                                padding: '0',
                                                outline: 'none',
                                                fontSize: '14px'
                                            }}
                                        />
                                        {urlInput && (
                                            <button
                                                onClick={handleAddUrl}
                                                style={{
                                                    background: 'var(--primary)',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    padding: ' 4px 8px',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                ADD
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {refThumbs.length > 0 && (
                                    <div className="faces-grid" style={{ marginTop: '8px', gridTemplateColumns: '1fr' }}>
                                        {refThumbs.map((thumb, idx) => (
                                            <div key={idx} style={{ position: 'relative', cursor: 'pointer', height: '200px' }} onClick={() => setPreviewImage(thumb.preview)}>
                                                <img src={thumb.preview} alt="Ref" className="face-preview" style={{ objectFit: 'contain' }} />
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeRefThumb(idx); }}
                                                    style={{
                                                        position: 'absolute', top: 2, right: 2,
                                                        background: 'var(--error)', color: 'white',
                                                        borderRadius: '50%', width: 24, height: 24,
                                                        border: 'none', cursor: 'pointer', fontSize: '14px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Rate/Compare Button */}
                        <button
                            className="generate-btn"
                            onClick={compareMode ? handleCompare : handleRate}
                            disabled={compareMode ? (!thumb1 || !thumb2) : (refThumbs.length === 0)}
                            style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            {queueState.processing || queueState.queue.some(j => j.type === 'rating') ? (
                                <div className="spinner-small" style={{ borderTopColor: 'white', borderRightColor: 'rgba(255,255,255,0.3)', borderBottomColor: 'rgba(255,255,255,0.3)', borderLeftColor: 'rgba(255,255,255,0.3)' }}></div>
                            ) : (
                                <>
                                    <Pentagon size={20} />
                                    <span>{compareMode ? 'Compare Thumbnails' : 'Rate Thumbnail'}</span>
                                </>
                            )}
                        </button>


                    </div>
                </div>
            </div>

            {/* Results Column */}
            <div className="panels-column results-column">

                {/* Comparison Results */}
                {comparisonResult && (
                    <div className="glass-panel result-panel" style={{ padding: '24px', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0 }}>Comparison Results</h2>
                            <button
                                onClick={() => { setThumb1(null); setThumb2(null); setComparisonResult(null); }}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    padding: '6px 12px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}
                            >
                                Compare Again
                            </button>
                        </div>

                        {/* Winner Badge */}
                        <div style={{
                            background: comparisonResult.comparison.winner === 'tie' ? '#ff9800' : '#ff982b',
                            color: 'black',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            textAlign: 'center',
                            marginBottom: '24px'
                        }}>
                            {comparisonResult.comparison.winner === 'tie' ? 'It\'s a Tie!' : `Winner: Thumbnail ${comparisonResult.comparison.winner === 'thumbnail1' ? '1' : '2'}`}
                        </div>

                        {/* Winner Reasoning */}
                        <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>{comparisonResult.comparison.winner_reasoning}</p>
                        </div>

                        {/* Side-by-side Radar Charts */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                            <div>
                                <h3 style={{ textAlign: 'center', marginBottom: '12px' }}>Thumbnail 1 ({comparisonResult.thumbnail1.overall_score}/10)</h3>
                                <RadarChart data={comparisonResult.thumbnail1} />
                            </div>
                            <div>
                                <h3 style={{ textAlign: 'center', marginBottom: '12px' }}>Thumbnail 2 ({comparisonResult.thumbnail2.overall_score}/10)</h3>
                                <RadarChart data={comparisonResult.thumbnail2} />
                            </div>
                        </div>

                        {/* Comparative Strengths */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                            <div>
                                <h4 style={{ color: '#ff982b', marginBottom: '12px', fontSize: '14px' }}>Thumbnail 1 Strengths</h4>
                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8' }}>
                                    {comparisonResult.comparison.thumbnail1_strengths.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h4 style={{ color: '#ff982b', marginBottom: '12px', fontSize: '14px' }}>Thumbnail 2 Strengths</h4>
                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8' }}>
                                    {comparisonResult.comparison.thumbnail2_strengths.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                        </div>

                        {/* Key Differences */}
                        <div style={{ marginBottom: '24px' }}>
                            <h4 style={{ color: '#af52de', marginBottom: '12px', fontSize: '14px' }}>Key Differences</h4>
                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8' }}>
                                {comparisonResult.comparison.key_differences.map((d, i) => <li key={i}>{d}</li>)}
                            </ul>
                        </div>

                        {/* Improvement Suggestions */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <h4 style={{ color: '#ff9800', marginBottom: '12px', fontSize: '14px' }}>Thumbnail 1 Improvements</h4>
                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8' }}>
                                    {comparisonResult.thumbnail1.improvement_suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h4 style={{ color: '#ff9800', marginBottom: '12px', fontSize: '14px' }}>Thumbnail 2 Improvements</h4>
                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8' }}>
                                    {comparisonResult.thumbnail2.improvement_suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {ratingResult && (
                    <div className="glass-panel result-panel" style={{ padding: '24px', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <h2 style={{ margin: 0 }}>Thumbnail Analysis</h2>
                                <button
                                    onClick={handleReset}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        padding: '6px 12px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Rate Another
                                </button>
                            </div>
                            <div style={{
                                background: ratingResult.overall_score >= 8 ? '#ff982b' : ratingResult.overall_score >= 5 ? '#ff9800' : '#ff3b30',
                                color: 'black',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontWeight: 'bold',
                                fontSize: '18px'
                            }}>
                                {ratingResult.overall_score || 0}/10
                            </div>
                        </div>

                        {/* Radar Chart */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
                            <RadarChart data={ratingResult} />
                        </div>

                        {/* Detailed Breakdown */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[
                                { key: 'focal_point', icon: <Target size={18} />, color: '#ff3b30' },
                                { key: 'composition', icon: <Layout size={18} />, color: '#0071e3' },
                                { key: 'virality', icon: <Zap size={18} />, color: '#af52de' },
                                { key: 'clarity', icon: <Eye size={18} />, color: '#34c759' },
                                { key: 'identity', icon: <Fingerprint size={18} />, color: '#ff9500' }
                            ].map(({ key, icon, color }) => (
                                <div key={key} style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', borderLeft: `4px solid ${color}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: color }}>
                                            {icon}
                                            <h4 style={{ margin: 0, textTransform: 'capitalize' }}>{key.replace('_', ' ')}</h4>
                                        </div>
                                        <span style={{ fontWeight: 'bold', color: color }}>{(ratingResult[key]?.score || 0) * 10}%</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                        {ratingResult[key]?.reasoning || "No reasoning provided."}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Negative Patterns (Soft Warning) */}
                        {ratingResult.negative_patterns && ratingResult.negative_patterns.length > 0 && (
                            <div style={{ marginTop: '24px', background: 'rgba(255, 152, 0, 0.1)', border: '1px solid rgba(255, 152, 0, 0.2)', borderRadius: '12px', padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#ff9800' }}>
                                    <AlertCircle size={18} />
                                    <h3 style={{ margin: 0, fontSize: '15px' }}>Things to Watch Out For</h3>
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                                    {ratingResult.negative_patterns.map((pattern, i) => (
                                        <li key={i}>{pattern}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Improvement Suggestions */}
                        {ratingResult.improvement_suggestions && (
                            <div style={{ marginTop: '24px' }}>
                                <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Suggestions for Improvement</h3>
                                <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>
                                    {ratingResult.improvement_suggestions.map((suggestion, i) => (
                                        <li key={i} style={{ marginBottom: '8px' }}>{suggestion}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Character Manager Modal */}
            {
                showCharManager && (
                    <CharacterManager
                        isOpen={showCharManager}
                        onClose={() => setShowCharManager(false)}
                        onSaveSuccess={loadCharacters}
                        initialCharacters={characters}
                    />
                )
            }

            {/* History Modal */}
            {
                showHistory && (
                    <HistoryModal
                        isOpen={showHistory}
                        onClose={() => setShowHistory(false)}
                        activeTab={activeTab}
                    />
                )
            }

            {/* Saved Modal */}
            {
                showSaved && (
                    <SavedModal
                        isOpen={showSaved}
                        onClose={() => setShowSaved(false)}
                    />
                )
            }

            {/* Image Preview Modal */}
            {
                previewImage && createPortal(
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10000,
                            padding: '40px'
                        }}
                        onClick={() => setPreviewImage(null)}
                    >
                        <button
                            onClick={() => setPreviewImage(null)}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'white'
                            }}
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={previewImage}
                            alt="Preview"
                            style={{
                                maxWidth: '90%',
                                maxHeight: '90%',
                                objectFit: 'contain',
                                borderRadius: '12px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>,
                    document.body
                )
            }
        </div >
    );
};

export default ThumbnailRater;
