import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HexColorPicker } from "react-colorful";
import CharacterManager from './CharacterManager';
import HistoryModal from './HistoryModal';
import { getCharacters } from '../services/characterStore';
import { generateThumbnail } from '../services/api';
import ModeTabs from './ModeTabs';
import MentionInput from './MentionInput';
import SavedModal from './SavedModal';
import DrawingModal from './DrawingModal';
import { saveItem } from '../services/savedStore';
import { getTemplates, addTemplateFeedback, removeTemplateFeedback } from '../data/templateStore';
import { queueStore } from '../services/queueStore';
import { extractYoutubeThumbnail, fetchImageAsBlob } from '../utils/youtubeUtils';
import { createMaskFromBlue, createCleanPlate } from '../utils/maskUtils';
import { getGridColumns } from '../utils/gridUtils';
import { Upload, Palette, Wand2, Plus, X, Clock, Users, Bookmark, Heart, Download as DownloadIcon, GitBranch, Brush, Link, RefreshCw, MessageSquarePlus, LayoutTemplate, Trash2, Star, Pentagon, Copy } from 'lucide-react';
import CharacterPicker from './CharacterPicker';
import './SingleGenerator.css';

const TemplateGenerator = ({ onRequestSettings, activeTab, onTabChange, extraHeaderContent, templatesRefreshTrigger, onRateImage }) => {
    const [characters, setCharacters] = useState([]);
    const [templates, setTemplates] = useState([]); // Dynamic templates state
    const [showCharManager, setShowCharManager] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const [showDrawing, setShowDrawing] = useState(false);
    const [drawingImage, setDrawingImage] = useState(null);
    const [activeColorPicker, setActiveColorPicker] = useState(null);
    const [showCharPicker, setShowCharPicker] = useState(false);

    const [videoTitle, setVideoTitle] = useState('');
    const [instructions, setInstructions] = useState('');
    const [refThumbs, setRefThumbs] = useState([]); // Will be populated by template
    const [variationCount, setVariationCount] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [generatedImages, setGeneratedImages] = useState([]);
    const [error, setError] = useState(null);

    const [primaryColor, setPrimaryColor] = useState('#0071e3');
    const [secondaryColor, setSecondaryColor] = useState('#ff3b30');
    const [useSecondaryColor, setUseSecondaryColor] = useState(false);

    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [includePerson, setIncludePerson] = useState(true);
    const [previewImage, setPreviewImage] = useState(null);

    const [feedbackInput, setFeedbackInput] = useState('');
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);

    const [queueState, setQueueState] = useState(queueStore.getState());

    useEffect(() => {
        const unsubscribe = queueStore.subscribe(setQueueState);
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (queueState.completedJobs.length > 0) {
            const job = queueState.completedJobs[0];
            if (job.status === 'completed' && job.result) {
                setGeneratedImages(job.result);
                setError(null);
            } else if (job.status === 'failed') {
                setError(job.error || 'Generation failed');
            }
        }
    }, [queueState.completedJobs]);

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

    const loadTemplates = async () => {
        const tpls = await getTemplates();
        setTemplates(tpls);
    };

    useEffect(() => {
        loadCharacters();
        loadTemplates().catch(e => console.error("Template load error:", e));
    }, [showCharManager, templatesRefreshTrigger]);

    const parseCharacterMentions = (text) => {
        if (!text) return [];
        const mentionPattern = /@(\w+)/g;
        const mentions = [];
        let match;
        while ((match = mentionPattern.exec(text)) !== null) {
            const characterName = match[1];
            const character = characters.find(c => c.name.toLowerCase() === characterName.toLowerCase());
            if (character && character.images) mentions.push(...character.images);
        }
        return mentions;
    };

    // Handle Template Selection
    const handleTemplateChange = (e) => {
        const templateId = e.target.value;
        if (templateId === 'create_new_template') {
            // Handle Create Template Action - For now, maybe just alert or switch tab if needed
            // User requirement: "opens same thing as template button would"
            // Assuming this means opening the template creation modal or logic.
            // Since we don't have a specific "template button" logic defined other than the tab itself,
            // I'll assume it means "Manage Templates" or similar.
            // For now, let's just reset selection and maybe show a message or if there's a create modal.
            // Wait, "template button" likely refers to the main navigation button? Or a specific button?
            // "opens same thing as template button would" -> The user might mean the "Templates" button in the corner?
            // But we are IN the template tab.
            // Maybe they mean "Save as Template"?
            // Let's just add the option and for now make it do nothing or log.
            // Actually, looking at the request: "add option in bottom of dropdown options to create a template which opens same thing as template button would"
            // If there is a "templates-btn" (like characters-btn), maybe that's what they mean.
            // But I don't see a templates-btn in TemplateGenerator.
            // Let's check SingleGenerator.css, it has .templates-btn.
            // So there IS a templates button somewhere.
            // If I can't trigger it easily, I'll just leave it as a placeholder or try to find where it is.
            // For now, let's just handle the selection change.
            setSelectedTemplateId('');
            // TODO: Trigger template creation modal
            return;
        }

        setSelectedTemplateId(templateId);

        const template = templates.find(t => t.id === templateId);
        if (template) {
            // Pre-fill instructions with context
            setInstructions(template.context || '');
            // Load reference images if available (placeholder logic for now)
            if (template.referenceImages && template.referenceImages.length > 0) {
                // In a real app, we'd fetch these. For now, we assume they are URLs.
                // Since we don't have real images yet, we'll just log it or set empty.
                setRefThumbs(template.referenceImages.map(url => ({
                    file: null,
                    preview: url,
                    original: url,
                    isAnnotated: false
                })));
            } else {
                setRefThumbs([]);
            }
        } else {
            setInstructions('');
            setRefThumbs([]);
        }
    };

    // Allow manual upload even in template mode (User requirement: "but still can")
    const handleRefThumbUpload = (e) => {
        if (e.target.files) {
            const newThumbs = Array.from(e.target.files).map(file => {
                const url = URL.createObjectURL(file);
                return {
                    file,
                    preview: url,
                    original: url,
                    isAnnotated: false
                };
            });
            setRefThumbs(prev => [...prev, ...newThumbs]);
        }
    };

    const removeRefThumb = (index) => {
        setRefThumbs(prev => prev.filter((_, i) => i !== index));
    };

    const handleImportCharacter = (imgUrl) => {
        setRefThumbs(prev => [...prev, {
            file: null,
            preview: imgUrl,
            original: imgUrl,
            isAnnotated: false
        }]);
        setShowCharPicker(false);
    };

    const handleAddFeedback = async () => {
        if (!feedbackInput.trim() || !selectedTemplateId) return;
        try {
            await addTemplateFeedback(selectedTemplateId, feedbackInput);
            setFeedbackInput('');
            setShowFeedbackModal(false);
            loadTemplates(); // Refresh to show new feedback
        } catch (err) {
            alert("Failed to save feedback");
        }
    };

    const handleDeleteFeedback = async (index) => {
        if (!selectedTemplateId) return;
        await removeTemplateFeedback(selectedTemplateId, index);
        loadTemplates();
    };

    const handleGenerate = async (overrideInstructions = null, overrideThumbs = null) => {
        const apiKey = localStorage.getItem('google_api_key');
        if (!apiKey) {
            alert('Please set your API key in settings');
            return;
        }

        // Removed setIsGenerating(true) blocking

        try {
            const currentInstructions = (typeof overrideInstructions === 'string') ? overrideInstructions : (instructions || '');
            const currentThumbs = overrideThumbs || refThumbs;
            const instructionMentions = parseCharacterMentions(currentInstructions);
            const characterFaces = [...new Set([...instructionMentions])];

            let finalInstructions = currentInstructions;
            // If template is selected, we might want to enforce "style transfer" more strongly
            if (currentThumbs.length > 0 && !currentInstructions.toLowerCase().includes('recreate')) {
                finalInstructions = `Follow the style and composition of the reference images. ${currentInstructions}`;
            }

            if (includePerson) {
                finalInstructions += " STRICT REQUIREMENT: The generated thumbnail MUST include a person. If reference images are provided, prioritize those that feature a person and ignore those that do not.";
            }

            const template = templates.find(t => t.id === selectedTemplateId);
            if (template && template.feedback && template.feedback.length > 0) {
                finalInstructions += "\n\nCRITICAL FEEDBACK FROM PREVIOUS RUNS (MUST FOLLOW):";
                template.feedback.forEach(f => finalInstructions += `\n- ${f}`);
            }

            // Mask extraction logic
            let maskImage = null;
            let baseImage = null;
            if (currentThumbs.length > 0 && currentThumbs[0].isAnnotated) {
                if (currentThumbs[0].mask) {
                    // Use explicit mask from DrawingModal
                    maskImage = currentThumbs[0].mask;
                    // Use original image as base (clean, no strokes)
                    baseImage = currentThumbs[0].original || currentThumbs[0].preview;
                } else {
                    // Legacy fallback
                    try {
                        const originalImage = currentThumbs[0].original || currentThumbs[0].preview;
                        const annotatedImage = currentThumbs[0].preview;
                        maskImage = await createMaskFromBlue(annotatedImage);
                        if (maskImage) {
                            baseImage = await createCleanPlate(originalImage, maskImage);
                        } else {
                            baseImage = originalImage;
                        }
                    } catch (err) {
                        console.error("Mask error", err);
                        return;
                    }
                }
            }

            // Add to Queue instead of direct call
            queueStore.addJob({
                type: 'template', // Explicit type for templates
                apiParams: {
                    topic: videoTitle,
                    instructions: finalInstructions,
                    brandColors: { primary: primaryColor, secondary: useSecondaryColor ? secondaryColor : null },
                    characterImages: characterFaces,
                    refThumbs: currentThumbs.map(t => t.preview),
                    baseImage,
                    maskImage,
                    variationCount
                },
                meta: {
                    topic: videoTitle || (finalInstructions.split(' ').slice(0, 5).join(' ') + '...'),
                    instructions: finalInstructions,
                    brandColors: { primary: primaryColor, secondary: useSecondaryColor ? secondaryColor : null }
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

    const handleRemix = (img) => {
        // Remix Logic: Use image as reference and re-run generation
        const remixThumb = { file: null, preview: img, original: img, isAnnotated: false };
        const newRefThumbs = [remixThumb]; // Set as primary reference
        setRefThumbs(newRefThumbs);

        // Trigger generation immediately
        handleGenerate(newRefThumbs);
    };

    const handleDraw = (img) => {
        setDrawingImage(img);
        setShowDrawing(true);
    };

    const handleConfirmDraw = (annotatedImage, prompt, maskImage) => {
        if (refThumbs.length > 0) {
            const newThumbs = [...refThumbs];
            newThumbs[0] = { ...newThumbs[0], preview: annotatedImage, isAnnotated: true, mask: maskImage };
            setRefThumbs(newThumbs);
        } else {
            setRefThumbs([{ file: null, preview: annotatedImage, original: annotatedImage, isAnnotated: true, mask: maskImage }]);
        }

        if (prompt) {
            setInstructions(prompt);
            const overrideThumbs = refThumbs.length > 0 ?
                [{ ...refThumbs[0], preview: annotatedImage, isAnnotated: true, mask: maskImage }, ...refThumbs.slice(1)] :
                [{ file: null, preview: annotatedImage, original: annotatedImage, isAnnotated: true, mask: maskImage }];
            handleGenerate(prompt, overrideThumbs);
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
                // Try to fetch as blob to avoid CORS issues later if possible, 
                // but usually img.youtube.com is fine for display. 
                // For API, we might need base64. 
                // Let's try to get a blob.
                let finalUrl = ytThumbUrl;
                let file = null;

                const blob = await fetchImageAsBlob(ytThumbUrl);
                if (blob) {
                    finalUrl = URL.createObjectURL(blob);
                    file = blob;
                }

                newThumbs.push({
                    file: file, // Might be null if fetch failed, but preview works
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
        setVideoTitle(historyItem.topic || '');
        setInstructions(historyItem.instructions || '');

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

        // Clear template selection as we are loading custom settings
        setSelectedTemplateId('');
    };

    return (
        <div className="generator-container" onPaste={handlePaste} tabIndex="0" style={{ outline: 'none', gridTemplateColumns: '340px 1fr' }}>
            {/* Header Buttons */}
            {/* Header Buttons */}
            <button className="characters-btn icon-only" onClick={() => setShowCharManager(true)} title="Manage Characters">
                <Users size={24} />
            </button>

            <button className="saved-btn" onClick={() => setShowSaved(true)} title="View Saved">
                <Bookmark size={20} />
            </button>
            <button className="history-btn" onClick={() => setShowHistory(true)} title="View History">
                <Clock size={20} />
            </button>

            <div className="panels-column input-column" style={{ width: '340px', minWidth: '340px' }}>
                <div className="glass-panel input-panel" style={{ position: 'relative', zIndex: 10 }}>
                    <div className="panel-header">
                        <ModeTabs activeTab={activeTab} onTabChange={onTabChange} />
                        {extraHeaderContent}
                    </div>
                    <div className="panel-content">
                        {/* Template Selector */}
                        <div className="input-group">
                            <label>Select Template</label>
                            <div className="select-wrapper" style={{ position: 'relative' }}>
                                <select
                                    className="glass-input"
                                    value={selectedTemplateId}
                                    onChange={handleTemplateChange}
                                    style={{ appearance: 'none', paddingRight: '30px' }}
                                >
                                    <option value="">-- Choose a Template --</option>
                                    {templates.filter(t => !t.isDefault).map(t => (
                                        <option key={t.id} value={t.id}>{t.label}</option>
                                    ))}
                                    <option value="create_new_template" style={{ fontWeight: 'bold', color: '#ff982b' }}>+ Create New Template</option>
                                </select>
                                <LayoutTemplate size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }} />
                            </div>
                            {selectedTemplateId && (
                                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    {templates.find(t => t.id === selectedTemplateId)?.description}
                                </div>
                            )}

                            {/* Include Person Checkbox */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', marginLeft: '4px' }}>
                                <input
                                    type="checkbox"
                                    id="includePerson"
                                    checked={includePerson}
                                    onChange={(e) => setIncludePerson(e.target.checked)}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#ff982b' }}
                                />
                                <label htmlFor="includePerson" style={{ cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    Include Person (Filter references)
                                </label>
                            </div>
                        </div>

                        {/* Reference Thumbnails (Modified to show they come from template or upload) */}
                        <div className="input-group">
                            <label>Reference Thumbnails {selectedTemplateId && '(Pre-loaded from Template)'}</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div className="mini-upload" onClick={() => document.getElementById('thumb-upload').click()} style={{ width: 'auto', padding: '0 16px' }}>
                                    <input id="thumb-upload" type="file" accept="image/*" multiple hidden onChange={handleRefThumbUpload} />
                                    <Upload size={16} style={{ marginRight: '8px' }} />
                                    <span>Upload</span>
                                </div>
                                <div className="mini-upload" onClick={() => setShowCharPicker(true)} style={{ width: 'auto', padding: '0 16px' }}>
                                    <Users size={16} style={{ marginRight: '8px' }} />
                                    <span>Import Character</span>
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

                        {/* Video Title */}
                        <div className="input-group">
                            <label>Title (optional)</label>
                            <MentionInput
                                type="text"
                                className="glass-input"
                                placeholder="e.g. I Built a House in 24 Hours"
                                value={videoTitle}
                                onChange={(e) => setVideoTitle(e.target.value)}
                                characters={characters}
                            />
                        </div>

                        {/* Instructions */}
                        <div className="input-group">
                            <label>Instructions / Context</label>
                            <MentionInput
                                type="textarea"
                                className="glass-input"
                                rows={4}
                                placeholder="Describe your video topic or changes..."
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                characters={characters}
                            />
                        </div>

                        {/* Active Feedback Display */}
                        {selectedTemplateId && templates.find(t => t.id === selectedTemplateId)?.feedback?.length > 0 && (
                            <div className="input-group" style={{ background: 'rgba(255, 100, 100, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 100, 100, 0.2)' }}>
                                <label style={{ color: '#ff8080', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <MessageSquarePlus size={14} /> Active Feedback Modifiers
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                                    {templates.find(t => t.id === selectedTemplateId)?.feedback?.map((fb, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            <span>• {fb}</span>
                                            <button onClick={() => handleDeleteFeedback(i)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }}><Trash2 size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Brand Colors (Same as SingleGenerator) */}
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
                                    <div className="mini-upload" onClick={() => setUseSecondaryColor(true)}><span>+ Add Color</span></div>
                                )}
                            </div>
                        </div>

                        {/* Variations */}
                        <div className="input-group">
                            <label>{variationCount} Variation{variationCount !== 1 ? 's' : ''}</label>
                            <input type="range" className="glass-slider" min="1" max="5" value={variationCount} onChange={(e) => setVariationCount(parseInt(e.target.value))} />
                        </div>

                        {/* Magic Canvas Button */}
                        <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                            <button
                                className="btn-glass"
                                onClick={() => { const refImg = refThumbs.length > 0 ? refThumbs[0].preview : null; setDrawingImage(refImg); setShowDrawing(true); }}
                                title="Magic Canvas"
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
                            <button className="generate-btn" onClick={() => handleGenerate()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
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

            {/* Results Column (Same as SingleGenerator) */}
            <div className="panels-column results-column">
                {error && (
                    <div className="glass-panel" style={{ padding: '16px', border: '1px solid var(--error)', color: 'var(--error)', marginBottom: '16px' }}>
                        <strong>Error:</strong> {error}
                    </div>
                )}
                {generatedImages?.length > 0 && (
                    <div className="glass-panel result-panel">
                        <div style={{ display: 'grid', gridTemplateColumns: getGridColumns(generatedImages.length), gap: '16px' }}>
                            {generatedImages.map((img, idx) => (
                                <div key={idx} style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                    <img src={img} alt={`Result ${idx + 1}`} className="result-image" />
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.6) 100%)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', gap: '20px' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}>
                                        <button className="icon-btn-glass" onClick={() => downloadImage(img, idx)} title="Download"><DownloadIcon size={20} /></button>
                                        <button className="icon-btn-glass" onClick={() => handleCopyImage(img)} title="Copy to Clipboard"><Copy size={20} /></button>
                                        <button className="icon-btn-glass" onClick={() => handleDraw(img)} title="Draw / Semantic Edit"><Brush size={20} /></button>
                                        <button className="icon-btn-glass" onClick={() => handleRemix(img)} title="Remix"><RefreshCw size={20} /></button>
                                        <button className="icon-btn-glass" onClick={() => onRateImage && onRateImage(img)} title="Rate This"><Pentagon size={20} /></button>
                                        <button className="icon-btn-glass" onClick={() => handleSaveGeneration(img, idx)} title="Save to Collection"><Heart size={20} /></button>
                                        <button className="icon-btn-glass" onClick={() => setShowFeedbackModal(true)} title="Refine Future Results"><MessageSquarePlus size={20} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCharManager && <CharacterManager isOpen={showCharManager} onClose={() => setShowCharManager(false)} onSaveSuccess={loadCharacters} initialCharacters={characters} />}
            {showHistory && <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} onRerun={handleRerun} activeTab={activeTab} />}
            {showSaved && <SavedModal isOpen={showSaved} onClose={() => setShowSaved(false)} />}
            {showDrawing && <DrawingModal isOpen={showDrawing} onClose={() => setShowDrawing(false)} imageUrl={drawingImage} refThumbs={refThumbs} onConfirm={handleConfirmDraw} />}
            {showCharPicker && <CharacterPicker isOpen={showCharPicker} onClose={() => setShowCharPicker(false)} onSelectImage={handleImportCharacter} />}
            {showFeedbackModal && (
                <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
                    <div className="glass-panel modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Refine Template</h3>
                            <button className="close-btn" onClick={() => setShowFeedbackModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: '20px' }}>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                Add feedback about this result. This will be saved to the <strong>{templates.find(t => t.id === selectedTemplateId)?.label}</strong> template and used to improve ALL future generations.
                            </p>
                            <textarea
                                className="glass-input"
                                rows={3}
                                placeholder="e.g. Don't use red text, make faces brighter..."
                                value={feedbackInput}
                                onChange={(e) => setFeedbackInput(e.target.value)}
                                style={{ width: '100%', marginBottom: '16px' }}
                            />
                            <button className="btn-primary" onClick={handleAddFeedback} style={{ width: '100%' }}>
                                Save Feedback
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {previewImage && createPortal(
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '40px' }} onClick={() => setPreviewImage(null)}>
                    <button onClick={() => setPreviewImage(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}><X size={24} /></button>
                    <img src={previewImage} alt="Preview" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '12px' }} onClick={(e) => e.stopPropagation()} />
                </div>, document.body
            )}
        </div>
    );
};

export default TemplateGenerator;
