import React from 'react';

import { ImagePlus, Grid, UserX, Pentagon } from 'lucide-react';
import './Navigation.css';

const Navigation = ({ activeTab, onTabChange }) => {
  return (
    <div className="nav-container">
      <button
        className={`nav-item ${activeTab === 'single' ? 'active' : ''}`}
        onClick={() => onTabChange('single')}
        title="Create"
      >
        <ImagePlus size={20} />
      </button>
      <button
        className={`nav-item ${activeTab === 'bulk' ? 'active' : ''}`}
        onClick={() => onTabChange('bulk')}
        title="Bulk Generator"
      >
        <Grid size={20} />
      </button>
      <button
        className={`nav-item ${activeTab === 'remover' ? 'active' : ''}`}
        onClick={() => onTabChange('remover')}
        title="Character Remover"
      >
        <UserX size={20} />
      </button>
      <button
        className={`nav-item ${activeTab === 'rater' ? 'active' : ''}`}
        onClick={() => onTabChange('rater')}
        title="Rater"
      >
        <Pentagon size={20} />
      </button>
    </div>
  );
};

export default Navigation;
