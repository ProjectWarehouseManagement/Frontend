import { createContext, useState, useEffect, useContext } from 'react';
import { ReactNode } from 'react';
import { api } from './environments/api';

type Role = 'USER' | 'ADMIN';

interface User {
  sub: number;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  user?: User;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await api.post('/auth/check');
        setUser(res.data.user);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error checking authentication status:', error);
        setIsLoggedIn(false);
      }
    };

    checkAuthStatus();
  }, [isLoggedIn]);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(undefined);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, logout, setIsLoggedIn, user }}>
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