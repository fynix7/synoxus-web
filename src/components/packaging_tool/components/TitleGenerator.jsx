import React, { useState } from 'react';
import { Type, Sparkles, FileText, AlignLeft, CheckCircle, XCircle, Image as ImageIcon, Info, Upload, Clock, Bookmark, Heart } from 'lucide-react';
import ModeTabs from './ModeTabs';
import { generateViralTitles } from '../services/api';
import HistoryModal from './HistoryModal';
import SavedModal from './SavedModal';
import { saveItem } from '../services/savedStore';
import './SingleGenerator.css';

const TitleGenerator = ({ activeTab, onTabChange }) => {
    const [topic, setTopic] = useState('');
    const [transcript, setTranscript] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [showSaved, setShowSaved] = useState(false);

    const handleGenerate = async () => {
        if (!topic && !transcript) {
            alert("Please provide a topic or a transcript.");
            return;
        }

        setLoading(true);
        try {
            const data = await generateViralTitles({ topic, transcript });
            if (data && data.results) {
                setResults(data.results);
            }
        } catch (error) {
            alert(`Generation failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = (item) => {
        saveItem({
            type: 'title_generation',
            topic,
            transcript: transcript ? transcript.substring(0, 200) + '...' : '',
            result: item,
            name: item.title,
            images: [] // No images
        });
        alert('Saved to collection!');
    };

    const handleRerun = (historyItem) => {
        setTopic(historyItem.topic || '');
        setTranscript(historyItem.transcript || '');
    };

    return (
        <div className="generator-container" style={{ gridTemplateColumns: '340px 1fr' }}>
            {/* Header Buttons */}
            <button className="saved-btn" onClick={() => setShowSaved(true)} title="View Saved">
                <Bookmark size={20} />
            </button>
            <button className="history-btn" onClick={() => setShowHistory(true)} title="View History">
                <Clock size={20} />
            </button>

            {/* Input Column */}
            <div className="panels-column input-column" style={{ width: '340px', minWidth: '340px' }}>
                <div className="glass-panel input-panel" style={{ position: 'relative', zIndex: 10 }}>
                    <div className="panel-header">
                        <ModeTabs activeTab={activeTab} onTabChange={onTabChange} />
                    </div>
                    <div className="panel-content">
                        <div className="input-group">
                            <label><AlignLeft size={14} /> Topic Description</label>
                            <textarea
                                className="glass-input"
                                placeholder="e.g., How to start an agency, or My journey learning coding..."
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="input-group">
                            <label><FileText size={14} /> Transcript / Content</label>
                            <div style={{ position: 'relative' }}>
                                <textarea
                                    className="glass-input"
                                    placeholder="Paste video transcript or detailed notes here..."
                                    value={transcript}
                                    onChange={(e) => setTranscript(e.target.value)}
                                    rows={10}
                                    style={{ minHeight: '200px', paddingBottom: '40px' }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: '10px',
                                    right: '10px',
                                    display: 'flex',
                                    gap: '8px'
                                }}>
                                    <input
                                        type="file"
                                        id="transcript-upload"
                                        accept=".txt,.md,.json,.csv"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (e) => {
                                                    setTranscript(e.target.result);
                                                };
                                                reader.readAsText(file);
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => document.getElementById('transcript-upload').click()}
                                        style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            borderRadius: '6px',
                                            color: 'var(--text-secondary)',
                                            padding: '4px 8px',
                                            fontSize: '11px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <Upload size={12} /> Upload Text/MD
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            className="generate-btn"
                            onClick={handleGenerate}
                            disabled={loading}
                            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                        >
                            {loading ? (
                                <div className="spinner-small"></div>
                            ) : (
                                <Sparkles size={24} />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Column */}
            <div className="panels-column results-column">
                {!results ? (
                    <div className="glass-panel result-panel" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px',
                        flexDirection: 'column',
                        height: '100%'
                    }}>
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <Type size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
                            <p>Enter a topic or transcript to generate viral title variations.</p>
                        </div>
                    </div>
                ) : (
                    <div className="glass-panel result-panel" style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Sparkles size={20} color="#ff982b" />
                            Viral Architectures
                        </h2>

                        {results.map((item, index) => (
                            <div key={index} style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '12px',
                                padding: '20px',
                                opacity: item.status === 'MATCH' ? 1 : 0.6
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <span style={{
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: 'var(--text-secondary)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px'
                                    }}>
                                        {item.architecture}
                                    </span>
                                    {item.status === 'MATCH' ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ff982b', fontSize: '12px', fontWeight: 'bold' }}>
                                            <CheckCircle size={14} /> MATCH
                                        </span>
                                    ) : (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                                            <XCircle size={14} /> N/A
                                        </span>
                                    )}

                                    {item.status === 'MATCH' && (
                                        <button
                                            className="icon-btn-glass"
                                            onClick={() => handleSave(item)}
                                            title="Save to Collection"
                                            style={{ marginLeft: 'auto' }}
                                        >
                                            <Heart size={16} />
                                        </button>
                                    )}
                                </div>

                                {item.status === 'MATCH' ? (
                                    <>
                                        <div style={{
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            color: 'white',
                                            marginBottom: '16px',
                                            lineHeight: '1.4'
                                        }}>
                                            {item.title}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                                                <ImageIcon size={18} style={{ color: 'var(--primary)', minWidth: '18px' }} />
                                                <div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 'bold' }}>THUMBNAIL CONCEPT</div>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{item.thumbnail_concept}</div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '12px', padding: '0 12px' }}>
                                                <Info size={18} style={{ color: 'var(--text-secondary)', minWidth: '18px' }} />
                                                <div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 'bold' }}>WHY IT WORKS</div>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{item.why_it_works}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                        Content does not fit this architecture.
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showHistory && <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} onRerun={handleRerun} activeTab={activeTab} />}
            {showSaved && <SavedModal isOpen={showSaved} onClose={() => setShowSaved(false)} />}
        </div>
    );
};

export default TitleGenerator;
