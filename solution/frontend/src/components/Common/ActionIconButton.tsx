/**
 * ActionIconButton Component
 * Wrapper around IconButton that automatically handles read-only mode (demo account)
 * Disables the button and shows appropriate tooltip when account is in read-only mode
 */

import React from 'react';
import { IconButton, IconButtonProps, Tooltip } from '@mui/material';
import { useAccount } from '../../contexts/AccountContext';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/services/api.userRoles';

export interface ActionIconButtonProps extends Omit<IconButtonProps, 'disabled'> {
  /**
   * Tooltip to show when disabled due to read-only mode
   * If not provided, uses default read-only message
   */
  readOnlyTooltip?: string;
  /**
   * Override disabled state (will be combined with read-only check)
   */
  disabled?: boolean;
  /**
   * Tooltip text to show when not disabled
   */
  tooltip?: string;
}

/**
 * ActionIconButton component that automatically handles read-only mode
 * 
 * Usage:
 * ```tsx
 * <ActionIconButton 
 *   onClick={handleEdit}
 *   tooltip="Edit"
 *   icon={<EditIcon />}
 * />
 * ```
 */
export const ActionIconButton: React.FC<ActionIconButtonProps> = ({
  readOnlyTooltip,
  tooltip,
  disabled: disabledProp,
  onClick,
  ...buttonProps
}) => {
  const { isReadOnly } = useAccount();
  const { t } = useTranslation();
  const { userRoles } = usePermissions();

  // Determine if button should be disabled (always disabled when read-only)
  const isDisabled = disabledProp || (isReadOnly && !userRoles.some((role: UserRole) => role.roleName === 'super_admin'));

  // Get tooltip text - prioritize read-only tooltip
  const getTooltipText = () => {
    if (isDisabled && isReadOnly) {
      return readOnlyTooltip || t('common.readOnlyMode');
    }
    return tooltip || '';
  };

  const tooltipText = getTooltipText();

  // Wrap button with tooltip if needed
  const button = (
    <span style={{ display: 'inline-flex' }}>
      <IconButton
        {...buttonProps}
        disabled={isDisabled}
        onClick={isDisabled ? undefined : onClick}
      />
    </span>
  );

  // Always show tooltip if there's text to show
  if (tooltipText) {
    return (
      <Tooltip title={tooltipText}>
        {button}
      </Tooltip>
    );
  }

  return button;
};

export default ActionIconButton;

