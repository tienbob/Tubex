import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';
import { UserInfo } from '../services/api/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserInfo | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<any>;
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
      // First check if we have an access token using the auth service method
      const isAuth = authService.isAuthenticated();
      if (!isAuth) {
        console.log('User is not authenticated');
        setUser(null);
        return;
      }
      
      // Attempt to refresh token if needed (for Remember Me functionality)
      try {
        await authService.autoRefreshToken();
      } catch (error) {
        console.warn('Token auto-refresh failed:', error);
        // Continue anyway, the user might still be authenticated
      }
      
      // Get user info from storage
      const storedUser = authService.getCurrentUser();
      if (storedUser) {
        console.log('User info retrieved from storage:', storedUser);
        setUser(storedUser);
      } else {
        console.log('No valid user info found in storage');
        setUser(null);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
    const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await authService.login({
        email,
        password,
        rememberMe,
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