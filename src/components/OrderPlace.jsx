// src/components/Terminal.jsx (used as OrderPlace)
import React, { useState, useEffect, useDeferredValue } from 'react';
import MasterData, { ensureLoaded, search as mdSearch, getLoadStatus, isReady } from '../services/masterDataService';

const Terminal = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState(getLoadStatus());
  
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let mounted = true;
    ensureLoaded()
      .then(() => { if (mounted) setStatus(getLoadStatus()); })
      .catch(() => { if (mounted) setStatus(getLoadStatus()); });

    const poll = setInterval(() => { if (mounted) setStatus(getLoadStatus()); }, 300);
    return () => { mounted = false; clearInterval(poll); };
  }, []);

  useEffect(() => {
    if (deferredQuery && deferredQuery.length > 2 && isReady()) {
      const res = mdSearch(deferredQuery, 20);
      setResults(res);
    } else {
      setResults([]);
    }
  }, [deferredQuery]);

  return (
    <div className="p-4 bg-black min-h-[400px]">
      {status.isSyncing && (
        <div className="bg-blue-600 text-white text-xs p-1 text-center animate-pulse">
          🔄 Syncing master data in background...
        </div>
      )}

      <input 
        className="w-full bg-zinc-900 border border-zinc-700 p-3 text-amber-500 font-mono outline-none"
        placeholder="Search Symbol (e.g. NIFTY26DEC)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="mt-2 space-y-1">
        {results.map((item) => (
          <div key={item.pInstToken || item.pTrdSymbol} className="p-2 bg-zinc-800 hover:bg-zinc-700 cursor-pointer flex justify-between">
            <span className="text-cyan-400 font-bold">{item.pTrdSymbol}</span>
            <span className="text-zinc-500 text-xs">{item.pInstToken}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Terminal;