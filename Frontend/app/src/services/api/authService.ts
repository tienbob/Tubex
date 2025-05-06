import { post } from './apiClient';

interface AuthResponse {
  status: string;
  data: {
    userId: string;
    companyId: string;
    accessToken: string;
    refreshToken: string;
    message?: string;
    requiresVerification?: boolean;
    email?: string;
    role?: string;
    status?: string;
    firstName?: string;
    lastName?: string;
  };
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  companyName: string;
  role: 'admin' | 'manager' | 'staff' | 'dealer' | 'supplier';
}

// New interface for company registration
interface RegisterCompanyRequest {
  email: string;
  password: string;
  company: {
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
  };
}

// New interface for employee registration
interface EmployeeRegistrationRequest {
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

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Authentication service with methods for login, registration, and other auth functions
 */
const authService = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await post<AuthResponse>('/auth/login', credentials);
    
    // Store tokens in localStorage
    if (response.data?.data?.accessToken) {
      localStorage.setItem('access_token', response.data.data.accessToken);
      localStorage.setItem('refresh_token', response.data.data.refreshToken);
      localStorage.setItem('user_info', JSON.stringify({
        userId: response.data.data.userId,
        companyId: response.data.data.companyId,
        email: response.data.data.email,
        role: response.data.data.role,
        status: response.data.data.status,
        firstName: response.data.data.firstName,
        lastName: response.data.data.lastName
      }));
    }
    
    return response.data;
  },
  
  /**
   * Register a new user and company
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await post<AuthResponse>('/auth/register', data);
    
    // Store tokens in localStorage
    if (response.data?.data?.accessToken) {
      localStorage.setItem('access_token', response.data.data.accessToken);
      localStorage.setItem('refresh_token', response.data.data.refreshToken);
      localStorage.setItem('user_info', JSON.stringify({
        userId: response.data.data.userId,
        companyId: response.data.data.companyId,
        email: response.data.data.email,
        role: response.data.data.role,
        status: response.data.data.status
      }));
    }
    
    return response.data;
  },
  
  /**
   * Register a new company with detailed information
   */
  registerCompany: async (data: RegisterCompanyRequest): Promise<AuthResponse> => {
    const response = await post<AuthResponse>('/auth/register-company', data);
    
    // Store tokens in localStorage if provided (might be pending verification)
    if (response.data?.data?.accessToken) {
      localStorage.setItem('access_token', response.data.data.accessToken);
      localStorage.setItem('refresh_token', response.data.data.refreshToken);
      localStorage.setItem('user_info', JSON.stringify({
        userId: response.data.data.userId,
        companyId: response.data.data.companyId,
        email: response.data.data.email,
        role: response.data.data.role,
        status: response.data.data.status
      }));
    }
    
    return response.data;
  },
  
  /**
   * Register a new employee with company invitation
   */
  registerEmployee: async (data: EmployeeRegistrationRequest): Promise<AuthResponse> => {
    const response = await post<AuthResponse>('/auth/register-employee', data);
    
    // Store tokens in localStorage if verification is not required
    if (response.data?.data?.accessToken && !response.data.data.requiresVerification) {
      localStorage.setItem('access_token', response.data.data.accessToken);
      localStorage.setItem('refresh_token', response.data.data.refreshToken);
      localStorage.setItem('user_info', JSON.stringify({
        userId: response.data.data.userId,
        companyId: response.data.data.companyId,
        email: response.data.data.email,
        role: response.data.data.role,
        status: response.data.data.status,
        firstName: response.data.data.firstName,
        lastName: response.data.data.lastName
      }));
    }
    
    return response.data;
  },
  
  /**
   * Admin verification of an employee
   */
  verifyEmployee: async (employeeId: string): Promise<any> => {
    const response = await post<any>('/auth/verify-employee', { employeeId });
    return response.data;
  },
  
  /**
   * Admin rejection of an employee registration
   */
  rejectEmployee: async (employeeId: string, reason?: string): Promise<any> => {
    const response = await post<any>('/auth/reject-employee', { employeeId, reason });
    return response.data;
  },
  
  /**
   * Get pending employee registrations for admin approval
   */
  getPendingEmployees: async (): Promise<any> => {
    const response = await post<any>('/auth/pending-employees', {});
    return response.data;
  },
  
  /**
   * Refresh the access token using refresh token
   */
  refreshToken: async (refreshTokenData: RefreshTokenRequest): Promise<AuthResponse> => {
    const response = await post<AuthResponse>('/auth/refresh-token', refreshTokenData);
    
    if (response.data?.data?.accessToken) {
      localStorage.setItem('access_token', response.data.data.accessToken);
    }
    
    return response.data;
  },
  
  /**
   * Request a password reset email
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<any> => {
    const response = await post<any>('/auth/forgot-password', data);
    return response.data;
  },
  
  /**
   * Reset password with token
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<any> => {
    const response = await post<any>('/auth/reset-password', data);
    return response.data;
  },
  
  /**
   * Logout user (clear tokens)
   */
  logout: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
  },
  
  /**
   * Check if user is authenticated (has a valid token)
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },
  
  /**
   * Get current user info from localStorage
   */
  getCurrentUser: (): { userId: string; companyId: string; email?: string; role?: string; status?: string; firstName?: string; lastName?: string } | null => {
    const userInfo = localStorage.getItem('user_info');
    if (!userInfo) return null;
    return JSON.parse(userInfo);
  }
};

export default authService;