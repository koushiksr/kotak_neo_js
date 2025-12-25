// import Papa from 'papaparse';
// import neoApi from './neoApi';

// const searchCsvFiles = async ({
//     searchString = '',
//     columnName = 'pTrdSymbol',
//     maxMatches = 10,
// }) => {
//     const totalStart = Date.now();
//     const res = await neoApi.get('script-details/1.0/masterscrip/file-paths');
//     const files = res.data?.data?.filesPaths || [];

//     const orderedFiles = [
//         ...files.filter(f => f.includes('mcx_fo')),
//         ...files.filter(f => f.includes('nse_fo') && !f.includes('mcx_fo')),
//         ...files.filter(f => !f.includes('mcx_fo') && !f.includes('nse_fo')),
//     ];

//     const matches = [];
//     const searchLower = searchString.toLowerCase();

//     for (const file of orderedFiles) {
//         if (matches.length >= maxMatches) break;

//         const start = Date.now();

//         await new Promise((resolve) => {
//             Papa.parse(file, {
//                 download: true,          // 🔥 stream from URL
//                 header: true,
//                 worker: true,            // 🔥 offload parsing
//                 step: (result, parser) => {
//                     const value = result.data?.[columnName];
//                     if (
//                         typeof value === 'string' &&
//                         value.toLowerCase().includes(searchLower)
//                     ) {
//                         matches.push({
//                             file,
//                             row: value,
//                             fullRow: result.data,
//                         });

//                         if (matches.length >= maxMatches) {
//                             parser.abort();     // 🔥 HARD STOP
//                         }
//                     }
//                 },
//                 complete: () => resolve(),
//                 error: () => resolve(),
//             });
//         });

//         console.log(
//             `[FILE DONE] ${file} - Total Matches: ${matches.length}, Time: ${(
//                 (Date.now() - start) /
//                 1000
//             ).toFixed(2)}s`
//         );
//     }

//     console.log(
//         `[TOTAL TIME] ${((Date.now() - totalStart) / 1000).toFixed(2)}s`
//     );

//     return matches;
// };

// export default searchCsvFiles;
