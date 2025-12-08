const FEEDBACK_STORAGE_KEY = 'antigravity_feedback';

class FeedbackStore {
    constructor() {
        this.feedback = this.loadFeedback();
    }

    loadFeedback() {
        try {
            const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error("Failed to load feedback", e);
            return [];
        }
    }

    saveFeedback() {
        try {
            localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(this.feedback));
        } catch (e) {
            console.error("Failed to save feedback", e);
        }
    }

    addFeedback(type, comment, context = 'thumbnail') {
        const item = {
            id: Date.now(),
            type, // 'positive' or 'negative'
            comment,
            context,
            timestamp: new Date().toISOString()
        };
        this.feedback.push(item);
        this.saveFeedback();
        return item;
    }

    getFeedbackSummary(context = 'thumbnail') {
        const relevant = this.feedback.filter(f => f.context === context);
        const positive = relevant.filter(f => f.type === 'positive').map(f => f.comment);
        const negative = relevant.filter(f => f.type === 'negative').map(f => f.comment);

        if (positive.length === 0 && negative.length === 0) return "";

        let summary = "\n\nUSER PREFERENCES (LEARNING HISTORY):\n";
        if (positive.length > 0) {
            summary += "The user LIKES generations that have:\n- " + positive.join("\n- ") + "\n";
        }
        if (negative.length > 0) {
            summary += "The user DISLIKES generations that have:\n- " + negative.join("\n- ") + "\n";
        }
        summary += "STRICTLY ADHERE to these preferences in your generation.\n";

        return summary;
    }
}

export const feedbackStore = new FeedbackStore();
