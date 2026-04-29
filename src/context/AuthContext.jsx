import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasCredential, setHasCredential] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage on mount
    const checkAuth = () => {
      const registered = localStorage.getItem('trustid_registered');
      const loggedIn = localStorage.getItem('trustid_loggedIn');
      const credential = localStorage.getItem('trustid_credential');

      setIsRegistered(!!registered);
      setIsLoggedIn(!!loggedIn);
      setHasCredential(!!credential);
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = () => {
    localStorage.setItem('trustid_loggedIn', JSON.stringify({ loggedIn: true, loginTime: Date.now() }));
    setIsLoggedIn(true);
  };

  const register = (mobile) => {
    localStorage.setItem('trustid_registered', JSON.stringify({ mobile, verified: true, timestamp: Date.now() }));
    setIsRegistered(true);
  };

  const createCredential = (credentialData) => {
    localStorage.setItem('trustid_credential', JSON.stringify(credentialData));
    setHasCredential(true);
  };

  const revokeAll = () => {
    localStorage.clear();
    setIsRegistered(false);
    setIsLoggedIn(false);
    setHasCredential(false);
  };

  const value = {
    isRegistered,
    isLoggedIn,
    hasCredential,
    loading,
    login,
    register,
    createCredential,
    revokeAll
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
