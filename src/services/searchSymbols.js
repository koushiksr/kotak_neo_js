import Papa from 'papaparse';
import neoApi from './../api/neoApi';
import { getCache, setCache } from './symbolStore';

const CACHE_KEY = 'MASTER_SYMBOLS';
const DAY = 24 * 60 * 60 * 1000;

let memory = null;
let loading = false;

/* ---------- CACHE CHECK ---------- */
const isCacheValid = (c) =>
    c && Array.isArray(c.data) && c.data.length > 0 &&
    Date.now() - c.timestamp < DAY;

/* ---------- SAFE CSV PARSER ---------- */
const parseCsvFile = async (url, out) => {
    console.log('[CSV] Fetching:', url);

    const text = await fetch(url).then(r => {
        if (!r.ok) throw new Error('Fetch failed');
        return r.text();
    });

    console.log('[CSV] Size:', (text.length / 1024 / 1024).toFixed(2), 'MB');

    Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        worker: false, // ❗ disable worker for visibility
        step: ({ data }) => {
            console.log({ row: data });
            // 🔥 handle all possible column names
            const { pTrdSymbol: symbol, pSymbol: token } = data;
            console.log({ symbol, token })
            if (symbol && token) {
                out.push({
                    s: String(symbol).toUpperCase(),
                    t: String(token)
                });
            }
        }
    });

    console.log('[CSV] Parsed rows so far:', out.length);
};

/* ---------- LOAD MASTER DATA ---------- */
export const loadMasterData = async () => {
    if (loading) return;
    loading = true;

    console.log('[MASTER] Loading started');

    const cached = await getCache(CACHE_KEY);

    if (isCacheValid(cached)) {
        console.log('[MASTER] Cache HIT:', cached.data.length);
        memory = cached.data;
        loading = false;
        return;
    }

    console.warn('[MASTER] Cache MISS → rebuilding');

    const res = await neoApi.get(
        'script-details/1.0/masterscrip/file-paths'
    );

    const files = res?.data?.data?.filesPaths;
    if (!Array.isArray(files) || files.length === 0) {
        console.error('[MASTER] No file paths received');
        loading = false;
        return;
    }

    console.log('[MASTER] Total files:', files.length);

    const ordered = [
        ...files.filter(f => f.includes('mcx_fo')),
        ...files.filter(f => f.includes('nse_fo') && !f.includes('mcx_fo')),
        ...files.filter(f => !f.includes('mcx_fo') && !f.includes('nse_fo')),
    ];

    const compact = [];

    for (const file of ordered) {
        try {
            await parseCsvFile(file, compact);
        } catch (e) {
            console.error('[CSV ERROR]', file, e.message);
        }
    }

    if (compact.length === 0) {
        console.error('[MASTER] ❌ ZERO ROWS PARSED — COLUMN MISMATCH');
        loading = false;
        return;
    }

    console.log('[MASTER] Total symbols:', compact.length);

    compact.sort((a, b) => a.s.localeCompare(b.s));
    memory = compact;

    await setCache(CACHE_KEY, {
        timestamp: Date.now(),
        data: compact
    });

    console.log('[MASTER] Cache saved');
    loading = false;
};

/* ---------- BINARY SEARCH ---------- */
const lowerBound = (arr, key) => {
    let l = 0, r = arr.length;
    while (l < r) {
        const m = (l + r) >> 1;
        if (arr[m].s < key) l = m + 1;
        else r = m;
    }
    return l;
};

/* ---------- SEARCH API ---------- */
const searchCsvFiles = async ({
    searchString = '',
    maxMatches = 10
}) => {
    if (!searchString) return [];

    if (!memory) await loadMasterData();
    if (!memory || memory.length === 0) {
        console.error('[SEARCH] Memory empty');
        return [];
    }

    const q = searchString.toUpperCase();
    const idx = lowerBound(memory, q);
    const out = [];

    for (let i = idx; i < memory.length && out.length < maxMatches; i++) {
        if (!memory[i].s.startsWith(q)) break;
        out.push(memory[i]);
    }

    console.log('[SEARCH]', q, '→', out);
    return out;
};

export default searchCsvFiles;
