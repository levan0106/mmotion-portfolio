import React from 'react';
import { Box, Typography, Button } from '@mui/material';
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
  showAccessDenied = true
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole, hasAllRoles } = usePermissions();
  const navigate = useNavigate();

  let hasPermissionAccess = true;
  let hasRoleAccess = true;

  // Check permission access
  if (permission) {
    hasPermissionAccess = hasPermission(permission);
  } else if (permissions) {
    if (requireAll) {
      hasPermissionAccess = hasAllPermissions(permissions);
    } else {
      hasPermissionAccess = hasAnyPermission(permissions);
    }
  }

  // Check role access
  if (role) {
    hasRoleAccess = hasRole(role);
  } else if (roles) {
    if (requireAllRoles) {
      hasRoleAccess = hasAllRoles(roles);
    } else {
      hasRoleAccess = hasAnyRole(roles);
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

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showAccessDenied) {
    return null;
  }

  const getRequiredPermissions = () => {
    if (permission) return [permission];
    if (permissions) return permissions;
    return [];
  };

  const getRequiredRoles = () => {
    if (role) return [role];
    if (roles) return roles;
    return [];
  };

  const requiredPermissions = getRequiredPermissions();
  const requiredRoles = getRequiredRoles();
  const hasPermissionRequirements = requiredPermissions.length > 0;
  const hasRoleRequirements = requiredRoles.length > 0;

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
        <Typography variant="h5" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          You don't have the required access to this resource.
        </Typography>
        
        {hasPermissionRequirements && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {requireAll ? 'All' : 'At least one of the'} following permissions are required:
            </Typography>
            {requiredPermissions.map((perm, index) => (
              <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                • {perm}
              </Typography>
            ))}
          </Box>
        )}

        {hasRoleRequirements && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {requireAllRoles ? 'All' : 'At least one of the'} following roles are required:
            </Typography>
            {requiredRoles.map((roleName, index) => (
              <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                • {roleName}
              </Typography>
            ))}
          </Box>
        )}

        {requireBoth && hasPermissionRequirements && hasRoleRequirements && (
          <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
            ⚠️ Both permission AND role requirements must be met
          </Typography>
        )}

        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Box>
    </Box>
  );
};

// MultiPermissionGuard is now integrated into PermissionGuard
// Use PermissionGuard with permissions prop instead
