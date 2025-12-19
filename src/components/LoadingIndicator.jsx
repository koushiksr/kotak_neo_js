import React from 'react';
import { Loader, AlertCircle } from 'lucide-react';

const LoadingIndicator = ({ isLoading, message = "Loading masterdata...", isMissing, error, isSyncing }) => {
  if (!isLoading && !error && !isSyncing) return null;

  const displayMessage = error || (isSyncing ? 'Syncing masterdata...' : message);
  const isError = !!error;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 16px',
      backgroundColor: isError ? '#1a0a0a' : '#1a1a1a',
      border: `1px solid ${isError ? '#662222' : '#333'}`,
      borderRadius: '6px',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      fontFamily: 'monospace',
      fontSize: '12px',
      color: isError ? '#FF6B6B' : '#00FF00',
      maxWidth: '350px'
    }}>
      {isSyncing ? (
        <Loader size={16} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
      ) : isLoading && !isError ? (
        <Loader size={16} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
      ) : isError ? (
        <AlertCircle size={16} style={{ flexShrink: 0 }} />
      ) : null}
      <span style={{ wordBreak: 'break-word' }}>{displayMessage}</span>
      {error && (
        <span style={{ fontSize: '10px', color: '#FFB000', marginLeft: '8px', cursor: 'pointer' }} 
              onClick={() => window.location.href = 'https://github.com'}>
          docs
        </span>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingIndicator;
