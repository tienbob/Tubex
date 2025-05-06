import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';

// Define types for company details
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

// Define types for employee registration
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

// Define user with additional properties
interface User {
  userId: string;
  companyId: string;
  email?: string;
  role?: string;
  status?: string;
  firstName?: string;
  lastName?: string;
}

// Define the shape of the auth context
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, companyDetails: any) => Promise<void>; // Legacy method
  registerCompany: (email: string, password: string, companyDetails: CompanyDetails) => Promise<void>;
  registerEmployee: (employeeData: EmployeeRegistration) => Promise<void>;
  verifyEmployee: (employeeId: string) => Promise<void>;
  rejectEmployee: (employeeId: string, reason?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  register: async () => {},
  registerCompany: async () => {},
  registerEmployee: async () => {},
  verifyEmployee: async () => {},
  rejectEmployee: async () => {},
  logout: () => {},
  loading: true,
  error: null,
});

interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component that wraps the app
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authService.isAuthenticated();
      const currentUser = authService.getCurrentUser();
      
      setIsAuthenticated(isAuth);
      setUser(currentUser);
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authService.login({ email, password });
      
      setIsAuthenticated(true);
      setUser({
        userId: response.data.userId,
        companyId: response.data.companyId,
        email: response.data.email,
        role: response.data.role,
        status: response.data.status,
        firstName: response.data.firstName,
        lastName: response.data.lastName
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Legacy Register function (kept for backward compatibility)
  const register = async (
    email: string,
    password: string,
    companyDetails: any
  ) => {
    return registerCompany(email, password, companyDetails);
  };

  // Company Registration function
  const registerCompany = async (
    email: string,
    password: string,
    companyDetails: CompanyDetails
  ) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authService.registerCompany({
        email,
        password,
        company: companyDetails
      });
      
      setIsAuthenticated(true);
      setUser({
        userId: response.data.userId,
        companyId: response.data.companyId,
        email: response.data.email,
        role: response.data.role,
        status: response.data.status
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Company registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Employee Registration function
  const registerEmployee = async (employeeData: EmployeeRegistration) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authService.registerEmployee(employeeData);
      
      // Note: For employees, they may need admin verification before authentication
      if (response.data.requiresVerification) {
        setError('Your registration is pending approval from a company administrator.');
        return;
      }
      
      setIsAuthenticated(true);
      setUser({
        userId: response.data.userId,
        companyId: response.data.companyId,
        email: response.data.email,
        role: response.data.role,
        status: response.data.status,
        firstName: response.data.firstName,
        lastName: response.data.lastName
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Employee registration failed. Please verify your invitation code and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Admin function to verify an employee
  const verifyEmployee = async (employeeId: string) => {
    try {
      setError(null);
      setLoading(true);
      
      await authService.verifyEmployee(employeeId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify employee.');
    } finally {
      setLoading(false);
    }
  };

  // Admin function to reject an employee
  const rejectEmployee = async (employeeId: string, reason?: string) => {
    try {
      setError(null);
      setLoading(true);
      
      await authService.rejectEmployee(employeeId, reason);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject employee.');
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        register,
        registerCompany,
        registerEmployee,
        verifyEmployee,
        rejectEmployee,
        logout,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext;