import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';
import { UserInfo } from '../services/api/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserInfo | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  validateToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  login: async () => ({}),
  logout: () => {},
  validateToken: async () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Check authentication status on mount
  useEffect(() => {
    console.log('AuthProvider: Initializing auth state');
    initializeAuth();
  }, []);
  
  const initializeAuth = async () => {
    setLoading(true);
    try {
      // First check if we have an access token
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('No access token found, user is not authenticated');
        setUser(null);
        return;
      }
      
      // Then validate the token
      const isValid = await validateToken();
      if (!isValid) {
        console.log('Token is invalid or expired');
        setUser(null);
        return;
      }
      
      // Get user info from storage
      const storedUser = localStorage.getItem('user_info');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('User info retrieved from storage:', parsedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error('Failed to parse stored user info:', error);
          setUser(null);
        }
      } else {
        console.log('No user info found in storage');
        setUser(null);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  
  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({
        email,
        password,
      });
      
      console.log('Login successful, auth response:', response);
      
      // The tokens should be automatically stored by authService.login
      // We just need to set the user state here
      const userInfo = authService.getCurrentUser();
      console.log('Current user info:', userInfo);
      
      setUser(userInfo);
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
  
  const logout = () => {
    console.log('Logging out user');
    authService.logout();
    setUser(null);
  };
  
  const validateToken = async (): Promise<boolean> => {
    try {
      console.log('Validating auth token');
      const valid = await authService.validateToken();
      console.log('Token validation result:', valid);
      return valid;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
        login,
        logout,
        validateToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);