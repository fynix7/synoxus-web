import { initDB } from './db';

const STORE_NAME = 'characters';


export const saveCharacter = async (name, images, colors = {}) => {
    const db = await initDB();
    const character = {
        id: crypto.randomUUID(),
        name,
        images,
        colors, // { primary: '#...', secondary: '#...' }
        createdAt: Date.now()
    };
    await db.put(STORE_NAME, character);
    return character;
};

export const getCharacters = async () => {
    const db = await initDB();
    const allChars = await db.getAll(STORE_NAME);
    return allChars.filter(char => {
        return char &&
            typeof char.name === 'string' &&
            Array.isArray(char.images) &&
            char.images.length > 0;
    });
};

export const deleteCharacter = async (id) => {
    const db = await initDB();
    return db.delete(STORE_NAME, id);
};

export const clearAllCharacters = async () => {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.objectStore(STORE_NAME).clear();
    await tx.done;
};

export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};
