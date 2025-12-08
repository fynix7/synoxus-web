import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { HexColorPicker } from "react-colorful";
import CharacterManager from './CharacterManager';
import HistoryModal from './HistoryModal';
import { getCharacters } from '../services/characterStore';
import { generateThumbnail } from '../services/api';
import { saveToHistory } from '../services/historyStore';
import ModeTabs from './ModeTabs';
import HighlightTextarea from './HighlightTextarea';
import SavedModal from './SavedModal';
import DrawingModal from './DrawingModal';
import { saveItem } from '../services/savedStore';
import { Upload, Palette, Wand2, Plus, X, Clock, Users, Bookmark, Heart, Download as DownloadIcon, GitBranch, PenTool, Link, Brush, Scissors, UserX, Image as ImageIcon, Copy, ImageOff, LayoutTemplate, Frame } from 'lucide-react';
import { createMaskFromBlue, createCleanPlate } from '../utils/maskUtils';
import { extractYoutubeThumbnail, fetchImageAsBlob } from '../utils/youtubeUtils';
import { queueStore } from '../services/queueStore';
import { getGridColumns } from '../utils/gridUtils';
import './SingleGenerator.css';

const Remover = ({ activeTab, onTabChange, extraHeaderContent }) => {
    const [subTab, setSubTab] = useState('character'); // 'character' | 'background'
    const [characters, setCharacters] = useState([]);
    const [showCharManager, setShowCharManager] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const [showDrawing, setShowDrawing] = useState(false);
    const [drawingImage, setDrawingImage] = useState(null);
    const [activeColorPicker, setActiveColorPicker] = useState(null);

    const [instructions, setInstructions] = useState('Remove the person from the image.');
    const [refThumbs, setRefThumbs] = useState([]);
    const [variationCount, setVariationCount] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState([]);

    const [primaryColor, setPrimaryColor] = useState('#0071e3');
    const [secondaryColor, setSecondaryColor] = useState('#ff3b30');
    const [useSecondaryColor, setUseSecondaryColor] = useState(false);

    const [previewImage, setPreviewImage] = useState(null);

    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlInput, setUrlInput] = useState('');

    const [queueState, setQueueState] = useState(queueStore.getState());

    useEffect(() => {
        const unsubscribe = queueStore.subscribe(setQueueState);
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (queueState.completedJobs.length > 0) {
            setGeneratedImages(queueState.completedJobs[0].result);
        }
    }, [queueState.completedJobs]);

    // Update instructions when subTab changes
    useEffect(() => {
        if (subTab === 'character') {
            setInstructions('Remove the person from the image.');
        } else {
            setInstructions('Remove the background from the image.');
        }
    }, [subTab]);

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
        setShowUrlInput(false);
    };

    const loadCharacters = async () => {
        const chars = await getCharacters();
        setCharacters(chars);
    };

    useEffect(() => {
        loadCharacters();
    }, [showCharManager]);

    // Parse @ mentions from text and return character images
    const parseCharacterMentions = (text) => {
        if (!text) return [];
        const mentionPattern = /@(\w+)/g;
        const mentions = [];
        let match;

        while ((match = mentionPattern.exec(text)) !== null) {
            const characterName = match[1];
            const character = characters.find(c =>
                c.name.toLowerCase() === characterName.toLowerCase()
            );
            if (character && character.images) {
                mentions.push(...character.images);
            }
        }

        return mentions;
    };

    const handleRefThumbUpload = (e) => {
        if (e.target.files) {
            const newThumbs = Array.from(e.target.files).map(file => {
                const url = URL.createObjectURL(file);
                return {
                    file,
                    preview: url,
                    original: url, // Keep original for base_image
                    isAnnotated: false // Default to false for uploads
                };
            });
            setRefThumbs(prev => [...prev, ...newThumbs]);
        }
    };

    const removeRefThumb = (index) => {
        setRefThumbs(prev => prev.filter((_, i) => i !== index));
    };

    const handleGenerate = async () => {
        const apiKey = localStorage.getItem('google_api_key');
        if (!apiKey) {
            alert('Please set your API key in settings');
            return;
        }

        try {
            // Parse @ mentions from instructions to get character images
            const instructionMentions = parseCharacterMentions(instructions);
            const characterFaces = [...new Set([...instructionMentions])];

            let finalInstructions = instructions;
            if (refThumbs.length === 1 && !(instructions || '').toLowerCase().includes('recreate')) {
                finalInstructions = `Recreate the style and composition of the reference thumbnail exactly. ${instructions}`;
            }

            // Step 1: Pixel Extraction (Workflow Requirement)
            let maskImage = null;
            let baseImage = null;

            // Only attempt mask extraction if the thumbnail is explicitly annotated
            if (refThumbs.length > 0 && refThumbs[0].isAnnotated) {
                if (refThumbs[0].mask) {
                    // Use explicit mask from DrawingModal
                    maskImage = refThumbs[0].mask;
                    baseImage = refThumbs[0].original || refThumbs[0].preview;
                } else {
                    try {
                        // Use the original (clean) image as base if available, otherwise preview
                        const originalImage = refThumbs[0].original || refThumbs[0].preview;
                        // Use the preview (annotated) image to extract the mask
                        const annotatedImage = refThumbs[0].preview;

                        console.log("Attempting to extract mask from reference image...");
                        maskImage = await createMaskFromBlue(annotatedImage);
                        console.log("Mask extraction complete.");

                        // Step 1b: Create Clean Plate (Black Hole)
                        if (maskImage) {
                            console.log("Creating Clean Plate (Black Hole)...");
                            baseImage = await createCleanPlate(originalImage, maskImage);
                        } else {
                            baseImage = originalImage;
                        }

                    } catch (err) {
                        console.error("Mask extraction CRITICAL FAILURE:", err);
                        alert("Error processing image mask. Aborting generation to prevent artifacts.");
                        return;
                    }
                }
            }

            // Add to Queue instead of direct call
            queueStore.addJob({
                apiParams: {
                    instructions: finalInstructions,
                    brandColors: {
                        primary: primaryColor,
                        secondary: useSecondaryColor ? secondaryColor : null
                    },
                    characterImages: characterFaces,
                    refThumbs: refThumbs.map(t => t.preview),
                    baseImage,
                    maskImage,
                    variationCount
                },
                meta: {
                    topic: subTab === 'character' ? "Character Removal" : "Background Removal",
                    instructions: finalInstructions,
                    brandColors: {
                        primary: primaryColor,
                        secondary: useSecondaryColor ? secondaryColor : null
                    }
                }
            });

        } catch (error) {
            console.error("Queue addition failed:", error);
            alert(`Failed to queue: ${error.message}`);
        }
    };

    const downloadImage = (imageUrl, index) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `thumbnail-${index + 1}.png`;
        link.click();
    };

    const handleSaveGeneration = (img, idx) => {
        saveItem({
            images: [img],
            instructions,
            characterNames: characters.map(c => c.name),
        });
        alert('Saved to collection!');
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

    const handleAdjust = (img) => {
        setRefThumbs(prev => [...prev, { file: null, preview: img }]);
    };

    const handleDraw = (img) => {
        setDrawingImage(img);
        setShowDrawing(true);
    };

    const handleConfirmDraw = (annotatedImage, prompt, maskImage) => {
        // When confirming draw, we update the preview AND the original
        // This ensures that if no mask is found, the composition is used as the base image.

        if (prompt) {
            setInstructions(prev => {
                const cleanPrompt = prompt.trim();
                if (!cleanPrompt) return prev;
                // Avoid duplicate prompts if possible, or just append
                return prev ? `${prev}. ${cleanPrompt}` : cleanPrompt;
            });
        }

        if (refThumbs.length > 0) {
            const newThumbs = [...refThumbs];
            newThumbs[0] = {
                ...newThumbs[0],
                preview: annotatedImage,
                original: annotatedImage, // Update original to match composition
                isAnnotated: true, // Mark as annotated so we check for blue masks
                mask: maskImage // Store explicit mask
            };
            setRefThumbs(newThumbs);
        } else {
            // If no thumbs existed (started from scratch?), add one
            setRefThumbs([{ file: null, preview: annotatedImage, original: annotatedImage, isAnnotated: true, mask: maskImage }]);
        }
    };

    const handlePaste = async (e) => {
        const items = e.clipboardData.items;
        const newThumbs = [];

        // 1. Handle Images
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                const url = URL.createObjectURL(blob);
                newThumbs.push({
                    file: blob,
                    preview: url,
                    original: url,
                    isAnnotated: false
                });
            }
        }

        // 2. Handle Text (YouTube URLs)
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

                newThumbs.push({
                    file: file,
                    preview: finalUrl,
                    original: finalUrl,
                    isAnnotated: false
                });
            }
        }

        if (newThumbs.length > 0) {
            setRefThumbs(prev => [...prev, ...newThumbs]);
        }
    };

    const handleRerun = async (historyItem) => {
        setInstructions(historyItem.instructions || 'Remove the person from the image.');

        if (historyItem.brandColors) {
            setPrimaryColor(historyItem.brandColors.primary || '#0071e3');
            if (historyItem.brandColors.secondary) {
                setSecondaryColor(historyItem.brandColors.secondary);
                setUseSecondaryColor(true);
            } else {
                setUseSecondaryColor(false);
            }
        }

        // Restore reference thumbnails
        if (historyItem.refThumbs && historyItem.refThumbs.length > 0) {
            const restoredThumbs = await Promise.all(historyItem.refThumbs.map(async (url) => {
                let blob = null;
                if (url.startsWith('data:')) {
                    const res = await fetch(url);
                    blob = await res.blob();
                }
                return {
                    file: blob,
                    preview: url,
                    original: url,
                    isAnnotated: false
                };
            }));
            setRefThumbs(restoredThumbs);
        } else {
            setRefThumbs([]);
        }
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

            {/* Saved Button */}
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
                        {extraHeaderContent}

                        {/* Sub-tabs for Remover */}
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            marginTop: '8px',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '6px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <button
                                onClick={() => setSubTab('character')}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: subTab === 'character' ? '#ff982b' : 'rgba(255,255,255,0.05)',
                                    color: subTab === 'character' ? 'white' : 'rgba(255,255,255,0.5)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                <UserX size={16} />
                                Character
                            </button>
                            <button
                                onClick={() => setSubTab('background')}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: subTab === 'background' ? '#ff982b' : 'rgba(255,255,255,0.05)',
                                    color: subTab === 'background' ? 'white' : 'rgba(255,255,255,0.5)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                <ImageOff size={16} />
                                Background
                            </button>
                        </div>
                    </div>
                    <div className="panel-content">
                        {/* Reference Thumbnails */}
                        <div className="input-group">
                            <label>Thumbnail</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <div className="mini-upload" onClick={() => document.getElementById('thumb-upload').click()} style={{ width: 'auto', padding: '0 16px' }}>
                                    <input
                                        id="thumb-upload"
                                        type="file"
                                        accept="image/*"
                                        multiple
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
                                                padding: '4px 8px',
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
                                <div className="faces-grid" style={{ marginTop: '8px' }}>
                                    {refThumbs.map((thumb, idx) => (
                                        <div key={idx} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setPreviewImage(thumb.preview)}>
                                            <img src={thumb.preview} alt="Ref" className="face-preview" />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeRefThumb(idx); }}
                                                style={{
                                                    position: 'absolute', top: 2, right: 2,
                                                    background: 'var(--error)', color: 'white',
                                                    borderRadius: '50%', width: 20, height: 20,
                                                    border: 'none', cursor: 'pointer', fontSize: '12px',
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

                        {/* Instructions */}
                        <div className="input-group">
                            <label>Instructions</label>
                            <HighlightTextarea
                                placeholder="What should we change? E.g. 'Make it more vibrant' (use @CharacterName to reference characters)"
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                rows={3}
                                characters={characters}
                            />
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

                        {/* Magic Canvas Button - Prominent */}
                        <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                            <button
                                className="btn-glass"
                                onClick={() => {
                                    const refImg = refThumbs.length > 0 ? refThumbs[0].preview : null;
                                    setDrawingImage(refImg);
                                    setShowDrawing(true);
                                }}
                                style={{
                                    width: '100%',
                                    height: '50px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'}
                            >
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    backgroundColor: '#ff982b',
                                    maskImage: 'url(/canvas-icon.png)',
                                    maskSize: 'contain',
                                    maskRepeat: 'no-repeat',
                                    maskPosition: 'center',
                                    WebkitMaskImage: 'url(/canvas-icon.png)',
                                    WebkitMaskSize: 'contain',
                                    WebkitMaskRepeat: 'no-repeat',
                                    WebkitMaskPosition: 'center'
                                }} />
                            </button>
                        </div>

                        {/* Generate Button */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                className="generate-btn"
                                onClick={() => handleGenerate()}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
                            >
                                {queueState.processing || queueState.queue.length > 0 ? (
                                    <div className="spinner-small"></div>
                                ) : (
                                    <Wand2 size={28} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Column */}
            <div className="panels-column results-column">
                {generatedImages?.length > 0 && (
                    <div className="glass-panel result-panel">
                        <div style={{ display: 'grid', gridTemplateColumns: getGridColumns(generatedImages.length), gap: '16px' }}>
                            {generatedImages.map((img, idx) => (
                                <div key={idx} style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                    <img src={img} alt={`Result ${idx + 1}`} className="result-image" />
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.6) 100%)',
                                            opacity: 0,
                                            transition: 'opacity 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '16px',
                                            gap: '20px'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                                    >
                                        <button className="icon-btn-glass" onClick={() => downloadImage(img, idx)} title="Download">
                                            <DownloadIcon size={20} />
                                        </button>
                                        <button className="icon-btn-glass" onClick={() => handleCopyImage(img)} title="Copy to Clipboard">
                                            <Copy size={20} />
                                        </button>
                                        <button className="icon-btn-glass" onClick={() => handleDraw(img)} title="Draw / Semantic Edit">
                                            <PenTool size={20} />
                                        </button>
                                        <button className="icon-btn-glass" onClick={() => handleAdjust(img)} title="Adjust">
                                            <GitBranch size={20} />
                                        </button>
                                        <button className="icon-btn-glass" onClick={() => handleSaveGeneration(img, idx)} title="Save to Collection">
                                            <Heart size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCharManager && (
                <CharacterManager
                    isOpen={showCharManager}
                    onClose={() => setShowCharManager(false)}
                    onSaveSuccess={loadCharacters}
                    initialCharacters={characters}
                />
            )}

            {showHistory && (
                <HistoryModal
                    isOpen={showHistory}
                    onClose={() => setShowHistory(false)}
                    onRerun={handleRerun}
                />
            )}

            {showSaved && (
                <SavedModal
                    isOpen={showSaved}
                    onClose={() => setShowSaved(false)}
                />
            )}

            {showDrawing && (
                <DrawingModal
                    isOpen={showDrawing}
                    onClose={() => setShowDrawing(false)}
                    imageUrl={drawingImage}
                    onConfirm={handleConfirmDraw}
                />
            )}

            {/* Full Screen Preview */}
            {previewImage && createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0, 0, 0, 0.9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 10000,
                    padding: '40px'
                }} onClick={() => setPreviewImage(null)}>
                    <button
                        onClick={() => setPreviewImage(null)}
                        style={{
                            position: 'absolute', top: '20px', right: '20px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '50%', width: '40px', height: '40px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'white'
                        }}
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={previewImage}
                        alt="Preview"
                        style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '12px' }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>,
                document.body
            )}
        </div>
    );
};

export default Remover;
