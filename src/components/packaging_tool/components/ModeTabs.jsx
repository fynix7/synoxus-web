import React from 'react';
import { Sparkles, Grid, UserX, Pentagon, LayoutTemplate, Palette, Box, Type } from 'lucide-react';

const ModeTabs = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: 'create', icon: Palette, title: 'Create' },
        { id: 'rater', icon: Pentagon, title: 'Thumbnail Rater' }
    ];

    return (
        <div className="mode-tabs">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    className={`mode-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                    title={tab.title}
                >
                    <tab.icon size={18} />
                </button>
            ))}
        </div>
    );
};

export default ModeTabs;
