import { openDB } from 'idb';

const DB_NAME = 'thumbnail-generator-db';
const DB_VERSION = 4;

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
            console.log(`Upgrading DB from version ${oldVersion} to ${newVersion}`);

            if (!db.objectStoreNames.contains('templates')) {
                db.createObjectStore('templates', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('assets')) {
                db.createObjectStore('assets', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('history')) {
                db.createObjectStore('history', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('characters')) {
                db.createObjectStore('characters', { keyPath: 'id' });
            }
        },
    });
};
