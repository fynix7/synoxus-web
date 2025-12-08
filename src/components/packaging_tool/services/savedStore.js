const SAVED_KEY = 'thumbnail_saved';

export const saveItem = (data) => {
    try {
        const items = getSavedItems();
        const newEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            name: 'Untitled', // Default name
            ...data,
        };
        const updatedItems = [newEntry, ...items];
        localStorage.setItem(SAVED_KEY, JSON.stringify(updatedItems));
        return newEntry;
    } catch (error) {
        console.error('Failed to save item:', error);
        return null;
    }
};

export const getSavedItems = () => {
    try {
        const items = localStorage.getItem(SAVED_KEY);
        const parsed = items ? JSON.parse(items) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Failed to load saved items:', error);
        return [];
    }
};

export const updateSavedItem = (id, updates) => {
    try {
        const items = getSavedItems();
        const updatedItems = items.map(item =>
            item.id === id ? { ...item, ...updates } : item
        );
        localStorage.setItem(SAVED_KEY, JSON.stringify(updatedItems));
        return true;
    } catch (error) {
        console.error('Failed to update saved item:', error);
        return false;
    }
};

export const deleteSavedItem = (id) => {
    try {
        const items = getSavedItems();
        const updatedItems = items.filter(item => item.id !== id);
        localStorage.setItem(SAVED_KEY, JSON.stringify(updatedItems));
        return true;
    } catch (error) {
        console.error('Failed to delete saved item:', error);
        return false;
    }
};
