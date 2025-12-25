import 'dotenv/config';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import sqlite3 from 'better-sqlite3';
import * as OTPAuth from 'otpauth';
import { parse } from 'csv-parse/sync';

// --- Configuration ---
const { 
    VITE_NEO_BASE_URL: BASE_URL, 
    VITE_NEO_TOKEN: TOKEN,
    VITE_NEO_PHONE: PHONE, 
    VITE_NEO_UCC: UCC, 
    VITE_NEO_MPIN: MPIN, 
    VITE_NEO_TOTP_SECRET: TOTP_SECRET 
} = process.env;

const SAVE_DIR = './public/masterdata';
const DB_PATH = path.join(SAVE_DIR, 'master.db');

const neoApi = axios.create({ 
    baseURL: BASE_URL, 
    headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${TOKEN}`,
        'neo-fin-key': 'neotradeapi' 
    } 
});

function getISTDateString(date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}

async function runSync() {
    try {
        await fs.ensureDir(SAVE_DIR);

        // 1. IST DATE CHECK
        const todayIST = getISTDateString();
        if (fs.existsSync(DB_PATH)) {
            const stats = fs.statSync(DB_PATH);
            if (getISTDateString(stats.mtime) === todayIST) {
                console.log(`✅ Data is fresh (IST: ${todayIST}). Skipping.`);
                testRetrieval();
                return;
            }
        }

        // 2. LOGIN
        console.log('🔐 Logging into Neo...');
        const totp = new OTPAuth.TOTP({ algorithm: 'SHA1', digits: 6, period: 30, secret: TOTP_SECRET }).generate();
        const r1 = await neoApi.post('login/1.0/tradeApiLogin', { mobileNumber: PHONE, ucc: UCC, totp });
        const { token: t1, sid: s1 } = r1.data.data;
        const r2 = await neoApi.post('login/1.0/tradeApiValidate', { mpin: MPIN }, { headers: { Auth: t1, Sid: s1 } });
        neoApi.defaults.headers['Auth'] = r2.data.data.token;
        neoApi.defaults.headers['Sid'] = r2.data.data.sid;

        // 3. FETCH & CONSOLIDATE
        const r3 = await neoApi.get('/script-details/1.0/masterscrip/file-paths');
        const files = r3.data?.data?.filesPaths || [];
        
        let allRecords = [];

        for (const url of files) {
            console.log(`📥 Downloading ${url.split('/').pop()}...`);
            const res = await axios.get(url, { responseType: 'text' });
            const records = parse(res.data, { columns: true, skip_empty_lines: true, trim: true });
            
            // Collect all valid symbols into one array
            for (const row of records) {
                if (row.pTrdSymbol) {
                    allRecords.push({
                        t: row.pInstToken,
                        s: row.pTrdSymbol.toUpperCase(),
                        e: row.pExch,
                        st: row.pStrikePrice || '0',
                        ot: row.pOptionType || 'XX'
                    });
                }
            }
        }

        // 4. SORT EVERYTHING GLOBALLY
        console.log(`⚡ Sorting ${allRecords.length} total records...`);
        allRecords.sort((a, b) => a.s.localeCompare(b.s));

        // 5. SAVE TO SQLITE
        console.log('🏗️ Writing sorted data to master.db...');
        if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
        const db = sqlite3(DB_PATH);
        
        // Using WITHOUT ROWID for a clustered index effect on 'symbol'
        db.exec(`
            CREATE TABLE symbols (
                symbol TEXT PRIMARY KEY,
                token TEXT,
                exch TEXT,
                strike TEXT,
                type TEXT
            ) WITHOUT ROWID;
        `);

        const insert = db.prepare('INSERT INTO symbols VALUES (?, ?, ?, ?, ?)');
        
        const insertBatch = db.transaction((items) => {
            for (const item of items) {
                insert.run(item.s, item.t, item.e, item.st, item.ot);
            }
        });

        insertBatch(allRecords);
        db.close();
        
        console.log(`✨ Sync complete. DB size: ${(fs.statSync(DB_PATH).size / 1024 / 1024).toFixed(2)} MB`);
        testRetrieval();

    } catch (err) {
        console.error('❌ FAILED:', err.response?.data || err.message);
        process.exit(1);
    }
}

function testRetrieval() {
    const db = sqlite3(DB_PATH);
    const start = performance.now();
    const matches = db.prepare("SELECT * FROM symbols WHERE symbol LIKE 'NIFTY%' LIMIT 10").all();
    const end = performance.now();
    console.log('🔍 Top 10 Matches:', matches);
    console.log(`🚀 Search took: ${(end - start).toFixed(4)}ms`);
    db.close();
}

runSync();