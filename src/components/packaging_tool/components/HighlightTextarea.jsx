import React, { useRef, useEffect } from 'react';
import { Wand2 } from 'lucide-react';
import { enhancePrompt } from '../utils/promptEnhancer';
import './HighlightTextarea.css';

const HighlightTextarea = ({ value, onChange, placeholder, characters = [], rows = 3 }) => {
    const backdropRef = useRef(null);
    const textareaRef = useRef(null);

    const handleScroll = () => {
        if (backdropRef.current && textareaRef.current) {
            backdropRef.current.scrollTop = textareaRef.current.scrollTop;
            backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };

    // Function to highlight mentions
    const getHighlightedText = () => {
        if (!value) {
            // Render placeholder-like empty space to maintain height if needed, 
            // but backdrop is behind so it doesn't matter for placeholder visibility.
            return <span className="placeholder-text">{placeholder}</span>;
        }

        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const names = characters.map(c => c.name).filter(n => n);

        if (names.length === 0) return value;

        const pattern = new RegExp(`@(${names.map(escapeRegExp).join('|')})\\b`, 'gi');

        let parts = [];
        let lastIndex = 0;
        let match;

        while ((match = pattern.exec(value)) !== null) {
            parts.push(value.substring(lastIndex, match.index));
            parts.push(
                <span key={match.index} className="highlight-mention">
                    {match[0]}
                </span>
            );
            lastIndex = pattern.lastIndex;
        }

        parts.push(value.substring(lastIndex));
        return parts;
    };

    const handleEnhance = () => {
        const enhanced = enhancePrompt(value);
        // Create a synthetic event to pass to onChange
        const event = {
            target: { value: enhanced }
        };
        onChange(event);
    };

    return (
        <div className="highlight-textarea-container" style={{ position: 'relative' }}>
            <button
                className="magic-enhance-btn"
                onClick={handleEnhance}
                title="Auto-Enhance Prompt"
                style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    zIndex: 20,
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    padding: '4px',
                    cursor: 'pointer',
                    color: '#a855f7', // Purple magic color
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                }}
            >
                <Wand2 size={14} />
            </button>
            <div className="highlight-backdrop" ref={backdropRef}>
                <div className="highlight-content">
                    {value ? getHighlightedText() : null}
                    {/* Trailing space to handle newlines at end of file */}
                    <span style={{ visibility: 'hidden' }}>.</span>
                </div>
            </div>
            <textarea
                ref={textareaRef}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                onScroll={handleScroll}
                className="highlight-textarea"
                spellCheck="false"
            />
        </div>
    );
};

export default HighlightTextarea;
