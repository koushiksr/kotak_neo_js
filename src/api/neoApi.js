import axios from 'axios';
import * as OTPAuth from "otpauth";

// 1. Unified Environment & Storage Helper
const getEnv = (key) => typeof import.meta !== 'undefined' && import.meta.env?.[key];

const neoStorage = (typeof window !== 'undefined' && window.localStorage)
  ? window.localStorage
  : {
    _data: {},
    setItem(k, v) { this._data[k] = String(v); },
    getItem(k) { return this._data[k] || null; }
  };

// 2. CREATE THE CENTRAL INSTANCE
const neoApi = axios.create({
  baseURL: getEnv("VITE_NEO_BASE_URL"),
  headers: {
    'Content-Type': 'application/json', // Default for most calls
    'Authorization': getEnv("VITE_NEO_TOKEN"),
    'neo-fin-key': 'neotradeapi',
  }
});

// 3. INTERCEPTOR (The Magic)
// This automatically attaches your Sid and Auth tokens to EVERY call
neoApi.interceptors.request.use((config) => {
  const token = getEnv("VITE_NEO_TOKEN");
  const auth = neoStorage.getItem('neo_auth');
  const sid = neoStorage.getItem('neo_sid');

  if (token) config.headers['Authorization'] = token;
  config.headers['neo-fin-key'] = 'neotradeapi';

  if (auth) config.headers['Auth'] = auth;
  if (sid) config.headers['Sid'] = sid;

  return config;
});

// 4. AUTH SERVICE
export const authService = {
  generateTOTP() {
    return new OTPAuth.TOTP({
      algorithm: "SHA1", digits: 6, period: 30, secret: getEnv("VITE_NEO_TOTP_SECRET")
    }).generate();
  },

  async autoLogin() {
    const totp = this.generateTOTP();
    // Step 1: Login
    const r1 = await neoApi.post('login/1.0/tradeApiLogin', {
      mobileNumber: getEnv("VITE_NEO_PHONE"),
      ucc: getEnv("VITE_NEO_UCC"),
      totp
    });

    const { token, sid } = r1.data.data;

    // Step 2: MPIN Validation
    const r2 = await neoApi.post('login/1.0/tradeApiValidate', {
      mpin: getEnv("VITE_NEO_MPIN")
    }, {
      headers: { 'Auth': token, 'Sid': sid } // Pass temp tokens for validation
    });

    // Save final tokens
    neoStorage.setItem('neo_auth', r2.data.data.token);
    neoStorage.setItem('neo_sid', r2.data.data.sid);
    console.log("✅ Login Successful & Central Instance Authenticated");
  }
};

export default neoApi;