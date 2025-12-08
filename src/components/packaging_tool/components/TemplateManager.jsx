import React, { useState, useEffect } from 'react';
import { X, Upload, Save, Loader2, Edit2, Trash2, Plus, ArrowLeft, RotateCcw, LayoutTemplate, Image as ImageIcon, Check } from 'lucide-react';
import { getTemplates, saveTemplate, deleteTemplate, resetTemplate, fileToBase64 } from '../data/templateStore';
import { getAssets, saveAsset, deleteAsset } from '../services/assetStore';
import './TemplateManager.css';

const TemplateManager = ({ isOpen, onClose, onSaveSuccess }) => {
    const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'assets'
    const [templates, setTemplates] = useState([]);
    const [assets, setAssets] = useState([]);
    const [editingTemplate, setEditingTemplate] = useState(null);

    // Form State
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [context, setContext] = useState('');
    const [referenceImages, setReferenceImages] = useState([]); // Array of { file, preview } or strings (urls/base64)
    const [isSaving, setIsSaving] = useState(false);
    const [showAssetPicker, setShowAssetPicker] = useState(false);

    const loadTemplates = async () => {
        const tpls = await getTemplates();
        setTemplates(tpls);
    };

    const loadAssets = async () => {
        const assts = await getAssets();
        setAssets(assts);
    };

    useEffect(() => {
        if (isOpen) {
            loadTemplates();
            loadAssets();
        }
    }, [isOpen]);

    const resetForm = () => {
        setLabel('');
        setDescription('');
        setContext('');
        setReferenceImages([]);
        setEditingTemplate(null);
        setShowAssetPicker(false);
    };

    const handleImageUpload = (e) => {
        if (e.target.files) {
            const newImages = Array.from(e.target.files).map(file => ({
                file,
                preview: URL.createObjectURL(file)
            }));
            setReferenceImages(prev => [...prev, ...newImages]);
        }
    };

    const handleAssetUpload = async (e) => {
        if (e.target.files) {
            setIsSaving(true);
            try {
                await Promise.all(Array.from(e.target.files).map(file => saveAsset(file)));
                await loadAssets();
            } catch (err) {
                console.error("Asset upload failed", err);
                alert("Failed to upload asset");
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleDeleteAsset = async (id) => {
        if (window.confirm("Delete this asset from the library?")) {
            await deleteAsset(id);
            await loadAssets();
        }
    };

    const handleSelectAsset = (asset) => {
        // When selecting an asset for a template, we just use its data (base64)
        setReferenceImages(prev => [...prev, { preview: asset.data }]);
        setShowAssetPicker(false);
    };

    const handleRemoveImage = (index) => {
        setReferenceImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!label) {
            alert("Template name is required.");
            return;
        }

        // Check for duplicate name
        const nameExists = templates.some(t =>
            t.label.toLowerCase() === label.toLowerCase() &&
            (!editingTemplate || t.id !== editingTemplate.id)
        );

        if (nameExists) {
            alert("A template with this name already exists.");
            return;
        }

        setIsSaving(true);
        try {
            // Process images
            const processedImages = await Promise.all(referenceImages.map(async (img) => {
                if (img.file) {
                    return await fileToBase64(img.file);
                }
                return img.preview || img; // Handle existing strings or preview objects that are just strings
            }));

            const templateData = {
                id: editingTemplate ? editingTemplate.id : null,
                label,
                description,
                context,
                referenceImages: processedImages,
                isDefault: editingTemplate ? editingTemplate.isDefault : false
            };

            await saveTemplate(templateData);

            resetForm();
            setView('list');
            await loadTemplates();
            onSaveSuccess();
        } catch (error) {
            console.error("Failed to save template:", error);
            alert(`Failed to save template: ${error.message || error}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id, isDefault) => {
        if (isDefault) {
            if (window.confirm("Are you sure you want to reset this default template to its original state?")) {
                await resetTemplate(id);
                await loadTemplates();
                onSaveSuccess();
            }
        } else {
            if (window.confirm("Are you sure you want to delete this template?")) {
                await deleteTemplate(id);
                await loadTemplates();
                onSaveSuccess();
            }
        }
    };

    const startEdit = (tpl) => {
        setEditingTemplate(tpl);
        setLabel(tpl.label);
        setDescription(tpl.description || '');
        setContext(tpl.context || '');
        // Ensure images are in a format we can display
        setReferenceImages(tpl.referenceImages.map(img => ({ preview: img })));
        setView('edit');
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="glass-panel modal-content template-manager-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    {view !== 'list' && view !== 'assets' && (
                        <button className="back-btn" onClick={() => { setView('list'); resetForm(); }}>
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    {view === 'assets' && (
                        <button className="back-btn" onClick={() => setView('list')}>
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <h3>
                        {view === 'list' ? 'Manage Templates' :
                            view === 'create' ? 'New Template' :
                                view === 'assets' ? 'Asset Library' : 'Edit Template'}
                    </h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {view === 'list' ? (
                    <div className="template-list-container">
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <button className="btn-glass new-template-btn" onClick={() => { setView('create'); resetForm(); }} style={{ flex: 1 }}>
                                <Plus size={18} />
                                <span>Create New Template</span>
                            </button>
                            <button className="btn-glass new-template-btn" onClick={() => setView('assets')} style={{ flex: 1, background: 'rgba(255, 255, 255, 0.05)' }}>
                                <ImageIcon size={18} />
                                <span>Asset Library</span>
                            </button>
                        </div>

                        <div className="template-list">
                            {templates.map(tpl => (
                                <div key={tpl.id} className="template-card">
                                    {tpl.isDefault && <span className="default-badge">Default</span>}
                                    <div className="template-card-header">
                                        <div className="template-info">
                                            <h4>{tpl.label}</h4>
                                            <p>{tpl.description}</p>
                                        </div>
                                    </div>

                                    {tpl.referenceImages && tpl.referenceImages.length > 0 && (
                                        <div className="template-preview-grid">
                                            {tpl.referenceImages.slice(0, 3).map((img, i) => (
                                                <img key={i} src={img} alt="preview" className="template-preview-img" />
                                            ))}
                                        </div>
                                    )}

                                    <div className="template-actions">
                                        <button className="btn-edit" onClick={() => startEdit(tpl)}>
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        {tpl.isDefault ? (
                                            <button className="btn-reset" onClick={() => handleDelete(tpl.id, true)} title="Reset to Defaults">
                                                <RotateCcw size={14} /> Reset
                                            </button>
                                        ) : (
                                            <button className="btn-delete" onClick={() => handleDelete(tpl.id, false)} title="Delete">
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : view === 'assets' ? (
                    <div className="template-form">
                        <div className="input-group">
                            <label>Global Reference Assets</label>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                                Upload images here to reuse them across multiple templates.
                            </p>
                            <div className="mini-upload" onClick={() => document.getElementById('asset-upload').click()} style={{ marginBottom: '20px' }}>
                                <input id="asset-upload" type="file" accept="image/*" multiple hidden onChange={handleAssetUpload} />
                                <span>+ Upload New Assets</span>
                            </div>

                            <div className="ref-images-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px' }}>
                                {assets.map((asset) => (
                                    <div key={asset.id} className="ref-image-wrapper" style={{ width: '100%', height: '80px' }}>
                                        <img src={asset.data} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                        <button className="remove-ref-btn" onClick={() => handleDeleteAsset(asset.id)}>×</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="template-form">
                        <div className="form-row">
                            <div className="input-group">
                                <label>Template Name</label>
                                <input
                                    type="text"
                                    className="glass-input"
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                    placeholder="e.g. Gaming Highlights"
                                />
                            </div>
                            <div className="input-group">
                                <label>Description (Short)</label>
                                <input
                                    type="text"
                                    className="glass-input"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief description for the list..."
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Context / Instructions</label>
                            <textarea
                                className="glass-input"
                                rows={4}
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                placeholder="Detailed instructions for the AI. E.g. 'Use bright colors, large text...'"
                            />
                        </div>

                        <div className="input-group">
                            <label>Reference Images</label>
                            <div className="ref-images-container">
                                {referenceImages.map((img, idx) => (
                                    <div key={idx} className="ref-image-wrapper">
                                        <img src={img.preview || img} alt="ref" />
                                        <button className="remove-ref-btn" onClick={() => handleRemoveImage(idx)}>×</button>
                                    </div>
                                ))}
                                <div className="add-ref-btn" onClick={() => document.getElementById('tpl-upload').click()}>
                                    <input
                                        id="tpl-upload"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        hidden
                                        onChange={handleImageUpload}
                                    />
                                    <Plus size={20} />
                                    <span>Upload</span>
                                </div>
                                <div className="add-ref-btn" onClick={() => setShowAssetPicker(true)} style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                                    <ImageIcon size={20} />
                                    <span>Library</span>
                                </div>
                            </div>
                            {/* Paste / URL Input Area */}
                            <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    className="glass-input"
                                    placeholder="Paste Image URL or YouTube Link..."
                                    onPaste={async (e) => {
                                        const items = e.clipboardData.items;
                                        for (let i = 0; i < items.length; i++) {
                                            if (items[i].type.indexOf('image') !== -1) {
                                                const blob = items[i].getAsFile();
                                                const url = URL.createObjectURL(blob);
                                                setReferenceImages(prev => [...prev, { file: blob, preview: url }]);
                                                e.preventDefault();
                                            }
                                        }
                                    }}
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.target.value.trim();
                                            if (!val) return;

                                            // Check for YouTube
                                            // We need to import extractYoutubeThumbnail from utils if we want it here, 
                                            // or just do a simple regex check if we don't want to import.
                                            // Let's assume we can just treat it as an image URL for now unless we import the util.
                                            // Ideally we should import the util.

                                            // Simple YouTube check for now to avoid import complexity if not already there
                                            let finalUrl = val;
                                            const ytMatch = val.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                                            if (ytMatch) {
                                                finalUrl = `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
                                            }

                                            setReferenceImages(prev => [...prev, { preview: finalUrl }]);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                            </div>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                Paste images directly or enter URLs (YouTube links supported). Minimum 1 image required.
                            </p>
                        </div>

                        {/* Asset Picker Modal (Nested) */}
                        {showAssetPicker && (
                            <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setShowAssetPicker(false)}>
                                <div className="glass-panel modal-content" style={{ width: '500px', maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
                                    <div className="modal-header">
                                        <h3>Select from Library</h3>
                                        <button className="close-btn" onClick={() => setShowAssetPicker(false)}><X size={20} /></button>
                                    </div>
                                    <div className="modal-body" style={{ padding: '20px', overflowY: 'auto' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                            {assets.map(asset => (
                                                <div key={asset.id} onClick={() => handleSelectAsset(asset)} style={{ cursor: 'pointer', position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: '2px solid transparent', transition: 'all 0.2s' }}>
                                                    <img src={asset.data} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <div className="hover-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Plus color="white" />
                                                    </div>
                                                </div>
                                            ))}
                                            {assets.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-secondary)' }}>No assets in library. Go to Asset Library to upload some.</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {view !== 'list' && view !== 'assets' && (
                    <div className="modal-footer">
                        <button
                            className="btn-primary icon-only-btn"
                            onClick={handleSave}
                            disabled={isSaving || !label}
                            title="Save Template"
                        >
                            {isSaving ? <Loader2 className="spin" size={20} /> : <Save size={20} />}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TemplateManager;
