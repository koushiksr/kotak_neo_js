// src/services/masterDataService.js
import neoApi, { authService } from '../api/neoApi.js';

let _data = null;
let _loadStatus = {
  isLoading: true,
  isMissing: false,
  isStale: false,
  isSyncing: false,
  error: null
};

function _updateStatus(newStatus) {
  _loadStatus = { ..._loadStatus, ...newStatus };
}

function _checkIfStale(response) {
  const lastMod = response.headers.get('last-modified');
  if (!lastMod) return true;
  const today = new Date().toISOString().split('T')[0];
  const fileDate = new Date(lastMod).toISOString().split('T')[0];
  return today !== fileDate;
}

/**
 * CORE: Initial load of the processed JSON
 */
export async function ensureLoaded() {
  if (_data) return _data;

  try {
    const response = await fetch('/masterdata/master_index.json');

    // If 404, we trigger the background sync logic
    if (!response.ok) {
      return await triggerBackgroundSync();
    }

    _data = await response.json();
    _updateStatus({ isLoading: false, isStale: _checkIfStale(response) });
    return _data;

  } catch (err) {
    _updateStatus({ isLoading: false, error: err.message });
    throw err;
  }
}

/**
 * MODULAR: Trigger background sync (attempt from browser)
 */
export async function triggerBackgroundSync() {
  _updateStatus({ isSyncing: true, isMissing: true, error: null });

  try {
    // 1) Fetch file list from neoApi
    // Note: authentication should be handled externally (e.g. App.jsx sets tokens)
    const res = await neoApi.get('/script-details/1.0/masterscrip/file-paths');
    const files = res?.data?.data?.filesPaths || [];
    if (!files.length) {
      _updateStatus({ isSyncing: false, error: 'No master files returned', isMissing: true, isLoading: false });
      return {};
    }

    // 2) Helper CSV parser (simple, handles quoted fields)
    const parseCSV = (text) => {
      const rows = [];
      let cur = '';
      let row = [];
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '"') {
          const next = text[i+1];
          if (inQuotes && next === '"') { cur += '"'; i++; continue; }
          inQuotes = !inQuotes; continue;
        }
        if (ch === ',' && !inQuotes) { row.push(cur); cur = ''; continue; }
        if ((ch === '\n' || ch === '\r') && !inQuotes) {
          if (cur !== '' || row.length) { row.push(cur); cur = ''; }
          if (row.length) { rows.push(row); row = []; }
          if (ch === '\r' && text[i+1] === '\n') i++;
          continue;
        }
        cur += ch;
      }
      if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
      return rows;
    };

    // 3) Download each CSV and merge into masterObj
    const masterObj = {};
    for (const url of files) {
      try {
        const txt = await fetch(url).then(r => r.text());
        const table = parseCSV(txt);
        if (!table.length) continue;
        const headers = table[0].map(h => h.trim());
        for (let i = 1; i < table.length; i++) {
          const r = table[i];
          if (!r.length) continue;
          const obj = {};
          for (let c = 0; c < headers.length; c++) obj[headers[c]] = r[c] ?? '';
          if (obj.pTrdSymbol) masterObj[obj.pTrdSymbol.toUpperCase()] = obj;
        }
      } catch (e) {
        console.warn('Failed to fetch/parse', url, e?.message || e);
      }
    }

    // 4) Finalize index
    _data = {};
    const keys = Object.keys(masterObj).sort();
    for (const k of keys) _data[k] = masterObj[k];

    _updateStatus({ isLoading: false, isMissing: false, isSyncing: false, error: null });
    return _data;
  } catch (err) {
    _updateStatus({ isSyncing: false, isMissing: true, isLoading: false, error: err?.message || 'Sync failed' });
    return {};
  }
}

/**
 * SEARCH: High-performance prefix search
 */
export function search(query, limit = 10) {
  if (!_data || !query) return [];
  const searchKey = query.toUpperCase();

  const results = [];
  const keys = Object.keys(_data);
  for (let i = 0; i < keys.length && results.length < limit; i++) {
    if (keys[i].startsWith(searchKey)) {
      results.push(_data[keys[i]]);
    }
  }
  return results;
}

/**
 * OPTION UTILS: Filter CE/PE and find Expiries
 */
export function getOptionDetails(symbol) {
  if (!_data || !_data[symbol]) return null;
  return _data[symbol];
}

export function getLoadStatus() { return _loadStatus; }
export function isReady() { return _data !== null; }

export default {
  ensureLoaded,
  triggerBackgroundSync,
  search,
  getOptionDetails,
  getLoadStatus,
  isReady,
  // Node-only sync: dynamically imported so bundlers won't include Node modules for the browser
  async runNodeSync() {
    if (typeof window !== 'undefined') {
      throw new Error('runNodeSync() is Node-only and cannot be run in the browser');
    }

    // Load dotenv (side-effect) and heavy Node modules dynamically
    await import('dotenv/config');
    const fs = await import('fs-extra');
    const path = await import('path');
    const axios = (await import('axios')).default;
    const OTPAuth = (await import('otpauth')).default;
    const { parse } = await import('csv-parse/sync');

    const { ensureDir, writeJson, writeFile } = fs.default;

    const BASE_URL = process.env.VITE_NEO_BASE_URL;
    const TOKEN = process.env.VITE_NEO_TOKEN;
    const PHONE = process.env.VITE_NEO_PHONE;
    const UCC = process.env.VITE_NEO_UCC;
    const MPIN = process.env.VITE_NEO_MPIN;
    const TOTP_SECRET = process.env.VITE_NEO_TOTP_SECRET;

    if (!BASE_URL) {
      console.error('Missing VITE_NEO_BASE_URL in environment');
      process.exit(1);
    }

    const localApi = axios.create({ baseURL: BASE_URL, headers: { 'Content-Type': 'application/json' } });
    if (TOKEN) localApi.defaults.headers['Authorization'] = TOKEN;
    localApi.defaults.headers['neo-fin-key'] = 'neotradeapi';

    async function generateTOTP() {
      if (!TOTP_SECRET) throw new Error('Missing VITE_NEO_TOTP_SECRET');
      return new OTPAuth.TOTP({ algorithm: 'SHA1', digits: 6, period: 30, secret: TOTP_SECRET }).generate();
    }

    async function doLogin() {
      console.log('🔐 Starting login');
      const totp = await generateTOTP();
      const r1 = await localApi.post('login/1.0/tradeApiLogin', { mobileNumber: PHONE, ucc: UCC, totp });
      const { token, sid } = r1.data.data;

      const r2 = await localApi.post('login/1.0/tradeApiValidate', { mpin: MPIN }, { headers: { Auth: token, Sid: sid } });
      const finalToken = r2.data.data.token;
      const finalSid = r2.data.data.sid;
      localApi.defaults.headers['Auth'] = finalToken;
      localApi.defaults.headers['Sid'] = finalSid;
      console.log('✅ Login successful');
    }

    async function fetchFileList() {
      console.log('📡 Fetching master file list');
      const r = await localApi.get('/script-details/1.0/masterscrip/file-paths');
      return r.data?.data?.filesPaths || [];
    }

    async function sync() {
      try {
        await doLogin();
        const files = await fetchFileList();
        if (!files || files.length === 0) {
          console.warn('No master files returned');
          return;
        }

        const SAVE_FOLDER = path.join(process.cwd(), 'public', 'masterdata');
        await ensureDir(SAVE_FOLDER);

        let masterObj = {};
        for (const url of files) {
          const fileName = url.split('/').pop();
          console.log(`📥 Downloading ${fileName}`);
          const res = await axios.get(url, { responseType: 'text' });
          await writeFile(path.join(SAVE_FOLDER, fileName), res.data, 'utf8');

          const records = parse(res.data, { columns: true, skip_empty_lines: true, trim: true });
          for (const row of records) {
            // if (row.pTrdSymbol) masterObj[row.pTrdSymbol.toUpperCase()] = row;
            // Pick only the symbols you actually trade (e.g., exclude indices if needed)
            if (row.pTrdSymbol) {
                // MINIMIZE: Only save essential keys to save space
                masterObj[row.pTrdSymbol.toUpperCase()] = {
                    s: row.pTrdSymbol,    // Use short keys to save more bytes
                    t: row.pInstToken,   // Token
                    e: row.pExch,        // Exchange
                    st: row.pStrikePrice,// Strike
                    ot: row.pOptionType, // CE/PE
                    ls: row.pLotSize     // Lot Size
                };
            }
          }
        }

        console.log('⚡ Sorting and writing index');
        const sortedKeys = Object.keys(masterObj).sort();
        const finalIndex = {};
        for (const k of sortedKeys) finalIndex[k] = masterObj[k];

        await writeJson(path.join(SAVE_FOLDER, 'master_index.json'), finalIndex);
        console.log('✨ Sync complete.');
      } catch (err) {
        console.error('Sync failed:', err.message || err);
        process.exitCode = 1;
      }
    }

    await sync();
  }
};