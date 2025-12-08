import React, { useState, useRef, useEffect } from 'react';

const MentionInput = ({
    value,
    onChange,
    placeholder,
    characters = [],
    className = "",
    style = {},
    type = "text", // 'text' or 'textarea'
    rows = 3
}) => {
    const [suggestion, setSuggestion] = useState('');
    const [ghostText, setGhostText] = useState('');
    const inputRef = useRef(null);
    const backdropRef = useRef(null);

    useEffect(() => {
        if (!value) {
            setSuggestion('');
            setGhostText('');
            return;
        }

        const lastWordMatch = value.match(/@(\w*)$/);
        if (lastWordMatch) {
            const query = lastWordMatch[1].toLowerCase();
            const match = characters.find(c => c.name.toLowerCase().startsWith(query));

            if (match) {
                const remaining = match.name.slice(query.length);
                setSuggestion(match.name);
                setGhostText(remaining);
            } else {
                setSuggestion('');
                setGhostText('');
            }
        } else {
            setSuggestion('');
            setGhostText('');
        }
    }, [value, characters]);

    const handleKeyDown = (e) => {
        if ((e.key === 'Tab' || e.key === 'ArrowRight' || e.key === 'Enter') && ghostText) {
            e.preventDefault();
            const newValue = value.replace(/@(\w*)$/, `@${suggestion} `);
            onChange({ target: { value: newValue } });
            setGhostText('');
            setSuggestion('');
        }
    };

    const handleChange = (e) => {
        onChange(e);
    };

    const handleScroll = (e) => {
        if (backdropRef.current) {
            backdropRef.current.scrollTop = e.target.scrollTop;
            backdropRef.current.scrollLeft = e.target.scrollLeft;
        }
    };

    const renderBackdrop = () => {
        const segments = value.split(/(@\w+)/g);
        return (
            <>
                {segments.map((segment, index) => {
                    if (segment.startsWith('@')) {
                        const name = segment.slice(1);
                        const isChar = characters.some(c => c.name.toLowerCase() === name.toLowerCase());
                        if (isChar) {
                            return (
                                <span key={index} style={{ color: '#ff982b', fontWeight: 'bold', textShadow: '0 0 10px rgba(255, 152, 43, 0.3)' }}>
                                    {segment}
                                </span>
                            );
                        }
                    }
                    return <span key={index}>{segment}</span>;
                })}
                {/* Append ghost text if it exists and we are at the end */}
                {ghostText && (
                    <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>{ghostText}</span>
                )}
                {/* Add a trailing space to ensure height matches if ending with newline */}
                {value.endsWith('\n') && <br />}
            </>
        );
    };

    const commonStyles = {
        fontFamily: 'inherit',
        fontSize: '14px',
        lineHeight: '1.5',
        letterSpacing: 'normal',
        fontWeight: 'normal',
        padding: '12px',
        margin: '0',
        boxSizing: 'border-box',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        wordBreak: 'break-word',
        width: '100%',
        border: '1px solid transparent',
        textAlign: 'left',
        verticalAlign: 'top'
    };

    return (
        <div className="mention-input-wrapper" style={{ position: 'relative', width: '100%', ...style }}>
            {/* Backdrop for highlighting */}
            <div
                ref={backdropRef}
                className={className} // Inherit class for border-radius etc
                style={{
                    ...commonStyles,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    color: 'var(--text-primary)', // Default text color
                    // background: 'transparent', // REMOVED to allow className background
                    zIndex: 1,
                    overflow: 'hidden', // Hide scrollbars on backdrop
                    borderColor: 'transparent', // Hide border on backdrop
                    pointerEvents: 'none', // Allow clicks to pass through
                }}
            >
                {renderBackdrop()}
            </div>

            {/* The Input */}
            {type === 'textarea' ? (
                <textarea
                    ref={inputRef}
                    className={className}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onScroll={handleScroll}
                    placeholder={placeholder}
                    rows={rows}
                    style={{
                        ...commonStyles,
                        position: 'relative',
                        zIndex: 2,
                        background: 'transparent',
                        color: 'transparent', // Hide text
                        caretColor: 'white', // Show cursor
                        resize: 'none',
                        overflow: 'auto' // Allow scrolling
                    }}
                />
            ) : (
                <input
                    ref={inputRef}
                    type="text"
                    className={className}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    style={{
                        ...commonStyles,
                        position: 'relative',
                        zIndex: 2,
                        background: 'transparent',
                        color: 'transparent',
                        caretColor: 'white',
                    }}
                />
            )}
        </div>
    );
};

export default MentionInput;
