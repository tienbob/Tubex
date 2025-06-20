import apiClient from './apiClient';
import { AxiosError } from 'axios';

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

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  company_id?: string;
  company?: {
    id: string;
    name: string;
    type: string;
  };
  metadata?: {
    firstName?: string;
    lastName?: string;
    [key: string]: any;
  };
}

export interface UserCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'staff';
  status?: 'active' | 'inactive' | 'pending' | 'suspended';
  companyId: string;
  sendInvitation?: boolean;
}

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'admin' | 'manager' | 'staff';
  status?: 'active' | 'inactive' | 'pending' | 'suspended';
  companyId?: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
  company_id?: string;
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

export interface UserDetailResponse {
  status: string;
  data: User;
}

export interface InvitationCodeRequest {
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'supplier' | 'dealer';
  companyId: string;
}

export interface InvitationCodeResponse {
  code: string;
  expiresAt: string;
}

export interface Role {
  id: string;
  name: string;
}

export interface RolesResponse {
  success: boolean;
  data: Role[];
}

/**
 * User Management Service - Handles operations related to user accounts
 */
const userManagementService = {
  /**
   * Get all users with optional filtering
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
   * Get a specific user by ID
   */
  getUser: async (userId: string): Promise<User> => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const response = await apiClient.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to fetch user: ${userId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Create a new user
   */
  createUser: async (data: UserCreateRequest): Promise<User> => {
    try {
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
   * Update a user's information
   */
  updateUser: async (userId: string, data: UserUpdateRequest): Promise<User> => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      if (Object.keys(data).length === 0) {
        throw new Error('No update data provided');
      }
      
      const response = await apiClient.put(`/users/${userId}`, data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to update user: ${userId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Update a user's status
   */
  updateUserStatus: async (userId: string, status: 'active' | 'inactive' | 'pending' | 'suspended'): Promise<User> => {
    try {
      const response = await apiClient.patch(`/users/${userId}/status`, { status });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to update user status: ${userId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Deactivate a user account
   */
  deactivateUser: async (userId: string): Promise<User> => {
    return userManagementService.updateUserStatus(userId, 'inactive');
  },

  /**
   * Activate a user account
   */
  activateUser: async (userId: string): Promise<User> => {
    return userManagementService.updateUserStatus(userId, 'active');
  },

  /**
   * Check email availability
   */
  checkEmailAvailability: async (email: string): Promise<boolean> => {
    try {
      const response = await apiClient.get(`/users/check-email`, { params: { email } });
      return response.data.available;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to check email availability',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Generate an invitation code for employee registration
   */
  generateInvitationCode: async (data: InvitationCodeRequest): Promise<string> => {
    try {
      const response = await apiClient.post('/users/invitation-code', data);
      return response.data.code;
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
   * Get all roles
   */
  getRoles: async (companyId: string): Promise<any[]> => {
    try {
      const response = await apiClient.get(`/companies/${companyId}/roles`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch roles',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Get all invitations
   */
  getInvitations: async (companyId: string): Promise<any[]> => {
    try {
      const response = await apiClient.get(`/companies/${companyId}/invitations`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch invitations',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Delete a user
   */
  deleteUser: async (userId: string): Promise<void> => {
    try {
      await apiClient.delete(`/users/${userId}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to delete user: ${userId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Update a role
   */
  updateRole: async (roleId: string, data: any): Promise<any> => {
    try {
      const response = await apiClient.put(`/roles/${roleId}`, data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to update role: ${roleId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Create a new role
   */
  createRole: async (data: any): Promise<any> => {
    try {
      const response = await apiClient.post(`/roles`, data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to create role',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Delete a role
   */
  deleteRole: async (roleId: string): Promise<void> => {
    try {
      await apiClient.delete(`/roles/${roleId}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to delete role: ${roleId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Send an invitation
   */
  sendInvitation: async (data: any): Promise<any> => {
    try {
      const response = await apiClient.post(`/invitations`, data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to send invitation',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Resend an invitation
   */
  resendInvitation: async (invitationId: string): Promise<void> => {
    try {
      await apiClient.post(`/invitations/${invitationId}/resend`);
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to resend invitation: ${invitationId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  /**
   * Cancel an invitation
   */
  cancelInvitation: async (invitationId: string): Promise<void> => {
    try {
      await apiClient.delete(`/invitations/${invitationId}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to cancel invitation: ${invitationId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Get available roles that the current user can assign
   */
  getAvailableRoles: async (): Promise<RolesResponse> => {
    try {
      const response = await apiClient.get<RolesResponse>('/company/manage/roles');
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch available roles',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
};

export default userManagementService;

// Helper function to get user's first and last name from either direct properties or metadata
export const getUserName = (user: any): { firstName: string; lastName: string; fullName: string } => {
  const firstName = user?.firstName || user?.metadata?.firstName || '';
  const lastName = user?.lastName || user?.metadata?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  
  return {
    firstName,
    lastName,
    fullName: fullName || user?.email?.split('@')[0] || 'N/A'
  };
};