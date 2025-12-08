import React, { useRef, useState, useEffect } from 'react';
import { X, Wand2, Upload } from 'lucide-react';
import CompositionCanvas from './CompositionCanvas';
import { getCharacters } from '../services/characterStore';
import './DrawingModal.css';

const DrawingModal = ({ isOpen, onClose, imageUrl, refThumbs = [], onConfirm }) => {
    const [canvasData, setCanvasData] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [localUploads, setLocalUploads] = useState([]);
    const [characters, setCharacters] = useState([]);

    // Load characters
    useEffect(() => {
        getCharacters().then(chars => setCharacters(chars));
    }, []);

    const handleGenerateClick = () => {
        if (canvasData) {
            // We pass the canvas data as both the image and the mask (though mask isn't really used for composition)
            // If we wanted strict inpainting, we'd need a separate mask export.
            // For now, we assume the composition IS the reference.
            onConfirm(canvasData, prompt, null);
            onClose();
        }
    };

    const handleDragStart = (e, url) => {
        e.dataTransfer.setData('text/plain', url);
    };

    if (!isOpen) return null;

    return (
        <div className={`drawing-modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div className="drawing-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '95vw', width: '1200px', height: '85vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h3>Magic Canvas</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="drawing-body" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Sidebar for References */}
                    <div className="refs-sidebar" style={{
                        width: '200px',
                        background: '#1a1a1a',
                        borderRight: '1px solid #333',
                        padding: '12px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <h4 style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', margin: 0 }}>Characters</h4>
                        <p style={{ color: '#666', fontSize: '11px', margin: 0 }}>Drag to canvas or use @name in text</p>

                        {characters.map((char, idx) => (
                            <div key={idx} className="ref-thumb-item" style={{ textAlign: 'center' }}>
                                <img
                                    src={char.images[0]}
                                    alt={char.name}
                                    draggable="true"
                                    onDragStart={(e) => handleDragStart(e, char.images[0])}
                                    style={{
                                        width: '100%',
                                        borderRadius: '4px',
                                        cursor: 'grab',
                                        border: '1px solid #333',
                                        marginBottom: '4px'
                                    }}
                                />
                                <div style={{ fontSize: '11px', color: '#aaa', fontWeight: 500 }}>@{char.name}</div>
                            </div>
                        ))}

                        {characters.length === 0 && (
                            <div style={{ padding: '12px', textAlign: 'center', color: '#444', fontSize: '11px' }}>
                                No characters yet
                            </div>
                        )}

                        <div style={{ paddingTop: '12px', borderTop: '1px solid #333' }}>
                            <h4 style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', margin: 0 }}>References</h4>
                            <p style={{ color: '#666', fontSize: '11px', margin: 0 }}>Drag to canvas</p>
                        </div>

                        {refThumbs.map((thumb, idx) => (
                            <div key={idx} className="ref-thumb-item">
                                <img
                                    src={thumb.preview}
                                    alt={`Ref ${idx}`}
                                    draggable="true"
                                    onDragStart={(e) => handleDragStart(e, thumb.original)}
                                    style={{
                                        width: '100%',
                                        borderRadius: '4px',
                                        cursor: 'grab',
                                        border: '1px solid #333'
                                    }}
                                />
                            </div>
                        ))}

                        {refThumbs.length === 0 && localUploads.length === 0 && (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#444', fontSize: '12px' }}>
                                No references available. Upload below.
                            </div>
                        )}

                        {/* Local Uploads */}
                        {localUploads.map((thumb, idx) => (
                            <div key={`local-${idx}`} className="ref-thumb-item">
                                <img
                                    src={thumb}
                                    alt={`Upload ${idx}`}
                                    draggable="true"
                                    onDragStart={(e) => handleDragStart(e, thumb)}
                                    style={{
                                        width: '100%',
                                        borderRadius: '4px',
                                        cursor: 'grab',
                                        border: '1px solid #333'
                                    }}
                                />
                            </div>
                        ))}

                        <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #333' }}>
                            <label className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', cursor: 'pointer', padding: '8px', fontSize: '12px' }}>
                                <Upload size={14} />
                                Upload Image
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    hidden
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            const newUploads = Array.from(e.target.files).map(file => URL.createObjectURL(file));
                                            setLocalUploads(prev => [...prev, ...newUploads]);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Main Canvas Area */}
                    <div style={{ flex: 1, position: 'relative' }}>
                        <CompositionCanvas
                            width={1000}
                            height={562} // 16:9 aspect ratio approx
                            initialImage={imageUrl}
                            onUpdate={setCanvasData}
                        />
                    </div>
                </div>

                <div className="modal-footer" style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <input
                        type="text"
                        className="glass-input"
                        placeholder="Describe composition (use @characterName to reference characters)"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button className="btn-primary" onClick={handleGenerateClick} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Wand2 size={16} />
                        Generate
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DrawingModal;
