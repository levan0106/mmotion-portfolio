import React, { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { ResponsiveTypography } from './ResponsiveTypography';
import { ResponsiveButton } from './ResponsiveButton';
import { Security as SecurityIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  // Permission-based access
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  // Role-based access
  role?: string;
  roles?: string[];
  requireAllRoles?: boolean;
  // Combined access (user needs both permission AND role)
  requireBoth?: boolean;
  // UI options
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
  // Hide mode - simply hide component if no permission
  hide?: boolean;
  // Alternative content when hidden
  hiddenContent?: React.ReactNode;
  // Quick mode - simplified API for common use cases
  mode?: 'hide' | 'show' | 'fallback' | 'deny';
  // Quick role check (shorthand for roles prop)
  admin?: boolean;
  // Quick permission check (shorthand for permissions prop)
  can?: string | string[];
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  role,
  roles,
  requireAllRoles = false,
  requireBoth = false,
  fallback,
  showAccessDenied = true,
  hide = false,
  hiddenContent,
  mode = 'deny',
  admin = false,
  can
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole, hasAllRoles, isLoading } = usePermissions();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [accessResult, setAccessResult] = useState<boolean | null>(null);

  useEffect(() => {
    // Only check if not already loading permissions
    if (!isLoading) {
      let hasPermissionAccess = true;
      let hasRoleAccess = true;

      // Handle quick mode props
      const effectiveRoles = admin ? ['admin', 'super_admin'] : roles;
      const effectivePermissions = can ? (Array.isArray(can) ? can : [can]) : permissions;

      // Check permission access
      if (permission) {
        hasPermissionAccess = hasPermission(permission);
      } else if (effectivePermissions && effectivePermissions.length > 0) {
        if (requireAll) {
          hasPermissionAccess = hasAllPermissions(effectivePermissions);
        } else {
          hasPermissionAccess = hasAnyPermission(effectivePermissions);
        }
      }

      // Check role access
      if (role) {
        hasRoleAccess = hasRole(role);
      } else if (effectiveRoles && effectiveRoles.length > 0) {
        if (requireAllRoles) {
          hasRoleAccess = hasAllRoles(effectiveRoles);
        } else {
          hasRoleAccess = hasAnyRole(effectiveRoles);
        }
      }

      // Determine final access
      let hasAccess = false;
      if (requireBoth) {
        // User needs both permission AND role
        hasAccess = hasPermissionAccess && hasRoleAccess;
      } else {
        // User needs either permission OR role (or both if specified)
        hasAccess = hasPermissionAccess && hasRoleAccess;
      }

      setAccessResult(hasAccess);
      setIsChecking(false);
    }
  }, [isLoading, permission, permissions, requireAll, role, roles, requireAllRoles, requireBoth, hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole, hasAllRoles, admin, can]);

  // Show loading while checking permissions
  if (isLoading || isChecking) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        p: 3
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <ResponsiveTypography variant="body1" color="text.secondary">
            Checking permissions...
          </ResponsiveTypography>
        </Box>
      </Box>
    );
  }

  // Show children if access is granted
  if (accessResult === true) {
    return <>{children}</>;
  }

  // Handle different modes
  switch (mode) {
    case 'hide':
      return hiddenContent ? <>{hiddenContent}</> : null;
    case 'show':
      return <>{children}</>;
    case 'fallback':
      return fallback ? <>{fallback}</> : null;
    case 'deny':
    default:
      // Continue with existing logic
      break;
  }

  // Legacy hide mode: simply hide component if no permission
  if (hide) {
    return hiddenContent ? <>{hiddenContent}</> : null;
  }

  // Show fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Don't show anything if access denied and showAccessDenied is false
  if (!showAccessDenied) {
    return null;
  }

  // const getRequiredPermissions = () => {
  //   if (permission) return [permission];
  //   if (permissions) return permissions;
  //   return [];
  // };

  // const getRequiredRoles = () => {
  //   if (role) return [role];
  //   if (roles) return roles;
  //   return [];
  // };

  //const requiredPermissions = getRequiredPermissions();
  //const requiredRoles = getRequiredRoles();
  //const hasPermissionRequirements = requiredPermissions.length > 0;
  //const hasRoleRequirements = requiredRoles.length > 0;

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '50vh',
      p: 3
    }}>
      <Box sx={{ textAlign: 'center', maxWidth: 500 }}>
        <SecurityIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <ResponsiveTypography variant="h5" gutterBottom>
          Access Denied
        </ResponsiveTypography>
        <ResponsiveTypography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          You don't have the required access to this resource.
        </ResponsiveTypography>
        
        {/* {hasPermissionRequirements && (
          <Box sx={{ mb: 2 }}>
            <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {requireAll ? 'All' : 'At least one of the'} following permissions are required:
            </ResponsiveTypography>
            {requiredPermissions.map((perm, index) => (
              <ResponsiveTypography key={index} variant="body2" sx={{ mb: 0.5 }}>
                • {perm}
              </ResponsiveTypography>
            ))}
          </Box>
        )}

        {hasRoleRequirements && (
          <Box sx={{ mb: 2 }}>
            <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {requireAllRoles ? 'All' : 'At least one of the'} following roles are required:
            </ResponsiveTypography>
            {requiredRoles.map((roleName, index) => (
              <ResponsiveTypography key={index} variant="body2" sx={{ mb: 0.5 }}>
                • {roleName}
              </ResponsiveTypography>
            ))}
          </Box>
        )}

        {requireBoth && hasPermissionRequirements && hasRoleRequirements && (
          <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
            ⚠️ Both permission AND role requirements must be met
          </Typography>
        )} */}

        <ResponsiveButton
          variant="contained"
          icon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          mobileText="Back"
          desktopText="Go Back"
        >
          Go Back
        </ResponsiveButton>
      </Box>
    </Box>
  );
};

// MultiPermissionGuard is now integrated into PermissionGuard
// Use PermissionGuard with permissions prop instead

// Simple wrapper for hiding components based on permissions
export const HideIfNoPermission: React.FC<{
  children: React.ReactNode;
  roles?: string[];
  permissions?: string[];
  fallback?: React.ReactNode;
}> = ({ children, roles, permissions, fallback }) => {
  return (
    <PermissionGuard
      roles={roles}
      permissions={permissions}
      hide={true}
      hiddenContent={fallback}
    >
      {children}
    </PermissionGuard>
  );
};
