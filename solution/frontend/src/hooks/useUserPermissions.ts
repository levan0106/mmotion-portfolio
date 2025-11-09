import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { UserRoleApi } from '../services/api.role';
import { useAccount } from '../contexts/AccountContext';

/**
 * Hook for managing user permissions and roles
 */
export const useUserPermissions = (userId?: string) => {
  const { currentAccount } = useAccount();
  
  const targetUserId = userId || currentAccount?.accountId;

  // Get user permissions
  const {
    data: userPermissions,
    isLoading: isLoadingPermissions,
    error: permissionsError,
    refetch: refetchPermissions
  } = useQuery({
    queryKey: ['userPermissions', targetUserId],
    queryFn: () => UserRoleApi.getUserPermissions(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get user roles
  const {
    data: userRoles,
    isLoading: isLoadingRoles,
    error: rolesError,
    refetch: refetchRoles
  } = useQuery({
    queryKey: ['userRoles', targetUserId],
    queryFn: () => UserRoleApi.getUserRoles(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Check if user has specific permission
  const checkPermission = useCallback((permission: string): boolean => {
    if (!userPermissions) return false;
    return userPermissions.permissions.includes(permission);
  }, [userPermissions]);

  // Check if user has any of the specified permissions
  const checkAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!userPermissions) return false;
    return permissions.some(permission => userPermissions.permissions.includes(permission));
  }, [userPermissions]);

  // Check if user has all of the specified permissions
  const checkAllPermissions = useCallback((permissions: string[]): boolean => {
    if (!userPermissions) return false;
    return permissions.every(permission => userPermissions.permissions.includes(permission));
  }, [userPermissions]);

  // Check if user has specific role
  const checkRole = useCallback((roleName: string): boolean => {
    if (!userRoles) return false;
    return userRoles.some((userRole: any) => userRole.roleName === roleName && userRole.isValid);
  }, [userRoles]);

  // Check if user has any of the specified roles
  const checkAnyRole = useCallback((roleNames: string[]): boolean => {
    if (!userRoles) return false;
    return roleNames.some(roleName => 
      userRoles.some((userRole: any) => userRole.roleName === roleName && userRole.isValid)
    );
  }, [userRoles]);

  // Get permissions by category
  const getPermissionsByCategory = useCallback((category: string): string[] => {
    if (!userPermissions) return [];
    return userPermissions.permissionsByCategory[category] || [];
  }, [userPermissions]);

  // Get all categories user has permissions for
  const getPermissionCategories = useCallback((): string[] => {
    if (!userPermissions) return [];
    return Object.keys(userPermissions.permissionsByCategory);
  }, [userPermissions]);

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      UserRoleApi.assignRoleToUser(userId, { roleId }),
    onSuccess: () => {
      refetchRoles();
      refetchPermissions();
    },
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: (userRoleId: string) => {
      // Find the user role to get userId and roleId
      const userRole = userRoles?.find(ur => ur.userRoleId === userRoleId);
      if (!userRole || !targetUserId) {
        throw new Error('User role not found');
      }
      return UserRoleApi.removeRoleFromUser(targetUserId, userRole.roleId);
    },
    onSuccess: () => {
      refetchRoles();
      refetchPermissions();
    },
  });

  // Refresh permissions and roles
  const refresh = useCallback(() => {
    refetchPermissions();
    refetchRoles();
  }, [refetchPermissions, refetchRoles]);

  return {
    // Data
    userPermissions,
    userRoles,
    
    // Loading states
    isLoadingPermissions,
    isLoadingRoles,
    isLoading: isLoadingPermissions || isLoadingRoles,
    
    // Errors
    permissionsError,
    rolesError,
    error: permissionsError || rolesError,
    
    // Permission checks
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    
    // Role checks
    hasRole: checkRole,
    hasAnyRole: checkAnyRole,
    
    // Utility functions
    getPermissionsByCategory,
    getPermissionCategories,
    
    // Actions
    refresh,
    refetchPermissions,
    refetchRoles,
    
    // Mutations
    assignRole: assignRoleMutation.mutateAsync,
    removeRole: removeRoleMutation.mutateAsync,
    isAssigning: assignRoleMutation.isLoading,
    isRemoving: removeRoleMutation.isLoading,
  };
};

/**
 * Hook for checking specific permissions (simplified)
 */
export const usePermission = (permission: string, userId?: string) => {
  const { hasPermission, isLoading } = useUserPermissions(userId);
  
  return {
    hasPermission: hasPermission(permission),
    isLoading,
  };
};

/**
 * Hook for checking specific roles (simplified)
 */
export const useRole = (roleName: string, userId?: string) => {
  const { hasRole, isLoading } = useUserPermissions(userId);
  
  return {
    hasRole: hasRole(roleName),
    isLoading,
  };
};

/**
 * Hook for role management operations
 */
export const useRoleManagement = () => {
  const queryClient = useQueryClient();

  // Assign role to user
  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, roleData }: { userId: string; roleData: any }) =>
      UserRoleApi.assignRoleToUser(userId, roleData),
    onSuccess: (_data: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['userRoles', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['userPermissions', variables.userId] });
    },
  });

  // Remove role from user
  const removeRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      UserRoleApi.removeRoleFromUser(userId, roleId),
    onSuccess: (_data: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['userRoles', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['userPermissions', variables.userId] });
    },
  });

  // Update user role
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userRoleId, roleData }: { userRoleId: string; roleData: any }) =>
      UserRoleApi.updateUserRole(userRoleId, roleData),
    onSuccess: (_data: any, _variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      queryClient.invalidateQueries({ queryKey: ['userPermissions'] });
    },
  });

  // Deactivate user role
  const deactivateUserRoleMutation = useMutation({
    mutationFn: (userRoleId: string) => UserRoleApi.deactivateUserRole(userRoleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      queryClient.invalidateQueries({ queryKey: ['userPermissions'] });
    },
  });

  return {
    assignRole: assignRoleMutation.mutate,
    removeRole: removeRoleMutation.mutate,
    updateUserRole: updateUserRoleMutation.mutate,
    deactivateUserRole: deactivateUserRoleMutation.mutate,
    
    isAssigning: assignRoleMutation.isLoading,
    isRemoving: removeRoleMutation.isLoading,
    isUpdating: updateUserRoleMutation.isLoading,
    isDeactivating: deactivateUserRoleMutation.isLoading,
    
    assignError: assignRoleMutation.error,
    removeError: removeRoleMutation.error,
    updateError: updateUserRoleMutation.error,
    deactivateError: deactivateUserRoleMutation.error,
  };
};
