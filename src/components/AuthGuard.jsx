import React, { useState, useEffect } from 'react';
import { authService } from '../api/neoApi';

const AuthGuard = ({ children }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!localStorage.getItem('neo_auth')) {
        try { await authService.autoLogin(); } 
        catch (e) { console.error("Login Failed"); }
      }
      setReady(true);
    };
    init();
  }, []);

  return ready ? <>{children}</> : <div>Connecting to Kotak Neo...</div>;
};

export default AuthGuard;