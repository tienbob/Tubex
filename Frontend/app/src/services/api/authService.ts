import { post, get } from './apiClient';
import { AxiosError } from 'axios';
import { jwtDecode } from 'jwt-decode';

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  data: any;
  
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface AuthResponse {
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

export interface UserInfo {
  userId: string;
  companyId: string;
  email: string;
  role: string;
  status: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  companyName: string;
  role: 'admin' | 'manager' | 'staff' | 'dealer' | 'supplier';
}

export interface RegisterCompanyRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
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

export interface EmployeeRegistrationRequest {
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

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface OAuthRegistrationRequest {
  tempUserId: string;
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
  userRole?: 'admin' | 'manager' | 'staff';
}

export interface EmployeeListResponse {
  employees: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
    department: string;
    employeeId: string;
    registrationDate: string;
    status: 'pending' | 'approved' | 'rejected';
  }>;
  total: number;
}

export interface InvitationCodeRequest {
  companyId: string;
}

export interface InvitationCodeResponse {
  status: string;
  data: {
    code: string;
    expiresAt: string;
    companyName: string;
  }
}

/**
 * Decode JWT and check expiry
 */
const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  try {
    const decoded: any = jwtDecode(token);
    if (!decoded.exp) return false;
    // exp is in seconds, Date.now() in ms
    return decoded.exp * 1000 > Date.now();
  } catch (e) {
    return false;
  }
};

/**
 * Validate token with backend (optional, for extra security)
 */
const validateTokenWithBackend = async (token: string): Promise<boolean> => {
  try {
    // Try to fetch user profile or /me endpoint
    await get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Authentication service with methods for login, registration, and other auth functions
 */
export const authService = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      // Input validation
      if (!credentials.email || !credentials.email.includes('@')) {
        throw new Error('Valid email is required');
      }
      
      if (!credentials.password || credentials.password.trim() === '') {
        throw new Error('Password is required');
      }
      
      const response = await post<AuthResponse>('/auth/login', credentials);
      
      // Extract data from response
      const responseData = response.data?.data || response.data;
      
      if (responseData?.accessToken) {
        // Store the tokens in secure storage
        localStorage.setItem('access_token', responseData.accessToken);
        localStorage.setItem('refresh_token', responseData.refreshToken);
        
        // Create a normalized user object
        const userInfo: UserInfo = {
          userId: responseData.userId,
          companyId: responseData.companyId,
          email: responseData.email || credentials.email,
          role: responseData.role || 'user',
          status: responseData.status || 'active',
          firstName: responseData.firstName || '',
          lastName: responseData.lastName || ''
        };
        
        // Store user info
        localStorage.setItem('user_info', JSON.stringify(userInfo));
      } else {
        throw new Error('Authentication failed: No access token in response');
      }
      
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Login failed. Please check your credentials.',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  
  /**
   * Register a new user and company
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      // Input validation
      if (!data.email || !data.email.includes('@')) {
        throw new Error('Valid email is required');
      }
      
      if (!data.password || data.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      if (!data.companyName || data.companyName.trim() === '') {
        throw new Error('Company name is required');
      }
      
      const response = await post<AuthResponse>('/auth/register', data);
      
      // Store tokens in localStorage if provided
      if (response.data?.data?.accessToken) {
        localStorage.setItem('access_token', response.data.data.accessToken);
        localStorage.setItem('refresh_token', response.data.data.refreshToken);
        
        const userInfo: UserInfo = {
          userId: response.data.data.userId,
          companyId: response.data.data.companyId,
          email: response.data.data.email || data.email,
          role: response.data.data.role || 'admin',
          status: response.data.data.status || 'active',
          firstName: response.data.data.firstName || '',
          lastName: response.data.data.lastName || ''
        };
        
        localStorage.setItem('user_info', JSON.stringify(userInfo));
      }
      
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Registration failed. Please try again.',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  setToken: (token: string): void => {
    localStorage.setItem('authToken', token);
  },
  
  /**
   * Register a new company with detailed information
   */
  registerCompany: async (data: RegisterCompanyRequest): Promise<AuthResponse> => {
    try {
      // Input validation
      if (!data.email || !data.email.includes('@')) {
        throw new Error('Valid email is required');
      }
      
      if (!data.password || data.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      if (!data.company.name || data.company.name.trim() === '') {
        throw new Error('Company name is required');
      }
      
      const response = await post<AuthResponse>('/auth/register', {
        email: data.email,
        password: data.password,
        company: data.company,
        firstName: data.firstName,
        lastName: data.lastName,
        userRole: 'admin'
      });
      
      // Store tokens if provided (might be pending verification)
      if (response.data?.data?.accessToken) {
        localStorage.setItem('access_token', response.data.data.accessToken);
        localStorage.setItem('refresh_token', response.data.data.refreshToken);
        
        const userInfo: UserInfo = {
          userId: response.data.data.userId,
          companyId: response.data.data.companyId,
          email: response.data.data.email || data.email,
          role: response.data.data.role || 'admin',
          status: response.data.data.status || 'active',
          firstName: data.firstName,
          lastName: data.lastName
        };
        
        localStorage.setItem('user_info', JSON.stringify(userInfo));
      }
      
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Company registration failed. Please try again.',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  
  /**
   * Register a new employee with company invitation
   */
  registerEmployee: async (data: EmployeeRegistrationRequest): Promise<AuthResponse> => {
    try {
      // Input validation
      if (!data.email || !data.email.includes('@')) {
        throw new Error('Valid email is required');
      }
      
      if (!data.password || data.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      if (!data.invitationCode) {
        throw new Error('Invitation code is required');
      }
      
      const response = await post<AuthResponse>('/auth/register-employee', data);
      
      // Store tokens if verification is not required
      if (response.data?.data?.accessToken && !response.data.data.requiresVerification) {
        localStorage.setItem('access_token', response.data.data.accessToken);
        localStorage.setItem('refresh_token', response.data.data.refreshToken);
        
        const userInfo: UserInfo = {
          userId: response.data.data.userId,
          companyId: response.data.data.companyId,
          email: response.data.data.email || data.email,
          role: response.data.data.role || 'staff',
          status: response.data.data.status || 'active',
          firstName: response.data.data.firstName || data.firstName,
          lastName: response.data.data.lastName || data.lastName
        };
        
        localStorage.setItem('user_info', JSON.stringify(userInfo));
      }
      
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Employee registration failed. Please try again.',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  
  /**
   * Admin verification of an employee
   */
  verifyEmployee: async (employeeId: string): Promise<{success: boolean; message: string}> => {
    try {
      if (!employeeId) {
        throw new Error('Employee ID is required');
      }
      
      const response = await post<{success: boolean; message: string}>('/auth/verify-employee', { employeeId });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Employee verification failed',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  
  /**
   * Admin rejection of an employee registration
   */
  rejectEmployee: async (employeeId: string, reason?: string): Promise<{success: boolean; message: string}> => {
    try {
      if (!employeeId) {
        throw new Error('Employee ID is required');
      }
      
      const response = await post<{success: boolean; message: string}>('/auth/reject-employee', { employeeId, reason });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Employee rejection failed',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  
  /**
   * Get pending employee registrations for admin approval
   */
  getPendingEmployees: async (): Promise<EmployeeListResponse> => {
    try {
      const response = await get<EmployeeListResponse>('/auth/pending-employees');
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch pending employees',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  
  /**
   * Refresh the access token using refresh token
   */
  refreshToken: async (refreshTokenData: RefreshTokenRequest): Promise<AuthResponse> => {
    try {
      if (!refreshTokenData.refreshToken) {
        throw new Error('Refresh token is required');
      }
      
      const response = await post<AuthResponse>('/auth/refresh-token', refreshTokenData);
      
      if (response.data?.data?.accessToken) {
        localStorage.setItem('access_token', response.data.data.accessToken);
      }
      
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to refresh token',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  
  /**
   * Request a password reset email
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<{success: boolean; message: string}> => {
    try {
      if (!data.email || !data.email.includes('@')) {
        throw new Error('Valid email is required');
      }
      
      const response = await post<{success: boolean; message: string}>('/auth/forgot-password', data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Password reset request failed',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  
  /**
   * Reset password with token
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<{success: boolean; message: string}> => {
    try {
      if (!data.token) {
        throw new Error('Reset token is required');
      }
      
      if (!data.newPassword || data.newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters long');
      }
      
      const response = await post<{success: boolean; message: string}>('/auth/reset-password', data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Password reset failed',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
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
   * Check if user is authenticated (valid, non-expired token)
   */
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('access_token');
    if (!isTokenValid(token)) {
      // Remove invalid token
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
      return false;
    }
    return true;
  },

  /**
   * Validate token with backend and auto-logout if invalid
   */
  validateToken: async (): Promise<boolean> => {
    const token = localStorage.getItem('access_token');
    if (!isTokenValid(token)) {
      authService.logout();
      return false;
    }
    // Optionally, validate with backend
    const valid = await validateTokenWithBackend(token!);
    if (!valid) {
      authService.logout();
      return false;
    }
    return true;
  },

  /**
   * Get current user info from localStorage
   */
  getCurrentUser: (): UserInfo | null => {
    const userInfo = localStorage.getItem('user_info');
    if (!userInfo) return null;
    
    try {
      return JSON.parse(userInfo) as UserInfo;
    } catch (error) {
      console.error('Error parsing user info:', error);
      return null;
    }
  },

  /**
   * Initiates Google OAuth login - redirects to Google login page
   */
  loginWithGoogle: (): void => {
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '';
    window.location.href = `${apiBaseUrl}/api/v1/auth/google`;
  },

  /**
   * Initiates Facebook OAuth login - redirects to Facebook login page
   */
  loginWithFacebook: (): void => {
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '';
    window.location.href = `${apiBaseUrl}/api/v1/auth/facebook`;
  },

  /**
   * Handle OAuth callback by extracting tokens from URL query params
   */
  handleOAuthCallback: (): { accessToken: string; refreshToken: string; userId: string; email: string; tempUserId?: string; needsRegistration?: boolean } | null => {
    // Get the query string from the current URL
    const queryParams = new URLSearchParams(window.location.search);
    const tokensParam = queryParams.get('tokens');
    const userId = queryParams.get('userId');
    const email = queryParams.get('email');
    
    if (tokensParam && userId && email) {
      try {
        // Parse the tokens JSON string
        const tokens = JSON.parse(decodeURIComponent(tokensParam));
        
        if (tokens.accessToken && tokens.refreshToken) {
          // Store tokens in localStorage
          localStorage.setItem('access_token', tokens.accessToken);
          localStorage.setItem('refresh_token', tokens.refreshToken);
          
          // Return the parsed data
          return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            userId,
            email: decodeURIComponent(email)
          };
        }
      } catch (error) {
        console.error('Error parsing OAuth callback data:', error);
      }
    }
    
    // If tempUserId is present, the user needs to complete registration
    const tempUserId = queryParams.get('tempUserId');
    if (tempUserId) {
      return {
        tempUserId,
        needsRegistration: true,
        email: queryParams.get('email') ? decodeURIComponent(queryParams.get('email') || '') : ''
      } as any;
    }
    
    return null;
  },

  /**
   * Complete registration for OAuth users
   */
  completeOAuthRegistration: async (data: OAuthRegistrationRequest): Promise<AuthResponse> => {
    try {
      if (!data.tempUserId) {
        throw new Error('Temporary user ID is required');
      }
      
      if (!data.company.name || data.company.name.trim() === '') {
        throw new Error('Company name is required');
      }
      
      const response = await post<AuthResponse>('/auth/complete-oauth-registration', data);
      
      // Store tokens in localStorage
      if (response.data?.data?.accessToken) {
        localStorage.setItem('access_token', response.data.data.accessToken);
        localStorage.setItem('refresh_token', response.data.data.refreshToken);
        
        const userInfo: UserInfo = {
          userId: response.data.data.userId,
          companyId: response.data.data.companyId,
          email: response.data.data.email || '',
          role: response.data.data.role || 'admin',
          status: response.data.data.status || 'active',
          firstName: response.data.data.firstName || '',
          lastName: response.data.data.lastName || ''
        };
        
        localStorage.setItem('user_info', JSON.stringify(userInfo));
      }
      
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'OAuth registration completion failed',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Generate invitation code for employee registration
   */
  generateInvitationCode: async (data: InvitationCodeRequest): Promise<InvitationCodeResponse> => {
    try {
      if (!data.companyId) {
        throw new Error('Company ID is required');
      }
      
      const response = await post<InvitationCodeResponse>('/auth/generate-invitation', data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to generate invitation code',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  
  /**
   * Validate invitation code
   */
  validateInvitationCode: async (code: string): Promise<{valid: boolean; companyName?: string; expiresAt?: string}> => {
    try {
      if (!code) {
        throw new Error('Invitation code is required');
      }
      
      const response = await get<{valid: boolean; companyName?: string; expiresAt?: string}>(`/auth/validate-invitation/${code}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        // Return invalid status instead of throwing error for this specific case
        return { valid: false };
      }
      throw error;
    }
  },
}