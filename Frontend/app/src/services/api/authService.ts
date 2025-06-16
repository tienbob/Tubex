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
  avatarUrl?: string; // Add this property definition
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
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
    expiresIn: string;
  }
}

/**
 * Get token from storage (handles both old string format and new object format)
 */
const getTokenFromStorage = (key: string): string | null => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    // Try to parse as JSON (new format)
    try {
      const tokenData = JSON.parse(stored);
      if (tokenData.token && tokenData.expiration) {
        // Check if token has expired based on our custom expiration
        if (Date.now() > tokenData.expiration) {
          console.log(`Token expired (custom expiration), removing from storage`);
          localStorage.removeItem(key);
          return null;
        }
        return tokenData.token;
      }
    } catch {
      // Not JSON, assume old string format
      return stored;
    }
    
    return stored;
  } catch (error) {
    console.error(`Error getting token from ${key}:`, error);
    return null;
  }
};

/**
 * Decode JWT and check expiry
 */
const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  try {
    const decoded: any = jwtDecode(token);
    if (!decoded.exp) return false;
    // exp is in seconds, Date.now() in ms
    const isValid = decoded.exp * 1000 > Date.now();
    console.log('Token expiry check:', { 
      exp: new Date(decoded.exp * 1000).toISOString(),
      now: new Date().toISOString(),
      isValid
    });
    return isValid;
  } catch (e) {
    console.error('Failed to decode token:', e);
    return false;
  }
};

/**
 * Validate token with backend (optional, for extra security)
 */
const validateTokenWithBackend = async (token: string): Promise<boolean> => {
  try {
    // Try to fetch user profile or /me endpoint
    const response = await get('/auth/me', { 
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Backend token validation success:', response.data);
    return true;
  } catch (e) {
    console.error('Backend token validation failed:', e);
    return false;
  }
};

/**
 * Authentication service with methods for login, registration, and other auth functions
 */
export const authService = {
  /**
   * Login with email and password
   */  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
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
        // Calculate token expiration based on remember me option
        const tokenExpiration = credentials.rememberMe 
          ? Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
          : Date.now() + (24 * 60 * 60 * 1000); // 1 day (default)
        
        // Store the tokens with expiration info
        const tokenData = {
          token: responseData.accessToken,
          expiration: tokenExpiration,
          rememberMe: credentials.rememberMe || false
        };
        
        const refreshTokenData = {
          token: responseData.refreshToken,
          expiration: tokenExpiration,
          rememberMe: credentials.rememberMe || false
        };
        
        localStorage.setItem('access_token', JSON.stringify(tokenData));
        localStorage.setItem('refresh_token', JSON.stringify(refreshTokenData));
        
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
        
        // Store user info with expiration
        const userInfoData = {
          ...userInfo,
          expiration: tokenExpiration,
          rememberMe: credentials.rememberMe || false
        };
        
        localStorage.setItem('user_info', JSON.stringify(userInfoData));
        
        console.log(`Tokens stored with ${credentials.rememberMe ? '7 day' : '1 day'} expiration`);
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
        // Use default 1 day expiration for registration
        const tokenExpiration = Date.now() + (24 * 60 * 60 * 1000);
        
        const tokenData = {
          token: response.data.data.accessToken,
          expiration: tokenExpiration,
          rememberMe: false
        };
        
        const refreshTokenData = {
          token: response.data.data.refreshToken,
          expiration: tokenExpiration,
          rememberMe: false
        };
        
        localStorage.setItem('access_token', JSON.stringify(tokenData));
        localStorage.setItem('refresh_token', JSON.stringify(refreshTokenData));
        
        const userInfo: UserInfo = {
          userId: response.data.data.userId,
          companyId: response.data.data.companyId,
          email: response.data.data.email || data.email,
          role: response.data.data.role || 'admin',
          status: response.data.data.status || 'active',
          firstName: response.data.data.firstName || '',
          lastName: response.data.data.lastName || ''
        };
        
        const userInfoData = {
          ...userInfo,
          expiration: tokenExpiration,
          rememberMe: false
        };
        
        localStorage.setItem('user_info', JSON.stringify(userInfoData));
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
      console.log('Sending registration request with data:', {
        email: data.email,
        // Don't log password
        company: data.company,
        firstName: data.firstName,
        lastName: data.lastName
      });

      const response = await post<AuthResponse>('/auth/register', {
        email: data.email,
        password: data.password,
        company: data.company,
        firstName: data.firstName,
        lastName: data.lastName,
        userRole: 'admin'
      });
      
      console.log('Registration response received:', response.data);
      
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
        // Use default 1 day expiration for employee registration
        const tokenExpiration = Date.now() + (24 * 60 * 60 * 1000);
        
        const tokenData = {
          token: response.data.data.accessToken,
          expiration: tokenExpiration,
          rememberMe: false
        };
        
        const refreshTokenData = {
          token: response.data.data.refreshToken,
          expiration: tokenExpiration,
          rememberMe: false
        };
        
        localStorage.setItem('access_token', JSON.stringify(tokenData));
        localStorage.setItem('refresh_token', JSON.stringify(refreshTokenData));
        
        const userInfo: UserInfo = {
          userId: response.data.data.userId,
          companyId: response.data.data.companyId,
          email: response.data.data.email || data.email,
          role: response.data.data.role || 'staff',
          status: response.data.data.status || 'active',
          firstName: response.data.data.firstName || data.firstName,
          lastName: response.data.data.lastName || data.lastName
        };
        
        const userInfoData = {
          ...userInfo,
          expiration: tokenExpiration,
          rememberMe: false
        };
        
        localStorage.setItem('user_info', JSON.stringify(userInfoData));
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
    }  },
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
        // Get existing token data to preserve rememberMe setting
        const existingTokenData = localStorage.getItem('access_token');
        let rememberMe = false;
        
        try {
          const parsed = JSON.parse(existingTokenData || '{}');
          rememberMe = parsed.rememberMe || false;
        } catch (e) {
          // If parsing fails, assume false
          rememberMe = false;
        }
        
        // Calculate new expiration based on remember me setting
        const tokenExpiration = rememberMe 
          ? Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
          : Date.now() + (24 * 60 * 60 * 1000); // 1 day
        
        const tokenData = {
          token: response.data.data.accessToken,
          expiration: tokenExpiration,
          rememberMe
        };
        
        localStorage.setItem('access_token', JSON.stringify(tokenData));
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
   * Check if user is authenticated (considering both JWT expiration and custom expiration)
   */  
  isAuthenticated: (): boolean => {
    const tokenData = localStorage.getItem('access_token');
    if (!tokenData) return false;
    
    try {
      const parsed = JSON.parse(tokenData);
      
      // Check our custom expiration first (for Remember Me functionality)
      if (parsed.expiration && Date.now() > parsed.expiration) {
        console.log('Token expired (custom expiration), user session ended');
        authService.logout();
        return false;
      }
      
      // Get the actual token
      const token = parsed.token || tokenData; // fallback for old format
      
      // Check JWT expiration
      const isJwtValid = isTokenValid(token);
      console.log('Authentication check:', { 
        hasToken: !!token, 
        isJwtValid,
        customExpirationValid: !parsed.expiration || Date.now() <= parsed.expiration,
        rememberMe: parsed.rememberMe || false
      });
      
      // If JWT is expired but we're within our custom expiration window (Remember Me),
      // we should attempt to refresh the token
      if (!isJwtValid && parsed.expiration && Date.now() <= parsed.expiration) {
        console.log('JWT expired but within Remember Me window, token refresh needed');
        // Return true for now, let the refresh happen in the background
        return true;
      }
      
      if (!isJwtValid) {
        // Both JWT and custom expiration failed
        authService.logout();
        return false;
      }
      
      return true;
    } catch (e) {
      // If parsing fails, treat as old format
      const token = tokenData;
      const isValid = isTokenValid(token);
      console.log('Authentication check (old format):', { hasToken: !!token, isValid });
      
      if (!isValid) {
        authService.logout();
      }
      return isValid;
    }
  },
  /**
   * Validate token with backend and auto-logout if invalid
   */
  validateToken: async (): Promise<boolean> => {
    const token = getTokenFromStorage('access_token');
    if (!token) {
      console.log('No token to validate');
      return false;
    }
    
    // First check locally
    if (!isTokenValid(token)) {
      console.log('Token is expired (local check)');
      authService.logout();
      return false;
    }
    
    // Then optionally validate with backend
    try {
      // You can skip backend validation for better performance
      // or uncomment this to enable strict validation
      /*
      const valid = await validateTokenWithBackend(token);
      if (!valid) {
        console.log('Token rejected by backend');
        authService.logout();
        return false;
      }
      */
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  },
  /**
   * Get current user info from localStorage
   */
  getCurrentUser: (): UserInfo | null => {
    const userInfo = localStorage.getItem('user_info');
    if (!userInfo) return null;
    
    try {
      const parsed = JSON.parse(userInfo);
      
      // Check if user info has expiration and if it's expired
      if (parsed.expiration && Date.now() > parsed.expiration) {
        console.log('User info expired, removing from storage');
        localStorage.removeItem('user_info');
        return null;
      }
      
      // Return only the user info part, excluding meta data like expiration
      const userInfoData: UserInfo = {
        userId: parsed.userId,
        companyId: parsed.companyId,
        email: parsed.email,
        role: parsed.role,
        status: parsed.status,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        avatarUrl: parsed.avatarUrl
      };
      
      return userInfoData;
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
          // Store tokens in localStorage with default 1 day expiration
          const tokenExpiration = Date.now() + (24 * 60 * 60 * 1000);
          
          const tokenData = {
            token: tokens.accessToken,
            expiration: tokenExpiration,
            rememberMe: false
          };
          
          const refreshTokenData = {
            token: tokens.refreshToken,
            expiration: tokenExpiration,
            rememberMe: false
          };
          
          localStorage.setItem('access_token', JSON.stringify(tokenData));
          localStorage.setItem('refresh_token', JSON.stringify(refreshTokenData));
          
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
        // Use default 1 day expiration for OAuth registration
        const tokenExpiration = Date.now() + (24 * 60 * 60 * 1000);
        
        const tokenData = {
          token: response.data.data.accessToken,
          expiration: tokenExpiration,
          rememberMe: false
        };
        
        const refreshTokenData = {
          token: response.data.data.refreshToken,
          expiration: tokenExpiration,
          rememberMe: false
        };
        
        localStorage.setItem('access_token', JSON.stringify(tokenData));
        localStorage.setItem('refresh_token', JSON.stringify(refreshTokenData));
        
        const userInfo: UserInfo = {
          userId: response.data.data.userId,
          companyId: response.data.data.companyId,
          email: response.data.data.email || '',
          role: response.data.data.role || 'admin',
          status: response.data.data.status || 'active',
          firstName: response.data.data.firstName || '',
          lastName: response.data.data.lastName || ''
        };
        
        const userInfoData = {
          ...userInfo,
          expiration: tokenExpiration,
          rememberMe: false
        };
        
        localStorage.setItem('user_info', JSON.stringify(userInfoData));
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
   */  generateInvitationCode: async (data: InvitationCodeRequest): Promise<InvitationCodeResponse> => {
    try {
      if (!data.companyId) {
        throw new Error('Company ID is required');
      }
      
      const response = await post<InvitationCodeResponse>('/auth/invitation-code', data);
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

  /**
   * Get pending employees (employees who have registered but not verified their email)
   */  getPendingEmployees: async (companyId?: string): Promise<{ employees: Array<any>; count: number }> => {
    try {
      const queryParam = companyId ? `?companyId=${companyId}` : '';
      
      interface PendingEmployeesResponse {
        data: {
          employees: Array<any>;
          count: number;
        };
      }
      
      const response = await get<PendingEmployeesResponse>(`/auth/pending-employees${queryParam}`);
      
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return { employees: [], count: 0 };
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
   * Automatically refresh token if needed (for Remember Me functionality)
   */
  autoRefreshToken: async (): Promise<boolean> => {
    const tokenData = localStorage.getItem('access_token');
    const refreshTokenData = localStorage.getItem('refresh_token');
    
    if (!tokenData || !refreshTokenData) {
      return false;
    }
    
    try {
      const parsedToken = JSON.parse(tokenData);
      const parsedRefreshToken = JSON.parse(refreshTokenData);
      
      // Check if we're within our custom expiration window
      if (parsedToken.expiration && Date.now() > parsedToken.expiration) {
        console.log('Custom expiration exceeded, cannot refresh');
        return false;
      }
      
      // Check if JWT token is expired or will expire soon (within 5 minutes)
      const token = parsedToken.token || tokenData;
      const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
      
      try {
        const decoded: any = jwtDecode(token);
        const tokenExpiresAt = decoded.exp * 1000;
        
        if (tokenExpiresAt > fiveMinutesFromNow) {
          // Token is still valid for more than 5 minutes, no need to refresh
          return true;
        }
        
        console.log('Token expires soon, attempting refresh...');
        
        // Attempt to refresh the token
        const refreshToken = parsedRefreshToken.token || refreshTokenData;
        const response = await authService.refreshToken({ refreshToken });
        
        if (response.data?.accessToken) {
          console.log('Token refresh successful');
          return true;
        }
      } catch (e) {
        console.error('Error during token refresh:', e);
        return false;
      }
      
      return false;
    } catch (e) {
      // Handle old format tokens
      console.log('Token in old format, treating as valid');
      return isTokenValid(tokenData);
    }
  },
};