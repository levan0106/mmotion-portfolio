import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { Security, Edit, Visibility, AdminPanelSettings } from '@mui/icons-material';
import { UserPermission, PortfolioPermissionType } from '../../types';

interface PermissionBadgeProps {
  permission: UserPermission;
  size?: 'small' | 'medium';
  showIcon?: boolean;
  variant?: 'outlined' | 'filled';
}

const PermissionBadge: React.FC<PermissionBadgeProps> = ({
  permission,
  size = 'small',
  showIcon = true,
  variant = 'outlined'
}) => {
  const getPermissionConfig = (permissionType: PortfolioPermissionType) => {
    switch (permissionType) {
      case PortfolioPermissionType.OWNER:
        return {
          label: 'Owner',
          color: 'primary' as const,
          icon: <AdminPanelSettings fontSize="small" />,
          tooltip: 'You are the owner of this portfolio. You have full control.'
        };
      case PortfolioPermissionType.UPDATE:
        return {
          label: 'Update',
          color: 'secondary' as const,
          icon: <Edit fontSize="small" />,
          tooltip: 'You can view and update this portfolio.'
        };
      case PortfolioPermissionType.VIEW:
        return {
          label: 'View Only',
          color: 'default' as const,
          icon: <Visibility fontSize="small" />,
          tooltip: 'You can only view this portfolio.'
        };
      default:
        return {
          label: 'Unknown',
          color: 'default' as const,
          icon: <Security fontSize="small" />,
          tooltip: 'Unknown permission level.'
        };
    }
  };

  const config = getPermissionConfig(permission.permissionType);

  return (
    <Tooltip title={config.tooltip} arrow>
      <Chip
        icon={showIcon ? config.icon : undefined}
        label={config.label}
        color={config.color}
        size={size}
        variant={variant}
        sx={{
          fontWeight: 600,
          '& .MuiChip-icon': {
            fontSize: '1rem'
          }
        }}
      />
    </Tooltip>
  );
};

export default PermissionBadge;
