import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import SingleGenerator from './SingleGenerator';
import TemplateGenerator from './TemplateGenerator';
import Remover from './Remover';
import TemplateManager from './TemplateManager';
import { Sparkles, LayoutTemplate, Scissors } from 'lucide-react';
import './SingleGenerator.css';

const CreateTab = ({ onRequestSettings, activeTab, onTabChange, onRateImage }) => {
    const [subMode, setSubMode] = useState('remix'); // 'remix', 'templates', or 'remover'
    const [showTemplateManager, setShowTemplateManager] = useState(false);
    const [templatesRefreshTrigger, setTemplatesRefreshTrigger] = useState(0);

    const handleTemplateSave = () => {
        setTemplatesRefreshTrigger(prev => prev + 1);
    };

    const SubModeToggle = () => (
        <div className="sub-mode-toggle">
            <button
                className={`sub-mode-btn ${subMode === 'remix' ? 'active' : ''}`}
                onClick={() => setSubMode('remix')}
                title="Remix"
            >
                <Sparkles size={14} />
            </button>
            <button
                className={`sub-mode-btn ${subMode === 'templates' ? 'active' : ''}`}
                onClick={() => setSubMode('templates')}
                title="Templates"
            >
                <LayoutTemplate size={14} />
            </button>
            <button
                className={`sub-mode-btn ${subMode === 'remover' ? 'active' : ''}`}
                onClick={() => setSubMode('remover')}
                title="Remover"
            >
                <Scissors size={14} />
            </button>
        </div>
    );

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Templates Button - Always visible in Create Tab */}
            {createPortal(
                <button
                    className="templates-btn"
                    onClick={() => setShowTemplateManager(true)}
                    title="Manage Templates"
                >
                    <LayoutTemplate size={24} />
                </button>,
                document.body
            )}

            {subMode === 'remix' ? (
                <SingleGenerator
                    onRequestSettings={onRequestSettings}
                    activeTab={activeTab}
                    onTabChange={onTabChange}
                    onRateImage={onRateImage}
                    extraHeaderContent={<SubModeToggle />}
                />
            ) : subMode === 'templates' ? (
                <TemplateGenerator
                    onRequestSettings={onRequestSettings}
                    activeTab={activeTab}
                    onTabChange={onTabChange}
                    onRateImage={onRateImage}
                    extraHeaderContent={<SubModeToggle />}
                    templatesRefreshTrigger={templatesRefreshTrigger}
                />
            ) : (
                <Remover
                    activeTab={activeTab}
                    onTabChange={onTabChange}
                    extraHeaderContent={<SubModeToggle />}
                />
            )}

            {showTemplateManager && (
                <TemplateManager
                    isOpen={showTemplateManager}
                    onClose={() => setShowTemplateManager(false)}
                    onSaveSuccess={handleTemplateSave}
                />
            )}
        </div>
    );
};

export default CreateTab;
