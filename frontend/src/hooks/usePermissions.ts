import { useAccount } from '../contexts/AccountContext';
import { useMemo, useState, useEffect } from 'react';
import { userRolesApi, UserPermission, UserRole } from '../services/api.userRoles';

export interface Permission {
  resource: string;
  action: string;
}

export const usePermissions = () => {
  const { currentUser } = useAccount();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user roles and permissions when user changes
  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!currentUser?.userId) {
        setUserRoles([]);
        setUserPermissions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await userRolesApi.getUserRoles();
        
        // Handle different response structures
        if (response && typeof response === 'object' && response.userRoles && response.permissions) {
          setUserRoles(response.userRoles);
          setUserPermissions(response.permissions);
          setError(null);
        } else {
          console.warn('Unexpected API response structure:', response);
          setUserRoles([]);
          setUserPermissions([]);
          setError('Invalid API response structure');
        }
      } catch (err) {
        console.error('Error fetching user roles:', err);
        setError('Failed to load user permissions');
        setUserRoles([]);
        setUserPermissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRoles();
  }, [currentUser?.userId]);

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