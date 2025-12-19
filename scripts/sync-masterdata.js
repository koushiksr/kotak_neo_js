import 'dotenv/config';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import * as OTPAuth from 'otpauth';
import { parse } from 'csv-parse/sync';

const { ensureDir, writeJson, writeFile } = fs;

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

const neoApi = axios.create({ baseURL: BASE_URL, headers: { 'Content-Type': 'application/json' } });
if (TOKEN) neoApi.defaults.headers['Authorization'] = TOKEN;
neoApi.defaults.headers['neo-fin-key'] = 'neotradeapi';

async function generateTOTP() {
  if (!TOTP_SECRET) throw new Error('Missing VITE_NEO_TOTP_SECRET');
  return new OTPAuth.TOTP({ algorithm: 'SHA1', digits: 6, period: 30, secret: TOTP_SECRET }).generate();
}

async function doLogin() {
  console.log('🔐 Starting login');
  const totp = await generateTOTP();
  const r1 = await neoApi.post('login/1.0/tradeApiLogin', { mobileNumber: PHONE, ucc: UCC, totp });
  const { token, sid } = r1.data.data;

  const r2 = await neoApi.post('login/1.0/tradeApiValidate', { mpin: MPIN }, { headers: { Auth: token, Sid: sid } });
  const finalToken = r2.data.data.token;
  const finalSid = r2.data.data.sid;
  neoApi.defaults.headers['Auth'] = finalToken;
  neoApi.defaults.headers['Sid'] = finalSid;
  console.log('✅ Login successful');
}

async function fetchFileList() {
  console.log('📡 Fetching master file list');
  const r = await neoApi.get('/script-details/1.0/masterscrip/file-paths');
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
        if (row.pTrdSymbol) masterObj[row.pTrdSymbol.toUpperCase()] = row;
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

if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith('/sync-masterdata.js')) {
  // Run when executed directly
  sync();
}
