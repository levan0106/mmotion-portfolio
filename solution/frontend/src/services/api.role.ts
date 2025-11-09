import api from './api';

export interface Role {
  roleId: string;
  name: string;
  displayName: string;
  description?: string;
  isSystemRole: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  permissions?: Permission[];
}

export interface Permission {
  permissionId: string;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  isSystemPermission: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  name: string;
  displayName: string;
  description?: string;
  isSystemRole?: boolean;
  priority?: number;
  permissionIds?: string[];
}

export interface UpdateRoleRequest {
  displayName?: string;
  description?: string;
  priority?: number;
}

export interface AssignPermissionsRequest {
  permissionIds: string[];
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
}

export interface AssignRoleRequest {
  roleId: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface UpdateUserRoleRequest {
  isActive?: boolean;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface UserPermissions {
  userId: string;
  roles: UserRole[];
  permissions: string[];
  permissionsByCategory: Record<string, string[]>;
}

export interface CreatePermissionRequest {
  name: string;
  displayName: string;
  description?: string;
  category: string;
  isSystemPermission?: boolean;
  priority?: number;
}

export interface UpdatePermissionRequest {
  displayName?: string;
  description?: string;
  category?: string;
  priority?: number;
}

export interface PermissionCategory {
  name: string;
  displayName: string;
  permissionCount: number;
  permissions: Permission[];
}

export class RoleApi {
  /**
   * Get all roles
   */
  static async getRoles(): Promise<Role[]> {
    const response = await api.get('/api/v1/roles');
    return response;
  }

  /**
   * Get role by ID
   */
  static async getRole(roleId: string): Promise<Role> {
    const response = await api.get(`/api/v1/roles/${roleId}`);
    return response;
  }

  /**
   * Create new role
   */
  static async createRole(roleData: CreateRoleRequest): Promise<Role> {
    const response = await api.post('/api/v1/roles', roleData);
    return response;
  }

  /**
   * Update role
   */
  static async updateRole(roleId: string, roleData: UpdateRoleRequest): Promise<Role> {
    const response = await api.put(`/api/v1/roles/${roleId}`, roleData);
    return response;
  }

  /**
   * Delete role
   */
  static async deleteRole(roleId: string): Promise<void> {
    await api.delete(`/api/v1/roles/${roleId}`);
  }

  /**
   * Assign permissions to role
   */
  static async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<void> {
    await api.post(`/api/v1/roles/${roleId}/permissions`, { permissionIds });
  }

  /**
   * Remove permissions from role
   */
  static async removePermissionsFromRole(roleId: string, permissionIds: string[]): Promise<void> {
    await api.delete(`/api/v1/roles/${roleId}/permissions`, { data: { permissionIds } });
  }

  /**
   * Get role permissions
   */
  static async getRolePermissions(roleId: string): Promise<Permission[]> {
    const response = await api.get(`/api/v1/roles/${roleId}/permissions`);
    return response;
  }

  /**
   * Get users with specific role
   */
  static async getUsersWithRole(roleId: string): Promise<any[]> {
    const response = await api.get(`/api/v1/roles/${roleId}/users`);
    return response;
  }
}

export class PermissionApi {
  /**
   * Create a new permission
   */
  static async createPermission(permissionData: CreatePermissionRequest): Promise<Permission> {
    const response = await api.post('/api/v1/permissions', permissionData);
    return response;
  }

  /**
   * Get all permissions
   */
  static async getPermissions(): Promise<Permission[]> {
    const response = await api.get('/api/v1/permissions');
    return response;
  }

  /**
   * Get permissions by category
   */
  static async getPermissionsByCategory(): Promise<PermissionCategory[]> {
    const response = await api.get('/api/v1/permissions/categories');
    return response;
  }

  /**
   * Get permission by ID
   */
  static async getPermission(permissionId: string): Promise<Permission> {
    const response = await api.get(`/api/v1/permissions/${permissionId}`);
    return response;
  }

  /**
   * Update permission
   */
  static async updatePermission(permissionId: string, permissionData: UpdatePermissionRequest): Promise<Permission> {
    const response = await api.put(`/api/v1/permissions/${permissionId}`, permissionData);
    return response;
  }

  /**
   * Delete permission
   */
  static async deletePermission(permissionId: string): Promise<void> {
    await api.delete(`/api/v1/permissions/${permissionId}`);
  }

  /**
   * Search permissions
   */
  static async searchPermissions(query: string): Promise<Permission[]> {
    const response = await api.get(`/api/v1/permissions/search?q=${encodeURIComponent(query)}`);
    return response;
  }

  /**
   * Get permission categories
   */
  static async getPermissionCategories(): Promise<string[]> {
    const response = await api.get('/api/v1/permissions/categories/list');
    return response;
  }
}

export class UserRoleApi {
  /**
   * Assign role to user
   */
  static async assignRoleToUser(userId: string, roleData: AssignRoleRequest): Promise<UserRole> {
    const response = await api.post(`/api/v1/users/${userId}/roles`, roleData);
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
   * Get user permissions
   */
  static async getUserPermissions(userId: string): Promise<UserPermissions> {
    const response = await api.get(`/api/v1/users/${userId}/permissions`);
    return response;
  }

  /**
   * Update user role
   */
  static async updateUserRole(userRoleId: string, roleData: UpdateUserRoleRequest): Promise<UserRole> {
    const response = await api.put(`/api/v1/users/roles/${userRoleId}`, roleData);
    return response;
  }

  /**
   * Remove role from user
   */
  static async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await api.delete(`/api/v1/users/${userId}/roles/${roleId}`);
  }

  /**
   * Deactivate user role
   */
  static async deactivateUserRole(userRoleId: string): Promise<UserRole> {
    const response = await api.put(`/api/v1/users/roles/${userRoleId}/deactivate`);
    return response;
  }

  /**
   * Check if user has specific permission
   */
  static async checkUserPermission(userId: string, permission: string): Promise<{ hasPermission: boolean }> {
    const response = await api.get(`/api/v1/users/${userId}/permissions/check`, {
      data: { permission }
    });
    return response;
  }

  /**
   * Check if user has any of the specified permissions
   */
  static async checkUserAnyPermission(userId: string, permissions: string[]): Promise<{ hasAnyPermission: boolean }> {
    const response = await api.get(`/api/v1/users/${userId}/permissions/check-any`, {
      data: { permissions }
    });
    return response;
  }

  /**
   * Check if user has all of the specified permissions
   */
  static async checkUserAllPermissions(userId: string, permissions: string[]): Promise<{ hasAllPermissions: boolean }> {
    const response = await api.get(`/api/v1/users/${userId}/permissions/check-all`, {
      data: { permissions }
    });
    return response;
  }

  /**
   * Get expired user roles
   */
  static async getExpiredUserRoles(): Promise<UserRole[]> {
    const response = await api.get('/api/v1/users/roles/expired');
    return response;
  }

  /**
   * Clean up expired user roles
   */
  static async cleanupExpiredUserRoles(): Promise<{ cleanedCount: number }> {
    const response = await api.post('/api/v1/users/roles/cleanup');
    return response;
  }
}