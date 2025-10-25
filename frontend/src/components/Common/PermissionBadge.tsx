import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { Security, Edit, Visibility, Star, PersonAdd } from '@mui/icons-material';
import { UserPermission, PortfolioPermissionType } from '../../types';

interface PermissionBadgeProps {
  permission: UserPermission;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'filled';
  showIcon?: boolean;
  showLabel?: boolean;
}

const PermissionBadge: React.FC<PermissionBadgeProps> = ({
  permission,
  size = 'small',
  variant = 'outlined',
  showIcon = true,
  showLabel = true
}) => {
  const getPermissionConfig = (permissionType: PortfolioPermissionType) => {
    switch (permissionType) {
      case PortfolioPermissionType.OWNER:
        return {
          label: 'Owner',
          color: 'primary' as const,
          icon: <Star fontSize="small" />,
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
          label: 'View',
          color: 'default' as const,
          icon: <Visibility fontSize="small" />,
          tooltip: 'You can only view this portfolio.'
        };
      case PortfolioPermissionType.CREATOR:
        return {
          label: 'Creator',
          color: 'success' as const,
          icon: <PersonAdd fontSize="small" />,
          tooltip: 'You are the creator of this portfolio. You can transfer the creation permission to another account.'
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
        label={showLabel ? config.label : undefined}
        color={config.color}
        size={size}
        variant={variant}
        sx={{
          fontWeight: 500,
          // Completely remove chip styling on mobile/tablet
          border: showLabel ? { 
            xs: 'none!important',   
            sm: 'none!important', 
            md: 'none!important', 
            lg: '0.5px solid!important' } 
            : 'none!important',
          '& .MuiChip-label': {
            // Hide text on mobile and tablet, show on desktop (lg and up)
            display: { xs: 'none', sm: 'none', md: 'none', lg: 'block' }
          }
        }}
      />
    </Tooltip>
  );
};

export default PermissionBadge;
