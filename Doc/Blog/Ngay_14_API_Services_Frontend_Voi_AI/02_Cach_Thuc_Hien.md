# Ngày 14: API Services Frontend Với AI - Cách Thực Hiện

## Bước 1: Thiết Kế API Client Architecture

### Câu Hỏi Cho AI:
```
"Thiết kế kiến trúc API client cho React app với:
- Type safety hoàn toàn với TypeScript
- Authentication và token management tự động
- Request/Response interceptors
- Error handling thống nhất
- Request cancellation support
- Auto token refresh
- Retry logic cho network failures
Sử dụng Axios và TypeScript."
```

### Kết Quả Thực Tế Từ Dự Án Tubex:
```typescript
// Frontend/app/src/services/api/apiClient.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Get token from storage (xử lý cả format cũ và mới)
 */
const getTokenFromStorage = (key: string): string | null => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    // Parse JSON format mới
    try {
      const tokenData = JSON.parse(stored);
      if (tokenData.token && tokenData.expiration) {
        // Kiểm tra token expired
        if (Date.now() > tokenData.expiration) {
          console.log(`Token expired, removing from storage`);
          localStorage.removeItem(key);
          return null;
        }
        return tokenData.token;
      }
    } catch {
      // Format cũ, sử dụng string
      return stored;
    }
    
    return stored;
  } catch (error) {
    console.error(`Error getting token from ${key}:`, error);
    return null;
  }
};

// Tạo Axios instance với config mặc định
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor cho authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = getTokenFromStorage('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log(`API Request: ${config.method?.toUpperCase()} ${fullUrl}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor với auto token refresh
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response [${response.status}]:`, response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Auto token refresh on 401
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url.includes('/auth/login')) {
      
      originalRequest._retry = true;
      try {
        const refreshTokenData = localStorage.getItem('refresh_token');
        if (!refreshTokenData) {
          throw new Error('No refresh token available');
        }
        
        // Parse refresh token
        let refreshToken;
        try {
          const parsed = JSON.parse(refreshTokenData);
          refreshToken = parsed.token || refreshTokenData;
          
          if (parsed.expiration && Date.now() > parsed.expiration) {
            throw new Error('Refresh token expired');
          }
        } catch (parseError) {
          refreshToken = refreshTokenData;
        }
        
        // Refresh token request
        const response = await axios({
          method: 'post',
          url: `${process.env.REACT_APP_API_URL}/auth/refresh-token`,
          data: { refreshToken },
          headers: { 'Content-Type': 'application/json' }
        });
        
        const newToken = response.data?.data?.accessToken || response.data?.accessToken;
        
        if (newToken) {
          // Lưu token mới với expiration
          const tokenData = {
            token: newToken,
            expiration: Date.now() + (24 * 60 * 60 * 1000), // 1 day
            rememberMe: false
          };
          
          localStorage.setItem('access_token', JSON.stringify(tokenData));
          
          // Update headers và retry request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Token refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
        
        window.dispatchEvent(new CustomEvent('auth:required', {
          detail: { reason: 'token_refresh_failed' }
        }));
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

## Bước 2: Xây Dựng Auth Service Type-Safe

### Câu Hỏi Cho AI:
```
"Tạo AuthService TypeScript hoàn chỉnh với:
- Login/Register/Logout methods
- Token management (access + refresh)
- Auto token refresh
- Remember Me functionality
- Type-safe interfaces cho requests/responses
- Error handling với custom error classes
- OAuth support (Google, Facebook)
- Email verification flow
Sử dụng Axios và JWT."
```

### Kết Quả Thực Tế Từ Dự Án Tubex:
```typescript
// Frontend/app/src/services/api/authService.ts
import { post, get } from './apiClient';
import { AxiosError } from 'axios';
import { jwtDecode } from 'jwt-decode';

// Custom error class
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

// TypeScript interfaces
export interface AuthResponse {
  status: string;
  data: {
    userId: string;
    companyId: string;
    accessToken: string;
    refreshToken: string;
    message?: string;
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
  avatarUrl?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Helper functions
const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  try {
    const decoded: any = jwtDecode(token);
    if (!decoded.exp) return false;
    
    const isValid = decoded.exp * 1000 > Date.now();
    return isValid;
  } catch (e) {
    return false;
  }
};

export const authService = {
  /**
   * Login với email và password
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
      const responseData = response.data?.data || response.data;
      
      if (responseData?.accessToken) {
        // Tính toán expiration dựa trên Remember Me
        const tokenExpiration = credentials.rememberMe 
          ? Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 ngày
          : Date.now() + (24 * 60 * 60 * 1000); // 1 ngày
        
        // Lưu tokens với expiration info
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
        
        // Tạo user object
        const userInfo: UserInfo = {
          userId: responseData.userId,
          companyId: responseData.companyId,
          email: responseData.email || credentials.email,
          role: responseData.role || 'user',
          status: responseData.status || 'active',
          firstName: responseData.firstName || '',
          lastName: responseData.lastName || ''
        };
        
        // Lưu user info
        const userInfoData = {
          ...userInfo,
          expiration: tokenExpiration,
          rememberMe: credentials.rememberMe || false
        };
        
        localStorage.setItem('user_info', JSON.stringify(userInfoData));
        
        console.log(`Tokens stored with ${credentials.rememberMe ? '7 day' : '1 day'} expiration`);
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
   * Register công ty mới
   */
  registerCompany: async (data: RegisterCompanyRequest): Promise<AuthResponse> => {
    try {
      // Validation
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
      
      // Lưu tokens nếu registration thành công
      if (response.data?.data?.accessToken) {
        const tokenExpiration = Date.now() + (24 * 60 * 60 * 1000);
        
        const tokenData = {
          token: response.data.data.accessToken,
          expiration: tokenExpiration,
          rememberMe: false
        };
        
        localStorage.setItem('access_token', JSON.stringify(tokenData));
        localStorage.setItem('refresh_token', JSON.stringify({
          token: response.data.data.refreshToken,
          expiration: tokenExpiration,
          rememberMe: false
        }));
        
        const userInfo: UserInfo = {
          userId: response.data.data.userId,
          companyId: response.data.data.companyId,
          email: response.data.data.email || data.email,
          role: response.data.data.role || 'admin',
          status: response.data.data.status || 'active',
          firstName: data.firstName,
          lastName: data.lastName
        };
        
        localStorage.setItem('user_info', JSON.stringify({
          ...userInfo,
          expiration: tokenExpiration,
          rememberMe: false
        }));
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

  /**
   * Refresh access token
   */
  refreshToken: async (refreshTokenData: RefreshTokenRequest): Promise<AuthResponse> => {
    try {
      if (!refreshTokenData.refreshToken) {
        throw new Error('Refresh token is required');
      }
      
      const response = await post<AuthResponse>('/auth/refresh-token', refreshTokenData);
      
      if (response.data?.data?.accessToken) {
        // Preserve remember me setting
        const existingTokenData = localStorage.getItem('access_token');
        let rememberMe = false;
        
        try {
          const parsed = JSON.parse(existingTokenData || '{}');
          rememberMe = parsed.rememberMe || false;
        } catch (e) {
          rememberMe = false;
        }
        
        // Calculate expiration
        const tokenExpiration = rememberMe 
          ? Date.now() + (7 * 24 * 60 * 60 * 1000)
          : Date.now() + (24 * 60 * 60 * 1000);
        
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
   * Auto refresh token nếu cần (cho Remember Me)
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
      
      // Nếu access token expired nhưng còn trong window Remember Me
      if (parsedToken.expiration && Date.now() <= parsedToken.expiration) {
        const token = parsedToken.token;
        if (!isTokenValid(token) && parsedRefreshToken.token) {
          console.log('Token expired but within Remember Me window, refreshing...');
          
          try {
            await authService.refreshToken({ refreshToken: parsedRefreshToken.token });
            return true;
          } catch (e) {
            console.error('Auto refresh failed:', e);
            return false;
          }
        }
      }
      
      return false;
    } catch (e) {
      return false;
    }
  },

  /**
   * Check authentication status
   */
  isAuthenticated: (): boolean => {
    const tokenData = localStorage.getItem('access_token');
    if (!tokenData) return false;
    
    try {
      const parsed = JSON.parse(tokenData);
      
      // Check custom expiration (cho Remember Me)
      if (parsed.expiration && Date.now() > parsed.expiration) {
        authService.logout();
        return false;
      }
      
      const token = parsed.token || tokenData;
      const isJwtValid = isTokenValid(token);
      
      // Nếu JWT expired nhưng trong Remember Me window, cần refresh
      if (!isJwtValid && parsed.expiration && Date.now() <= parsed.expiration) {
        return true; // Cho phép, refresh sẽ happen in background
      }
      
      if (!isJwtValid) {
        authService.logout();
        return false;
      }
      
      return true;
    } catch (e) {
      const token = tokenData;
      const isValid = isTokenValid(token);
      
      if (!isValid) {
        authService.logout();
      }
      return isValid;
    }
  },

  /**
   * Get current user info
   */
  getCurrentUser: (): UserInfo | null => {
    const userInfo = localStorage.getItem('user_info');
    if (!userInfo) return null;
    
    try {
      const parsed = JSON.parse(userInfo);
      
      // Check expiration
      if (parsed.expiration && Date.now() > parsed.expiration) {
        localStorage.removeItem('user_info');
        return null;
      }
      
      return {
        userId: parsed.userId,
        companyId: parsed.companyId,
        email: parsed.email,
        role: parsed.role,
        status: parsed.status,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        avatarUrl: parsed.avatarUrl
      };
    } catch (error) {
      return null;
    }
  },

  /**
   * Logout user
   */
  logout: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
  },

  /**
   * Validate token
   */
  validateToken: async (): Promise<boolean> => {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    
    try {
      const parsed = JSON.parse(token);
      const actualToken = parsed.token || token;
      
      if (!isTokenValid(actualToken)) {
        authService.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
};
```

## Bước 3: Tạo Product Service

### Câu Hỏi Cho AI:
```
"Tạo ProductService TypeScript với đầy đủ CRUD operations:
- getProducts với pagination, filter, search
- getProductById với full details
- createProduct với validation
- updateProduct với partial updates
- deleteProduct với confirmation
- uploadProductImages
- manageProductCategories
- Type-safe interfaces cho tất cả requests/responses
Sử dụng Axios interceptors đã setup."
```

### Kết Quả Thực Tế Từ Dự Án Tubex:
```typescript
// Frontend/app/src/services/api/productService.ts
import { get, post, put, delete as del } from './apiClient';
import { AxiosError } from 'axios';

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  base_price: number;
  cost_price?: number;
  category?: {
    id: string;
    name: string;
  };
  supplier?: {
    id: string;
    name: string;
  };
  status: 'active' | 'inactive' | 'out_of_stock' | 'discontinued';
  images: string[];
  specifications?: Record<string, string>;
  inventory?: {
    quantity: number;
    min_threshold?: number;
    max_threshold?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  status?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  company_id: string;
}

export interface ProductListResponse {
  status: string;
  data: {
    products: Product[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface ProductCreateRequest {
  name: string;
  description?: string;
  sku?: string;
  base_price: number;
  cost_price?: number;
  category_id?: string;
  supplier_id?: string;
  status?: string;
  images?: string[];
  specifications?: Record<string, string>;
  inventory?: {
    quantity: number;
    min_threshold?: number;
    max_threshold?: number;
  };
  company_id: string;
}

export interface ProductUpdateRequest extends Partial<ProductCreateRequest> {
  id: string;
}

export const productService = {
  /**
   * Get products với filtering và pagination
   */
  getProducts: async (params: ProductListParams): Promise<ProductListResponse> => {
    try {
      const response = await get<ProductListResponse>('/products', { params });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(
          error.response?.data?.message || 'Failed to fetch products'
        );
      }
      throw error;
    }
  },

  /**
   * Get product by ID
   */
  getProductById: async (id: string): Promise<{ status: string; data: Product }> => {
    try {
      if (!id) {
        throw new Error('Product ID is required');
      }
      
      const response = await get<{ status: string; data: Product }>(`/products/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(
          error.response?.data?.message || 'Failed to fetch product details'
        );
      }
      throw error;
    }
  },

  /**
   * Create new product
   */
  createProduct: async (data: ProductCreateRequest): Promise<{ status: string; data: Product }> => {
    try {
      // Validation
      if (!data.name || data.name.trim() === '') {
        throw new Error('Product name is required');
      }
      
      if (!data.base_price || data.base_price <= 0) {
        throw new Error('Valid product price is required');
      }
      
      if (!data.company_id) {
        throw new Error('Company ID is required');
      }

      const response = await post<{ status: string; data: Product }>('/products', data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(
          error.response?.data?.message || 'Failed to create product'
        );
      }
      throw error;
    }
  },

  /**
   * Update existing product
   */
  updateProduct: async (data: ProductUpdateRequest): Promise<{ status: string; data: Product }> => {
    try {
      if (!data.id) {
        throw new Error('Product ID is required');
      }
      
      const { id, ...updateData } = data;
      const response = await put<{ status: string; data: Product }>(`/products/${id}`, updateData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(
          error.response?.data?.message || 'Failed to update product'
        );
      }
      throw error;
    }
  },

  /**
   * Delete product
   */
  deleteProduct: async (id: string): Promise<{ status: string; message: string }> => {
    try {
      if (!id) {
        throw new Error('Product ID is required');
      }
      
      const response = await del<{ status: string; message: string }>(`/products/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(
          error.response?.data?.message || 'Failed to delete product'
        );
      }
      throw error;
    }
  },

  /**
   * Upload product images
   */
  uploadProductImages: async (productId: string, images: string[]): Promise<{ status: string; data: { images: string[] } }> => {
    try {
      if (!productId) {
        throw new Error('Product ID is required');
      }
      
      if (!images || images.length === 0) {
        throw new Error('At least one image is required');
      }
      
      const response = await post<{ status: string; data: { images: string[] } }>(`/products/${productId}/images`, { images });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(
          error.response?.data?.message || 'Failed to upload product images'
        );
      }
      throw error;
    }
  },

  /**
   * Get product categories
   */
  getCategories: async (companyId: string): Promise<{ status: string; data: Array<{ id: string; name: string }> }> => {
    try {
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      
      const response = await get<{ status: string; data: Array<{ id: string; name: string }> }>(`/companies/${companyId}/product-categories`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(
          error.response?.data?.message || 'Failed to fetch product categories'
        );
      }
      throw error;
    }
  },

  /**
   * Create product category
   */
  createCategory: async (companyId: string, name: string): Promise<{ status: string; data: { id: string; name: string } }> => {
    try {
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      
      if (!name || name.trim() === '') {
        throw new Error('Category name is required');
      }
      
      const response = await post<{ status: string; data: { id: string; name: string } }>(`/companies/${companyId}/product-categories`, { name });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(
          error.response?.data?.message || 'Failed to create category'
        );
      }
      throw error;
    }
  },

  /**
   * Update product price history
   */
  updateProductPrice: async (productId: string, newPrice: number, effectiveDate?: string): Promise<{ status: string; message: string }> => {
    try {
      if (!productId) {
        throw new Error('Product ID is required');
      }
      
      if (!newPrice || newPrice <= 0) {
        throw new Error('Valid price is required');
      }
      
      const response = await post<{ status: string; message: string }>(`/products/${productId}/price-update`, {
        newPrice,
        effectiveDate: effectiveDate || new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(
          error.response?.data?.message || 'Failed to update product price'
        );
      }
      throw error;
    }
  }
};
```

## Bước 4: Tạo User Management Service

### Câu Hỏi Cho AI:
```
"Tạo UserManagementService cho admin panel với:
- getUsers với filtering (role, status, company)
- createUser với role assignment
- updateUser với permission checks
- deleteUser với soft delete
- inviteUser với email invitation
- manageUserRoles và permissions
- getUserActivity logs
- Type-safe error handling
Theo multi-tenant architecture."
```

### Kết Quả Thực Tế Từ Dự Án Tubex:
```typescript
// Frontend/app/src/services/api/userManagementService.ts
import apiClient from './apiClient';
import { AxiosError } from 'axios';

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

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'manager' | 'staff';
  status: 'active' | 'inactive' | 'pending';
  company_id: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  company_id?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

export interface UserListResponse {
  status: string;
  data: {
    users: User[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface UserCreateRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'staff';
  password?: string;
  companyId: string;
  status?: 'active' | 'inactive';
}

export interface UserUpdateRequest {
  id: string;
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'manager' | 'staff';
  status?: 'active' | 'inactive';
  reason?: string;
}

export interface InvitationCodeRequest {
  companyId: string;
  role: 'admin' | 'manager' | 'staff';
  validDays?: number;
}

export interface InvitationCodeResponse {
  status: string;
  data: {
    invitationCode: string;
    expiresAt: string;
    inviteUrl: string;
  };
}

const userManagementService = {
  /**
   * Get all users với filtering
   */
  getUsers: async (params: UserListParams = {}): Promise<UserListResponse> => {
    try {
      const response = await apiClient.get('/users', { params });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch users',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Get user by ID
   */
  getUserById: async (id: string): Promise<{ status: string; data: User }> => {
    try {
      if (!id) {
        throw new Error('User ID is required');
      }
      
      const response = await apiClient.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch user details',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Create new user
   */
  createUser: async (data: UserCreateRequest): Promise<{ status: string; data: User }> => {
    try {
      // Validation
      if (!data.email || !data.email.includes('@')) {
        throw new Error('Valid email is required');
      }
      
      if (!data.firstName || data.firstName.trim() === '') {
        throw new Error('First name is required');
      }
      
      if (!data.lastName || data.lastName.trim() === '') {
        throw new Error('Last name is required');
      }
      
      if (!data.companyId) {
        throw new Error('Company ID is required');
      }

      const response = await apiClient.post('/users', data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to create user',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Update existing user
   */
  updateUser: async (data: UserUpdateRequest): Promise<{ status: string; data: User }> => {
    try {
      if (!data.id) {
        throw new Error('User ID is required');
      }
      
      const { id, ...updateData } = data;
      const response = await apiClient.put(`/users/${id}`, updateData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to update user',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Delete user (soft delete)
   */
  deleteUser: async (id: string, reason?: string): Promise<{ status: string; message: string }> => {
    try {
      if (!id) {
        throw new Error('User ID is required');
      }
      
      const response = await apiClient.delete(`/users/${id}`, {
        data: { reason }
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to delete user',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Generate invitation code
   */
  generateInvitationCode: async (data: InvitationCodeRequest): Promise<InvitationCodeResponse> => {
    try {
      if (!data.companyId) {
        throw new Error('Company ID is required');
      }
      
      const response = await apiClient.post('/auth/invitation-code', data);
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
  validateInvitationCode: async (code: string): Promise<{ valid: boolean; companyName?: string; expiresAt?: string }> => {
    try {
      if (!code) {
        throw new Error('Invitation code is required');
      }
      
      const response = await apiClient.get(`/auth/validate-invitation/${code}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return { valid: false };
      }
      throw error;
    }
  },

  /**
   * Get user activity logs
   */
  getUserActivity: async (userId: string, params: { page?: number; limit?: number } = {}): Promise<{
    status: string;
    data: {
      activities: Array<{
        id: string;
        action: string;
        description: string;
        ip_address?: string;
        user_agent?: string;
        created_at: string;
      }>;
      pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
      };
    };
  }> => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const response = await apiClient.get(`/users/${userId}/activity`, { params });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch user activity',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Reset user password (admin action)
   */
  resetUserPassword: async (userId: string, newPassword: string): Promise<{ status: string; message: string }> => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      if (!newPassword || newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      const response = await apiClient.post(`/users/${userId}/reset-password`, { newPassword });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to reset user password',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  }
};

export default userManagementService;
```

## Mẹo Sử Dụng AI Để Xây Dựng API Services

### 1. Bắt Đầu Với Base Client
- Thiết kế interceptors trước
- Xử lý authentication tự động
- Error handling thống nhất

### 2. Type-First Approach  
- Định nghĩa interfaces trước
- Sử dụng generic types
- Validation ở cả client và server

### 3. Error Handling Strategy
- Custom error classes
- Consistent error formatting
- Graceful fallbacks

### 4. Performance Optimization
- Request cancellation
- Response caching
- Retry logic cho network failures

### 5. Security Best Practices
- Auto token refresh
- Secure token storage
- HTTPS only

Với cách tiếp cận này, bạn sẽ có một hệ thống API services mạnh mẽ và type-safe!
