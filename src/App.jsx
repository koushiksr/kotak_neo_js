import { useState, useEffect } from 'react';
import AuthGuard from './components/AuthGuard';
import OrderPlace from './components/OrderPlace';
import LoadingIndicator from './components/LoadingIndicator';
import MasterData from './services/masterDataService'; // Import instance only
// import MasterData from './services/masterDataService.js';
function App() {
  const [isMasterDataLoading, setIsMasterDataLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState(null);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    let poll;
    MasterData.ensureLoaded()
    .then(() => {
      setIsMasterDataLoading(false);
    })
    .catch(err => {
      console.error('Failed to load masterdata:', err);
      setIsMasterDataLoading(false);
    });
    
    // Poll load status so UI can show live isSyncing/isStale state
    poll = setInterval(() => setSyncStatus(MasterData.getLoadStatus()), 300);
    return () => clearInterval(poll);
  }, []);

  return (
    <AuthGuard>
      <div className="p-10 text-center bg-black min-h-screen">
        <h1 className="text-white text-2xl font-bold mb-6">Neo Trading Terminal</h1>
        {syncStatus && (syncStatus.isMissing || syncStatus.isStale) && (
          <div style={{color: '#FFD580', marginBottom: '12px', fontFamily: 'monospace'}}>
            {syncStatus.isMissing ? (
              <span>Masterdata missing. Run <strong>npm run sync</strong> to download.</span>
            ) : (
              <span>Masterdata stale (last: {syncStatus.lastModified} IST). Run <strong>npm run sync</strong>.</span>
            )}
            <button
              onClick={async () => {
                try { await navigator.clipboard.writeText('npm run sync'); setCopied(true); setTimeout(()=>setCopied(false),2000); }
                catch(e) { alert('Copy failed. Command: npm run sync'); }
              }}
              style={{ marginLeft: '12px', padding: '6px 10px', background: '#222', color: '#fff', border: '1px solid #444', cursor: 'pointer' }}
            >{copied ? 'Copied' : 'Copy Command'}</button>
          </div>
        )}
        <OrderPlace />
      </div>
      <LoadingIndicator 
        isLoading={isMasterDataLoading} 
        message="Loading masterdata..." 
        isMissing={syncStatus?.isMissing}
        error={syncStatus?.error}
        isSyncing={syncStatus?.isSyncing}
      />
    </AuthGuard>
  );
}
export default App;