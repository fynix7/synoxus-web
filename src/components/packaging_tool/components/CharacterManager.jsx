import React, { useState, useEffect } from 'react';
import { X, Upload, Save, Loader2, Edit2, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { saveCharacter, fileToBase64, deleteCharacter } from '../services/characterStore';
import './CharacterManager.css';

const CharacterManager = ({ isOpen, onClose, onSaveSuccess, initialCharacters = [] }) => {
    const [view, setView] = useState('list'); // 'list', 'create', 'edit'
    const [characters, setCharacters] = useState(initialCharacters);
    const [editingChar, setEditingChar] = useState(null);

    // Form State
    const [name, setName] = useState('');
    const [images, setImages] = useState([]); // Array of { file, preview } or base64 strings
    const [primaryColor, setPrimaryColor] = useState('#000000');
    const [secondaryColor, setSecondaryColor] = useState('#ffffff');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setCharacters(initialCharacters);
    }, [initialCharacters]);

    const resetForm = () => {
        setName('');
        setImages([]);
        setPrimaryColor('#000000');
        setSecondaryColor('#ffffff');
        setEditingChar(null);
    };

    const handleImageUpload = (e) => {
        if (e.target.files) {
            const newImages = Array.from(e.target.files).map(file => ({
                file,
                preview: URL.createObjectURL(file)
            }));
            setImages(prev => [...prev, ...newImages].slice(0, 30));
        }
    };

    const handleRemoveImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!name || images.length === 0) return;

        // Check for duplicate name
        const nameExists = characters.some(c =>
            c.name.toLowerCase() === name.toLowerCase() &&
            (!editingChar || c.id !== editingChar.id)
        );

        if (nameExists) {
            alert("A character with this name already exists.");
            return;
        }

        setIsSaving(true);
        try {
            // Process images: some might be new files, others existing base64 strings
            const processedImages = await Promise.all(images.map(async (img) => {
                if (img.file) {
                    return await fileToBase64(img.file);
                }
                return img.preview || img; // Handle existing base64 strings
            }));

            // If editing, delete the old character first
            if (editingChar) {
                await deleteCharacter(editingChar.id);
            }

            // Save the character (creates new entry)
            await saveCharacter(name, processedImages, { primary: primaryColor, secondary: secondaryColor });

            resetForm();
            setView('list');
            onSaveSuccess(); // Notify parent to reload
        } catch (error) {
            console.error("Failed to save character:", error);
            alert(`Failed to save character: ${error.message || error}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this character?")) {
            await deleteCharacter(id);
            onSaveSuccess(); // This will trigger a reload of characters from parent
        }
    };

    const startEdit = (char) => {
        setEditingChar(char);
        setName(char.name);
        // Map existing images to the format expected by the uploader
        setImages(char.images.map(img => ({ preview: img })));
        setPrimaryColor(char.colors?.primary || '#000000');
        setSecondaryColor(char.colors?.secondary || '#ffffff');
        setView('edit');
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    {view !== 'list' && (
                        <button className="back-btn" onClick={() => { setView('list'); resetForm(); }}>
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <h3>
                        {view === 'list' ? 'Manage Characters' :
                            view === 'create' ? 'New Character' : 'Edit Character'}
                    </h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {view === 'list' ? (
                        <div className="char-list-container">
                            <button className="btn-glass new-char-btn" onClick={() => { setView('create'); resetForm(); }}>
                                <Plus size={18} />
                                <span>Create New Character</span>
                            </button>

                            <div className="char-list">
                                {characters.length === 0 ? (
                                    <p className="empty-text">No characters found.</p>
                                ) : (
                                    characters.map(char => (
                                        <div key={char.id} className="char-list-item">
                                            <div className="char-info">
                                                <img src={char.images[0]} alt={char.name} className="char-avatar" />
                                                <span>{char.name}</span>
                                            </div>
                                            <div className="char-actions">
                                                <button className="icon-btn edit" onClick={() => startEdit(char)} title="Edit">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="icon-btn delete" onClick={() => handleDelete(char.id)} title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        // Create/Edit View
                        <>
                            <div className="input-group">
                                <label>Character Name</label>
                                <input
                                    type="text"
                                    placeholder="ex: James"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="glass-input"
                                />
                            </div>

                            {/* Brand Colors */}
                            <div className="input-group">
                                <label>Brand Colors (Optional)</label>
                                <div className="colors-container-row">
                                    <div className="color-wrapper">
                                        <input
                                            type="color"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="color-swatch-btn"
                                            title="Primary Color"
                                        />
                                    </div>
                                    <div className="color-wrapper">
                                        <input
                                            type="color"
                                            value={secondaryColor}
                                            onChange={(e) => setSecondaryColor(e.target.value)}
                                            className="color-swatch-btn"
                                            title="Secondary Color"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Reference Images (1-30)</label>
                                <div className="faces-grid">
                                    {images.map((img, idx) => (
                                        <div key={idx} className="face-preview-wrapper">
                                            <img src={img.preview || img} alt="preview" className="face-preview" />
                                            <button className="remove-face-btn" onClick={() => handleRemoveImage(idx)}>×</button>
                                        </div>
                                    ))}

                                    <div className="add-references-btn" onClick={() => document.getElementById('char-upload').click()}>
                                        <input
                                            id="char-upload"
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            hidden
                                            onChange={handleImageUpload}
                                        />
                                        <span>+ Add References</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {view !== 'list' && (
                    <div className="modal-footer">
                        <button
                            className="!w-12 !h-12 !rounded-full !flex !items-center !justify-center !transition-colors !bg-white !text-black hover:!bg-[#22c55e] hover:!text-white disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
                            onClick={handleSave}
                            disabled={!name || images.length === 0 || isSaving}
                            title={view === 'edit' ? 'Update Character' : 'Save Character'}
                        >
                            {isSaving ? <Loader2 className="spin" size={20} /> : <Save size={20} fill="currentColor" />}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CharacterManager;
