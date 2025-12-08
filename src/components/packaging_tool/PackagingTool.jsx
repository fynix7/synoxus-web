import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import CreateTab from './components/CreateTab';
import PackageGenerator from './components/PackageGenerator';
import TitleGenerator from './components/TitleGenerator';
import Remover from './components/Remover';
import ThumbnailRater from './components/ThumbnailRater';
import SettingsModal from './components/SettingsModal';
import './PackagingTool.css';

const PackagingTool = () => {
    const [activeTab, setActiveTab] = useState('create');
    const [showSettings, setShowSettings] = useState(false);
    const [imageToRate, setImageToRate] = useState(null);

    // Enforce dark theme
    const theme = 'dark';

    const handleRateImage = (imageUrl) => {
        setImageToRate(imageUrl);
        setActiveTab('rater');
    };

    return (
        <div className="app-container" data-theme={theme}>
            <main className="main-content">
                {activeTab === 'create' ? (
                    <CreateTab
                        onRequestSettings={() => setShowSettings(true)}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        onRateImage={handleRateImage}
                    />
                ) : activeTab === 'package' ? (
                    <PackageGenerator
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        onRateImage={handleRateImage}
                    />
                ) : activeTab === 'title' ? (
                    <TitleGenerator
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />
                ) : activeTab === 'remover' ? (
                    <Remover
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />
                ) : (
                    <ThumbnailRater
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        imageToRate={imageToRate}
                        onClearImageToRate={() => setImageToRate(null)}
                    />
                )}
            </main>

            <button
                className="global-settings-btn"
                onClick={() => setShowSettings(true)}
                title="Global Settings"
            >
                <Settings size={24} />
            </button>

            {showSettings && (
                <SettingsModal
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    theme={theme}
                    toggleTheme={() => { }} // No-op
                />
            )}
        </div>
    );
};

export default PackagingTool;
