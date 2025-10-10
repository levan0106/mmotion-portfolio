import api from './api';

export interface User {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  phoneNumber?: string;
  department?: string;
  position?: string;
}

export interface UserRole {
  userRoleId: string;
  userId: string;
  roleId: string;
  roleName: string;
  roleDisplayName: string;
  assignedBy?: string;
  assignedAt: string;
  expiresAt?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  isValid: boolean;
  isExpired: boolean;
  user?: User;
}

export interface AssignUserRoleRequest {
  userId: string;
  roleId: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface UpdateUserRoleRequest {
  isActive?: boolean;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface UserSearchParams {
  query?: string;
  isActive?: boolean;
  department?: string;
  page?: number;
  limit?: number;
}

export interface UserSearchResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class UserApi {
  /**
   * Get all users
   */
  static async getUsers(params?: UserSearchParams): Promise<UserSearchResponse> {
    const response = await api.get('/api/v1/users', { params });
    return response;
  }

  /**
   * Get user by ID
   */
  static async getUser(userId: string): Promise<User> {
    const response = await api.get(`/api/v1/users/${userId}`);
    return response;
  }

  /**
   * Create new user
   */
  static async createUser(userData: Partial<User>): Promise<User> {
    const response = await api.post('/api/v1/users', userData);
    return response;
  }

  /**
   * Update user
   */
  static async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    const response = await api.put(`/api/v1/users/${userId}`, userData);
    return response;
  }

  /**
   * Search users
   */
  static async searchUsers(query: string, filters?: Partial<UserSearchParams>): Promise<UserSearchResponse> {
    const response = await api.get('/api/v1/users/search', { 
      params: { query, ...filters } 
    });
    return response;
  }

  /**
   * Get users with specific role
   */
  static async getUsersWithRole(roleId: string): Promise<UserRole[]> {
    const response = await api.get(`/api/v1/roles/${roleId}/users`);
    return response;
  }

  /**
   * Assign user to role
   */
  static async assignUserToRole(assignment: AssignUserRoleRequest): Promise<UserRole> {
    const response = await api.post('/api/v1/users/roles', assignment);
    return response;
  }

  /**
   * Remove user from role
   */
  static async removeUserFromRole(userRoleId: string): Promise<void> {
    await api.delete(`/api/v1/users/roles/${userRoleId}`);
  }

  /**
   * Update user role
   */
  static async updateUserRole(userRoleId: string, updates: UpdateUserRoleRequest): Promise<UserRole> {
    const response = await api.put(`/api/v1/users/roles/${userRoleId}`, updates);
    return response;
  }

  /**
   * Get user roles
   */
  static async getUserRoles(userId: string): Promise<UserRole[]> {
    const response = await api.get(`/api/v1/users/${userId}/roles`);
    return response;
  }

  /**
   * Bulk assign users to role
   */
  static async bulkAssignUsersToRole(roleId: string, userIds: string[], expiresAt?: string): Promise<UserRole[]> {
    const response = await api.post(`/api/v1/roles/${roleId}/users/bulk`, {
      userIds,
      expiresAt
    });
    return response;
  }

  /**
   * Get available users for role assignment
   */
  static async getAvailableUsersForRole(roleId: string, searchQuery?: string): Promise<User[]> {
    const response = await api.get(`/api/v1/roles/${roleId}/available-users`, {
      params: { search: searchQuery }
    });
    return response;
  }

  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    withRoles: number;
    withoutRoles: number;
  }> {
    const response = await api.get('/api/v1/users/stats');
    return response;
  }

  /**
   * Get role statistics
   */
  static async getRoleStats(roleId: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    expiredUsers: number;
    inactiveUsers: number;
  }> {
    const response = await api.get(`/api/v1/roles/${roleId}/stats`);
    return response;
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string): Promise<void> {
    await api.delete(`/api/v1/users/${userId}`);
  }
}
