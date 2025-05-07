import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/api';

interface User {
  email: string;
  role: string;
  id: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, password: string) => Promise<{success: boolean, message: string}>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Check if user is authenticated on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await authService.verifyToken();
          if (response.valid) {
            setUser(response.user);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (error) {
          // Error verifying token, clear it
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };
    
    verifyToken();
  }, [token]);
  
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authService.login(username, password);
      
      if (response.access_token) {
        localStorage.setItem('token', response.access_token);
        setToken(response.access_token);
        setUser(response.user);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const signup = async (username: string, password: string): Promise<{success: boolean, message: string}> => {
    try {
      setIsLoading(true);
      const response = await authService.signup(username, password);
      
      if (response.access_token) {
        localStorage.setItem('token', response.access_token);
        setToken(response.access_token);
        setUser(response.user);
        return { success: true, message: response.message || 'Registration successful' };
      }
      return { success: false, message: 'Registration failed' };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.error || 'An error occurred during registration' 
      };
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        signup,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
