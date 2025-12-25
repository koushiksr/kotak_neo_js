// import Papa from 'papaparse';
// import { saveAll, getAll } from './symbolStore';

// let memoryCache = null;

// export const loadCsvOnce = async (url) => {
//     if (memoryCache) return memoryCache;

//     const cached = await getAll();
//     if (cached.length) {
//         memoryCache = cached;
//         return cached;
//     }

//     return new Promise((resolve) => {
//         Papa.parse(url, {
//             download: true,
//             header: true,
//             worker: true,
//             complete: async (res) => {
//                 await saveAll(res.data);
//                 memoryCache = res.data;
//                 resolve(res.data);
//             }
//         });
//     });
// };
