import React, { createContext, useState, useEffect, useContext } from 'react';
import { ReactNode } from 'react';
import { api } from './environments/api';

interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        await api.post('/auth/check');
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error checking authentication status:', error);
        setIsLoggedIn(false);
      }
    };

    checkAuthStatus();
  }, []);

  const logout = async () => {
    try {
      await api.post('/auth/logout');

      setIsLoggedIn(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, logout, setIsLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook for easier consumption
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider, useAuth };