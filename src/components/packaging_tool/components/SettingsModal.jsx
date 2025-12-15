import React, { useState, useEffect } from 'react';
import { X, Save, Key, Check, Sun, Moon } from 'lucide-react';
import './SettingsModal.css';

const SettingsModal = ({ isOpen, onClose, theme, toggleTheme }) => {
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('models/gemini-3-pro-image-preview');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const storedKey = localStorage.getItem('google_api_key');
        if (storedKey) setApiKey(storedKey);
        const storedModel = localStorage.getItem('google_model_id');
        if (storedModel) setModel(storedModel);
    }, []);

    const handleSave = async () => {
        const trimmedKey = apiKey.trim();
        const trimmedModel = model.trim();

        if (!trimmedKey) {
            alert("Please enter an API key.");
            return;
        }

        try {
            // Validate key by fetching models
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${trimmedKey}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || response.statusText);
            }

            localStorage.setItem('google_api_key', trimmedKey);
            localStorage.setItem('google_model_id', trimmedModel);
            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                onClose();
            }, 1000);
        } catch (error) {
            alert(`Invalid API Key: ${error.message}`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="glass-panel modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Settings</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Theme Toggle */}
                    <div className="input-group" style={{ marginBottom: '24px' }}>
                        <label>Appearance</label>
                        <div style={{ display: 'flex', gap: '12px', background: 'var(--panel-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
                            <button
                                onClick={() => theme !== 'light' && toggleTheme()}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: theme === 'light' ? 'var(--bg-app)' : 'transparent',
                                    color: theme === 'light' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: theme === 'light' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                <Sun size={18} />
                                Light
                            </button>
                            <button
                                onClick={() => theme !== 'dark' && toggleTheme()}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: theme === 'dark' ? 'var(--bg-app)' : 'transparent',
                                    color: theme === 'dark' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: theme === 'dark' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                <Moon size={18} />
                                Dark
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Google Cloud API Key</label>
                        <div className="input-with-icon">
                            <Key size={16} className="input-icon" />
                            <input
                                type="password"
                                placeholder="Enter your API Key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="glass-input with-padding"
                            />
                        </div>
                        <p className="helper-text">Required for API access.</p>
                    </div>

                    <div className="input-group">
                        <label>Model ID</label>
                        <div className="input-with-icon">
                            <div className="input-icon" style={{ fontSize: '14px', fontWeight: 'bold' }}>M</div>
                            <input
                                type="text"
                                placeholder="e.g. models/gemini-3-pro-image-preview"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="glass-input with-padding"
                            />
                        </div>
                        <p className="helper-text">Enter the full model ID (e.g., models/gemini-3-pro-image-preview).</p>
                        <button
                            className="btn-glass"
                            style={{ marginTop: '8px', fontSize: '12px', width: '100%' }}
                            onClick={async () => {
                                try {
                                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                                    const data = await response.json();
                                    if (data.models) {
                                        const modelNames = data.models.map(m => m.name).join('\n');
                                        alert(`Available Models:\n${modelNames}`);
                                        console.log('Available Models:', data.models);
                                    } else {
                                        alert('No models found or error: ' + JSON.stringify(data));
                                    }
                                } catch (e) {
                                    alert('Error fetching models: ' + e.message);
                                }
                            }}
                        >
                            Check Available Models (Debug)
                        </button>
                    </div>

                    <div className="input-group" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--panel-border)' }}>
                        <label style={{ color: 'var(--error)' }}>Danger Zone</label>
                        <button
                            className="btn-glass"
                            style={{
                                width: '100%',
                                color: 'var(--error)',
                                borderColor: 'var(--error)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                            onClick={async () => {
                                if (window.confirm("WARNING: This will delete ALL saved characters, history, and settings from your browser. This action cannot be undone. Are you sure?")) {
                                    try {
                                        // Clear LocalStorage
                                        localStorage.clear();

                                        // Clear IndexedDB
                                        const DB_NAME = 'thumbnail-generator-db';
                                        const req = indexedDB.deleteDatabase(DB_NAME);

                                        req.onsuccess = () => {
                                            alert("All local data has been wiped. The page will now reload.");
                                            window.location.reload();
                                        };

                                        req.onerror = () => {
                                            alert("Failed to delete database. Please try clearing browser data manually.");
                                        };

                                        req.onblocked = () => {
                                            alert("Operation blocked. Please close other tabs of this app and try again.");
                                        };
                                    } catch (e) {
                                        console.error("Wipe failed:", e);
                                        alert("Error wiping data: " + e.message);
                                    }
                                }
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>🗑️</span>
                            Reset All Data & Wipe Storage
                        </button>
                        <p className="helper-text" style={{ color: 'var(--text-secondary)' }}>
                            Use this if you accidentally saved sensitive data. This completely clears your browser's local storage for this app.
                        </p>
                    </div>
                </div>


                <div className="modal-footer">
                    <button
                        className={`btn-primary icon-only-btn ${saved ? 'success' : ''}`}
                        onClick={handleSave}
                        title={saved ? 'Saved' : 'Save Settings'}
                    >
                        {saved ? <Check size={20} /> : <Save size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
