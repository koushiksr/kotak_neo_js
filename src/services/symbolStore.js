const DB_NAME = 'SYMBOL_DB';
const STORE = 'symbols';
const VERSION = 1;

const openDB = () =>
    new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, VERSION);

        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE);
            }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

export const getCache = async (key) => {
    const db = await openDB();
    return new Promise((resolve) => {
        const tx = db.transaction(STORE, 'readonly');
        const store = tx.objectStore(STORE);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
    });
};

export const setCache = async (key, value) => {
    const db = await openDB();
    return new Promise((resolve) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = () => resolve();
    });
};

export const clearCache = async () => {
    const db = await openDB();
    return new Promise((resolve) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).clear();
        tx.oncomplete = () => resolve();
    });
};
