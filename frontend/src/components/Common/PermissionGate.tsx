import React from 'react';
import { useUserPermissions } from '../../hooks/useUserPermissions';

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  userId?: string;
}

/**
 * Component that conditionally renders children based on user permissions
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  userId,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = useUserPermissions(userId);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions);
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

interface RoleGateProps {
  children: React.ReactNode;
  role?: string;
  roles?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  userId?: string;
}

/**
 * Component that conditionally renders children based on user roles
 */
export const RoleGate: React.FC<RoleGateProps> = ({
  children,
  role,
  roles,
  requireAll = false,
  fallback = null,
  userId,
}) => {
  const { hasRole, hasAnyRole, isLoading } = useUserPermissions(userId);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  let hasAccess = false;

  if (role) {
    hasAccess = hasRole(role);
  } else if (roles) {
    if (requireAll) {
      hasAccess = roles.every(r => hasRole(r));
    } else {
      hasAccess = hasAnyRole(roles);
    }
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

interface ConditionalRenderProps {
  children: React.ReactNode;
  condition: boolean;
  fallback?: React.ReactNode;
}

/**
 * Generic component for conditional rendering
 */
export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  children,
  condition,
  fallback = null,
}) => {
  return condition ? <>{children}</> : <>{fallback}</>;
};
