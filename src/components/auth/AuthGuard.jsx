import React, { useEffect, useState } from 'react';
import { authService } from '../../api/neoApi';

const AuthGuard = ({ children }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        if (!localStorage.getItem('neo_auth')) {
          await authService.autoLogin();
          console.log('AuthGuard: Auto Login Successful');
        }
      } catch (e) {
        console.error('Login Failed', e);
      } finally {
        setReady(true);
      }
    };

    init();
  }, []);

  return ready ? <>{children}</> : <div>Connecting to Kotak Neo...</div>;
};

export default AuthGuard;
