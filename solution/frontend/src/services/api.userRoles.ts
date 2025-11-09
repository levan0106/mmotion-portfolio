import api from './api';

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
}

export interface UserPermission {
  permissionId: string;
  resource: string;
  action: string;
  name: string;
  displayName: string;
  description?: string;
}

export interface UserRolesResponse {
  userRoles: UserRole[];
  permissions: UserPermission[];
}

class UserRolesApi {
  /**
   * Get current user's roles and permissions
   */
  async getUserRoles(): Promise<UserRolesResponse> {
    const response = await api.get('/api/v1/current-user/roles');
    return response;
  }

  /**
   * Get user roles and permissions by user ID
   */
  async getUserRolesById(userId: string): Promise<UserRolesResponse> {
    const response = await api.get(`/api/v1/users/${userId}/roles`);
    return response;
  }

  /**
   * Get all available permissions
   */
  async getPermissions(): Promise<UserPermission[]> {
    const response = await api.get('/api/v1/permissions');
    return response;
  }

  /**
   * Get permissions by category
   */
  async getPermissionsByCategory(): Promise<Array<{
    name: string;
    displayName: string;
    permissions: UserPermission[];
  }>> {
    const response = await api.get('/api/v1/roles/permissions/categories');
    return response;
  }
}

export const userRolesApi = new UserRolesApi();
