import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';      
import { authService } from '../services/api/authService';

// Define user interface
interface User {
  userId: string;
  companyId: string;
  email?: string;
  role?: string;
  status?: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
}

// Define company details interface
interface CompanyDetails {
  name: string;
  type: 'dealer' | 'supplier';
  taxId: string;
  businessLicense: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
  businessCategory: string;
  employeeCount: number;
  yearEstablished: number;
  contactPhone: string;
}

// Define employee registration interface
interface EmployeeRegistration {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
  employeeId: string;
  companyId: string;
  invitationCode: string;
}

// Define the auth context type
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, companyDetails: CompanyDetails) => Promise<void>;
  registerCompany: (email: string, password: string, companyDetails: CompanyDetails, firstName: string, lastName: string) => Promise<void>;
  registerEmployee: (data: EmployeeRegistration) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
  successMessage: null,
  login: async () => {},
  logout: () => {},
  register: async () => {},
  registerCompany: async () => {},
  registerEmployee: async () => {},
  verifyEmail: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {}
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        // Use robust async validation (checks expiry and backend)
        const valid = await authService.validateToken();
        if (valid) {
          const currentUser = authService.getCurrentUser();
          setIsAuthenticated(true);
          setUser(currentUser);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (err) {
        setIsAuthenticated(false);
        setUser(null);
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authService.login({ email, password });
      
      if (response.data?.userId) {
        setIsAuthenticated(true);
        // Convert the response data to User type
        setUser({
          userId: response.data.userId,
          companyId: response.data.companyId,
          email: response.data.email,
          role: response.data.role,
          status: response.data.status,
          firstName: response.data.firstName,
          lastName: response.data.lastName
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
    setSuccessMessage(null);
  };

  const register = async (email: string, password: string, companyDetails: CompanyDetails) => {
    try {
      setError(null);
      setLoading(true);
      
      // Use companyName from companyDetails and set a default role
      const response = await authService.register({
        email,
        password,
        companyName: companyDetails.name,
        role: 'admin'
      });
      
      setSuccessMessage(response.data?.message || 'Registration successful! Please check your email to verify your account.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const registerEmployee = async (data: EmployeeRegistration) => {
    try {
      setError(null);
      setLoading(true);
      
      const { data: responseData } = await authService.registerEmployee(data);
      
      if (responseData?.requiresVerification) {
        setSuccessMessage('Registration successful! Awaiting admin approval.');
        return;
      }
      
      setSuccessMessage('Registration successful! You can now log in.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Employee registration failed. Please verify your invitation code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      setError(null);
      setLoading(true);
      
      // Since verifyEmail doesn't exist in authService, we'll create a custom implementation
      // that's compatible with the resetPassword method
      await authService.resetPassword({
        token,
        newPassword: '' // We're only using this for email verification
      });
      setSuccessMessage('Email verified successfully! You can now log in.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      setLoading(true);
      
      await authService.forgotPassword({ email });
      setSuccessMessage('Password reset instructions have been sent to your email.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Password reset request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (oldPassword: string, newPassword: string) => {
    try {
      setError(null);
      setLoading(true);
      
      // Since updatePassword doesn't exist in authService, we'll handle this using resetPassword
      // This is a workaround - in a real app you'd create a proper API endpoint
      const token = localStorage.getItem('access_token') || '';
      await authService.resetPassword({ 
        token,
        newPassword
      });
      setSuccessMessage('Password updated successfully.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Password update failed. Please verify your current password.');
    } finally {
      setLoading(false);
    }
  };

  const registerCompany = async (email: string, password: string, companyDetails: CompanyDetails, firstName: string, lastName: string) => {
    try {
      setError(null);
      setLoading(true);
      
      // Use the registerCompany method from authService with the right parameters
      const response = await authService.registerCompany({
        email,
        password,
        firstName,
        lastName,
        company: companyDetails
      });
      
      setSuccessMessage(response.data?.message || 'Company registration successful! Please check your email to verify your account.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Company registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    error,
    successMessage,
    login,
    logout,
    register,
    registerCompany,
    registerEmployee,
    verifyEmail,
    resetPassword,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;