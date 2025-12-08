import { initDB } from './db';

const STORE_NAME = 'assets';


export const saveAsset = async (file) => {
    const db = await initDB();
    const id = crypto.randomUUID();

    // Convert to base64
    const reader = new FileReader();
    const base64 = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });

    const asset = {
        id,
        data: base64,
        name: file.name,
        type: file.type,
        createdAt: Date.now()
    };

    await db.put(STORE_NAME, asset);
    return asset;
};

export const getAssets = async () => {
    const db = await initDB();
    return await db.getAll(STORE_NAME);
};

export const deleteAsset = async (id) => {
    const db = await initDB();
    await db.delete(STORE_NAME, id);
};
