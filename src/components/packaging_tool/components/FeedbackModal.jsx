import React, { useState } from 'react';
import { X, ThumbsUp, ThumbsDown } from 'lucide-react';

const FeedbackModal = ({ isOpen, onClose, type, onSubmit }) => {
    const [comment, setComment] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!comment.trim()) {
            alert("Please provide a brief reason so we can improve.");
            return;
        }
        onSubmit(comment);
        setComment('');
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10001 }}>
            <div className="glass-panel modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {type === 'positive' ? <ThumbsUp size={20} color="#ff982b" /> : <ThumbsDown size={20} color="#ff3b30" />}
                        <h3>{type === 'positive' ? 'What did you like?' : 'What went wrong?'}</h3>
                    </div>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="modal-body">
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '14px' }}>
                        {type === 'positive'
                            ? "Your feedback helps the AI understand your style preferences."
                            : "Your feedback helps the AI avoid these mistakes in the future."}
                    </p>
                    <textarea
                        className="glass-input"
                        rows={4}
                        placeholder={type === 'positive' ? "e.g., Good lighting, clear text, nice composition..." : "e.g., Text is unreadable, face is distorted, wrong colors..."}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="modal-footer">
                    <button className="btn-primary" onClick={handleSubmit} style={{ width: '100%' }}>
                        Submit Feedback
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;
