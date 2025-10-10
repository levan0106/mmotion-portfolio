import { useQuery, useMutation, useQueryClient } from 'react-query';
import { RoleApi, CreateRoleRequest, UpdateRoleRequest } from '../services/api.role';

/**
 * Hook for role management
 */
export const useRoles = () => {
  const queryClient = useQueryClient();

  // Get all roles
  const {
    data: roles,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['roles'],
    queryFn: RoleApi.getRoles,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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
    roles,
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
