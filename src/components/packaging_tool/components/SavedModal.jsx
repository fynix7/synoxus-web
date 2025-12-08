import React, { useState, useEffect } from 'react';
import { X, Trash2, Edit2, Search } from 'lucide-react';
import { getSavedItems, deleteSavedItem, updateSavedItem } from '../services/savedStore';
import { getCharacters } from '../services/characterStore';
import './HistoryModal.css';

const SavedModal = ({ isOpen, onClose }) => {
    const [items, setItems] = useState([]);
    const [characters, setCharacters] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [filterChar, setFilterChar] = useState('');
    const [filterDate, setFilterDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadItems();
            loadCharacters();
        }
    }, [isOpen]);

    const loadItems = () => {
        setItems(getSavedItems());
    };

    const loadCharacters = async () => {
        const chars = await getCharacters();
        setCharacters(chars);
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this saved item?')) {
            deleteSavedItem(id);
            loadItems();
        }
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        setEditName(item.name || 'Untitled');
    };

    const saveEdit = (id) => {
        updateSavedItem(id, { name: editName });
        setEditingId(null);
        loadItems();
    };

    const filteredItems = items.filter(item => {
        const matchesChar = filterChar ?
            (item.characterNames && item.characterNames.some(name => name.toLowerCase().includes(filterChar.toLowerCase()))) : true;

        // Date filter: YYYY-MM-DD
        const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
        const matchesDate = filterDate ? itemDate === filterDate : true;

        return matchesChar && matchesDate;
    });

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="glass-panel modal-content history-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Saved Generations</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Filters */}
                <div className="filters-row" style={{ display: 'flex', gap: '10px', padding: '0 24px', marginBottom: '16px' }}>
                    <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                        <select
                            className="glass-input"
                            value={filterChar}
                            onChange={e => setFilterChar(e.target.value)}
                        >
                            <option value="">All Characters</option>
                            {characters.map(char => (
                                <option key={char.id} value={char.name}>{char.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group" style={{ width: '150px', marginBottom: 0 }}>
                        <input
                            type="date"
                            className="glass-input"
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>
                </div>

                <div className="history-list">
                    {filteredItems.length === 0 ? (
                        <p className="empty-text">No saved items found.</p>
                    ) : (
                        filteredItems.map(item => (
                            <div key={item.id} className="history-item">
                                <div className="history-header">
                                    {editingId === item.id ? (
                                        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                                            <input
                                                type="text"
                                                className="glass-input"
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                autoFocus
                                            />
                                            <button className="btn-primary" onClick={() => saveEdit(item.id)} style={{ padding: '8px 16px' }}>Save</button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className="history-topic" style={{ fontWeight: 'bold', fontSize: '16px' }}>{item.name || 'Untitled'}</span>
                                            <button className="icon-btn edit" onClick={() => startEdit(item)}>
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                    <span className="history-date">
                                        {new Date(item.timestamp).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="history-images">
                                    {item.type === 'title_generation' ? (
                                        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', width: '100%' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '8px', lineHeight: '1.4' }}>
                                                {item.result?.title || item.name}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                <span style={{ textTransform: 'uppercase', fontWeight: 'bold', color: '#ff982b' }}>{item.result?.architecture}</span>
                                                {item.result?.why_it_works && <p style={{ marginTop: '8px', fontStyle: 'italic' }}>"{item.result.why_it_works}"</p>}
                                            </div>
                                        </div>
                                    ) : (
                                        item.images.map((img, idx) => (
                                            <img key={idx} src={img} alt="Saved" className="history-img" />
                                        ))
                                    )}
                                </div>

                                <div className="history-footer">
                                    <div className="history-details">
                                        {item.instructions && (
                                            <p><strong>Instructions:</strong> {item.instructions}</p>
                                        )}
                                        {item.characterNames && item.characterNames.length > 0 && (
                                            <p><strong>Characters:</strong> {item.characterNames.join(', ')}</p>
                                        )}
                                    </div>
                                    <button className="icon-btn delete" onClick={() => handleDelete(item.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SavedModal;
