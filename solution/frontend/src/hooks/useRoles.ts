import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { RoleApi, CreateRoleRequest, UpdateRoleRequest } from '../services/api.role';

export interface RoleSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Hook for role management
 */
export const useRoles = (params?: RoleSearchParams) => {
  const queryClient = useQueryClient();

  // Get all roles
  const {
    data: allRoles,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['roles'],
    queryFn: RoleApi.getRoles,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Client-side pagination and filtering
  const roles = React.useMemo(() => {
    if (!allRoles) return [];
    
    let filteredRoles = [...allRoles];
    
    // Apply search filter
    if (params?.search) {
      const searchTerm = params.search.toLowerCase();
      filteredRoles = filteredRoles.filter(role => 
        role.name.toLowerCase().includes(searchTerm) ||
        role.displayName.toLowerCase().includes(searchTerm) ||
        role.description?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply sorting
    if (params?.sortBy) {
      filteredRoles.sort((a, b) => {
        const aValue = a[params.sortBy as keyof typeof a];
        const bValue = b[params.sortBy as keyof typeof b];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return params.sortOrder === 'desc' 
            ? bValue.localeCompare(aValue)
            : aValue.localeCompare(bValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return params.sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
        }
        
        return 0;
      });
    }
    
    return filteredRoles;
  }, [allRoles, params?.search, params?.sortBy, params?.sortOrder, params?.page, params?.limit]);

  // Calculate pagination
  const { total, totalPages, paginatedRoles } = React.useMemo(() => {
    const total = roles.length;
    const totalPages = Math.ceil(total / (params?.limit || 10));
    const startIndex = ((params?.page || 1) - 1) * (params?.limit || 10);
    const endIndex = startIndex + (params?.limit || 10);
    const paginatedRoles = roles.slice(startIndex, endIndex);
    
    return { total, totalPages, paginatedRoles };
  }, [roles, params?.page, params?.limit]);

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (roleData: CreateRoleRequest) => RoleApi.createRole(roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ roleId, roleData }: { roleId: string; roleData: UpdateRoleRequest }) =>
      RoleApi.updateRole(roleId, roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => RoleApi.deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  // Assign permissions to role mutation
  const assignPermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      RoleApi.assignPermissionsToRole(roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['rolePermissions'] });
    },
  });

  // Remove permissions from role mutation
  const removePermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      RoleApi.removePermissionsFromRole(roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['rolePermissions'] });
    },
  });

  return {
    // Data
    roles: paginatedRoles,
    total,
    page: params?.page || 1,
    limit: params?.limit || 10,
    totalPages,
    isLoading,
    error,
    
    // Actions
    createRole: createRoleMutation.mutate,
    updateRole: updateRoleMutation.mutate,
    deleteRole: deleteRoleMutation.mutate,
    assignPermissions: assignPermissionsMutation.mutate,
    removePermissions: removePermissionsMutation.mutate,
    refetch,
    
    // Loading states
    isCreating: createRoleMutation.isLoading,
    isUpdating: updateRoleMutation.isLoading,
    isDeleting: deleteRoleMutation.isLoading,
    isAssigningPermissions: assignPermissionsMutation.isLoading,
    isRemovingPermissions: removePermissionsMutation.isLoading,
    
    // Errors
    createError: createRoleMutation.error,
    updateError: updateRoleMutation.error,
    deleteError: deleteRoleMutation.error,
    assignPermissionsError: assignPermissionsMutation.error,
    removePermissionsError: removePermissionsMutation.error,
  };
};

/**
 * Hook for individual role management
 */
export const useRole = (roleId: string) => {

  // Get role details
  const {
    data: role,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['role', roleId],
    queryFn: () => RoleApi.getRole(roleId),
    enabled: !!roleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get role permissions
  const {
    data: rolePermissions,
    isLoading: isLoadingPermissions,
    error: permissionsError,
    refetch: refetchPermissions
  } = useQuery({
    queryKey: ['rolePermissions', roleId],
    queryFn: () => RoleApi.getRolePermissions(roleId),
    enabled: !!roleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get users with this role
  const {
    data: usersWithRole,
    isLoading: isLoadingUsers,
    error: usersError,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ['usersWithRole', roleId],
    queryFn: () => RoleApi.getUsersWithRole(roleId),
    enabled: !!roleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    // Data
    role,
    rolePermissions,
    usersWithRole,
    
    // Loading states
    isLoading,
    isLoadingPermissions,
    isLoadingUsers,
    isLoadingAny: isLoading || isLoadingPermissions || isLoadingUsers,
    
    // Errors
    error,
    permissionsError,
    usersError,
    hasError: !!(error || permissionsError || usersError),
    
    // Actions
    refetch,
    refetchPermissions,
    refetchUsers,
  };
};
