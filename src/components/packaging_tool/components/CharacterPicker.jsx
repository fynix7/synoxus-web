import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { getCharacters } from '../services/characterStore';

const CharacterPicker = ({ isOpen, onClose, onSelectImage }) => {
    const [characters, setCharacters] = useState([]);
    const [selectedChar, setSelectedChar] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (isOpen) {
            getCharacters().then(chars => {
                setCharacters(chars);
                if (chars.length > 0) setSelectedChar(chars[0]);
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const filteredChars = characters.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
            <div className="glass-panel modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', height: '500px', display: 'flex', flexDirection: 'column', padding: 0 }}>
                <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <h3>Select Character Image</h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="glass-input" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}>
                        <Search size={16} color="var(--text-secondary)" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search characters..."
                            style={{ background: 'transparent', border: 'none', color: 'white', flex: 1, outline: 'none', fontSize: '14px' }}
                        />
                    </div>
                </div>
                <div className="modal-body" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'row', padding: 0 }}>
                    {/* Character List */}
                    <div style={{ width: '200px', borderRight: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto', padding: '10px', background: 'rgba(0,0,0,0.2)' }}>
                        {filteredChars.map(char => (
                            <div
                                key={char.id}
                                onClick={() => setSelectedChar(char)}
                                style={{
                                    padding: '10px',
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    background: selectedChar?.id === char.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    marginBottom: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <img src={char.images[0]} alt={char.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                <span style={{ fontSize: '14px', fontWeight: selectedChar?.id === char.id ? 'bold' : 'normal', color: selectedChar?.id === char.id ? 'white' : 'var(--text-secondary)' }}>{char.name}</span>
                            </div>
                        ))}
                    </div>
                    {/* Image Grid */}
                    <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: 'rgba(0,0,0,0.1)' }}>
                        {selectedChar ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '16px' }}>
                                {selectedChar.images.map((img, idx) => (
                                    <div key={idx} className="face-preview-wrapper" style={{ aspectRatio: '1', cursor: 'pointer' }} onClick={() => onSelectImage(img)}>
                                        <img
                                            src={img}
                                            alt={`${selectedChar.name} ${idx}`}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                transition: 'transform 0.2s, border-color 0.2s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                                Select a character to view images
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CharacterPicker;
