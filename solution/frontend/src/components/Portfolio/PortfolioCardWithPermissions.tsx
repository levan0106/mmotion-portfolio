/**
 * Portfolio Card with Permission Stats
 * Wrapper component that fetches permission stats and displays them
 */

import React from 'react';
import { Portfolio } from '../../types';
import PortfolioCard from './PortfolioCard';
import { usePortfolioPermissionStats } from '../../hooks/usePortfolios';
import { useAccount } from '../../contexts/AccountContext';

interface PortfolioCardWithPermissionsProps {
  portfolio: Portfolio;
  onView: (portfolioId: string) => void;
  onEdit?: (portfolioId: string) => void;
  onDelete?: (portfolioId: string) => void;
  onPortfolioCopied?: (newPortfolio: Portfolio) => void;
  onManagePermissions?: (portfolioId: string) => void;
  hideActions?: boolean;
  isReadOnly?: boolean;
}

const PortfolioCardWithPermissions: React.FC<PortfolioCardWithPermissionsProps> = ({
  portfolio,
  onView,
  onEdit,
  onDelete,
  onPortfolioCopied,
  onManagePermissions,
  hideActions = false,
  isReadOnly = false,
}) => {
  const { accountId } = useAccount();
  
  // Check if current user is the owner (creator or has owner permission)
  const isOwner = portfolio.accountId === accountId || portfolio.userPermission?.isOwner === true;
  
  // Only fetch permission stats if user is owner
  const { data: permissionStats } = usePortfolioPermissionStats(portfolio.portfolioId, isOwner);
  
  // Only show actions and permission stats for owners (and not in read-only mode)
  const shouldShowActions = !hideActions && isOwner && !isReadOnly;
  const shouldShowPermissionStats = isOwner;

  return (
    <PortfolioCard
      portfolio={portfolio}
      onView={onView}
      onEdit={isOwner && !isReadOnly ? onEdit : undefined}
      onDelete={isOwner && !isReadOnly ? onDelete : undefined}
      onPortfolioCopied={onPortfolioCopied}
      onManagePermissions={isOwner && !isReadOnly ? onManagePermissions : undefined}
      hideActions={!shouldShowActions}
      permissionStats={shouldShowPermissionStats ? (permissionStats || undefined) : undefined}
      isReadOnly={isReadOnly}
    />
  );
};

export default PortfolioCardWithPermissions;
