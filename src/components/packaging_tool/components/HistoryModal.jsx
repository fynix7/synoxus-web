import React, { useState, useEffect } from 'react';
import { X, Download, Trash2, Clock, Edit2 } from 'lucide-react';
import { getHistory, deleteHistoryItem, clearHistory, updateHistoryItem } from '../services/historyStore';
import './HistoryModal.css';

const HistoryModal = ({ isOpen, onClose, onRerun, activeTab }) => {
    const [history, setHistory] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editTopic, setEditTopic] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen]);

    const loadHistory = async () => {
        const items = await getHistory();
        const filtered = items.filter(item => {
            if (activeTab === 'rate') return item.type === 'rating';
            if (activeTab === 'templates') return item.type === 'template';
            // Default (Remix/Package) - share history
            // Note: Legacy items might not have a type, assume 'generation'
            const type = item.type || 'generation';
            return type === 'generation' || type === 'package';
        });
        setHistory(filtered);
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (await deleteHistoryItem(id)) {
            loadHistory();
            if (selectedItem?.id === id) {
                setSelectedItem(null);
            }
        }
    };

    const handleClearAll = async () => {
        if (window.confirm('Clear all history? This cannot be undone.')) {
            await clearHistory();
            loadHistory();
            setSelectedItem(null);
        }
    };

    const startEdit = (item, e) => {
        e.stopPropagation();
        setEditingId(item.id);
        setEditTopic(item.topic || 'Untitled');
    };

    const saveEdit = async (id, e) => {
        e.stopPropagation();
        await updateHistoryItem(id, { topic: editTopic });
        setEditingId(null);
        loadHistory();
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (!isOpen) return null;

    return (
        <div className="history-modal-overlay" onClick={onClose}>
            <div className="history-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="history-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Clock size={24} />
                        <h2>Generation History</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {history.length > 0 && (
                            <button className="btn-text" onClick={handleClearAll}>
                                Clear All
                            </button>
                        )}
                        <button className="close-btn" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="history-modal-body">
                    {history.length === 0 ? (
                        <div className="history-empty">
                            <Clock size={48} opacity={0.3} />
                            <p>No generation history yet</p>
                        </div>
                    ) : (
                        <div className="history-grid">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    className={`history-item ${selectedItem?.id === item.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedItem(item)}
                                >
                                    <div className="history-item-images">
                                        {item.images.slice(0, 4).map((img, idx) => (
                                            <img key={idx} src={img} alt={`Gen ${idx + 1}`} />
                                        ))}
                                    </div>
                                    <div className="history-item-info">
                                        <div className="history-item-topic">
                                            {editingId === item.id ? (
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <input
                                                        value={editTopic}
                                                        onChange={e => setEditTopic(e.target.value)}
                                                        onClick={e => e.stopPropagation()}
                                                        className="glass-input"
                                                        style={{ padding: '2px 4px', fontSize: '12px', height: '24px' }}
                                                        autoFocus
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') saveEdit(item.id, e);
                                                        }}
                                                    />
                                                    <button onClick={e => saveEdit(item.id, e)} className="btn-text" style={{ fontSize: '10px' }}>Save</button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.topic || 'Untitled'}</span>
                                                    <button className="icon-btn-small" onClick={e => startEdit(item, e)} style={{ opacity: 0.5, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>
                                                        <Edit2 size={12} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="history-item-meta">
                                            <span>{formatDate(item.timestamp)}</span>
                                            <span>•</span>
                                            <span>{item.images.length} image{item.images.length !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                    <button
                                        className="history-item-delete"
                                        onClick={(e) => handleDelete(item.id, e)}
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedItem && (
                        <div className="history-detail">
                            <div className="history-detail-header">
                                <h3>{selectedItem.topic || 'Untitled Generation'}</h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {onRerun && (
                                        <button
                                            className="btn-glass"
                                            onClick={() => {
                                                onRerun(selectedItem);
                                                onClose();
                                            }}
                                            style={{ fontSize: '12px', padding: '6px 12px' }}
                                        >
                                            Use Settings
                                        </button>
                                    )}
                                    <button className="close-btn" onClick={() => setSelectedItem(null)}>
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="history-detail-images">
                                {selectedItem.images.map((img, idx) => (
                                    <div key={idx} className="history-detail-image-wrapper">
                                        <img src={img} alt={`Variation ${idx + 1}`} />
                                        <a
                                            href={img}
                                            download={`thumbnail-${selectedItem.id}-${idx}.png`}
                                            className="download-overlay"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Download size={20} />
                                        </a>
                                    </div>
                                ))}
                            </div>
                            {selectedItem.instructions && (
                                <div className="history-detail-info">
                                    <strong>Instructions:</strong>
                                    <p>{selectedItem.instructions}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;
