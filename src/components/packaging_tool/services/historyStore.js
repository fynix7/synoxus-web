import { initDB } from './db';

const STORE_NAME = 'history';


export const saveToHistory = async (generationData) => {
    try {
        const db = await initDB();
        const newEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...generationData,
        };
        await db.put(STORE_NAME, newEntry);
        return newEntry;
    } catch (error) {
        console.error('Failed to save to history:', error);
        return null;
    }
};

export const getHistory = async () => {
    try {
        const db = await initDB();
        const history = await db.getAll(STORE_NAME);
        // Sort by timestamp descending (newest first)
        return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
        console.error('Failed to load history:', error);
        return [];
    }
};

export const deleteHistoryItem = async (id) => {
    try {
        const db = await initDB();
        await db.delete(STORE_NAME, id);
        return true;
    } catch (error) {
        console.error('Failed to delete history item:', error);
        return false;
    }
};

export const updateHistoryItem = async (id, updates) => {
    try {
        const db = await initDB();
        const item = await db.get(STORE_NAME, id);
        if (!item) return false;

        const updatedItem = { ...item, ...updates };
        await db.put(STORE_NAME, updatedItem);
        return true;
    } catch (error) {
        console.error('Failed to update history item:', error);
        return false;
    }
};

export const clearHistory = async () => {
    try {
        const db = await initDB();
        await db.clear(STORE_NAME);
        return true;
    } catch (error) {
        console.error('Failed to clear history:', error);
        return false;
    }
};
