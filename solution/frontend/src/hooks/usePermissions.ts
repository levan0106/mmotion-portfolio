import { useAccount } from '../contexts/AccountContext';
import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { userRolesApi } from '../services/api.userRoles';

export interface Permission {
  resource: string;
  action: string;
}

export const usePermissions = () => {
  const { currentUser } = useAccount();

  // Use React Query for caching and deduplication
  // This ensures the API is only called once even if multiple components use this hook
  const {
    data: userRolesData,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['currentUserRoles', currentUser?.userId],
    queryFn: async () => {
      if (!currentUser?.userId) {
        return { userRoles: [], permissions: [] };
      }

      try {
        const response = await userRolesApi.getUserRoles();
        
        // Handle different response structures
        if (response && typeof response === 'object' && response.userRoles && response.permissions) {
          return {
            userRoles: response.userRoles,
            permissions: response.permissions,
          };
        } else {
          console.warn('Unexpected API response structure:', response);
          return { userRoles: [], permissions: [] };
        }
      } catch (err) {
        console.error('Error fetching user roles:', err);
        throw err;
      }
    },
    enabled: !!currentUser?.userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh for 5 minutes
    retry: 1,
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
  });

  // Extract userRoles and userPermissions from query data
  const userRoles = userRolesData?.userRoles || [];
  const userPermissions = userRolesData?.permissions || [];
  const error = queryError ? 'Failed to load user permissions' : null;

  const permissions = useMemo(() => {
    return userPermissions.map(permission => ({
      resource: permission.resource,
      action: permission.action
    }));
  }, [userPermissions]);

  const roles = useMemo(() => {
    const roles = userRoles.map(role => role.roleName);
    return roles;

  }, [userRoles]);

  const hasPermission = (permission: string): boolean => {
    return permissions.some((p: Permission) => 
      `${p.resource}.${p.action}` === permission
    );
  };

  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some(permission => 
      hasPermission(permission)
    );
  };

  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every(permission => 
      hasPermission(permission)
    );
  };

  const hasRole = (roleName: string): boolean => {
    return roles.includes(roleName);
  };

  const hasAnyRole = (roleList: string[]): boolean => {
    return roleList.some(role => hasRole(role));
  };

  const hasAllRoles = (roleList: string[]): boolean => {
    return roleList.every(role => hasRole(role));
  };

  return {
    permissions,
    roles,
    userRoles,
    userPermissions,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    hasAllRoles
  };
};