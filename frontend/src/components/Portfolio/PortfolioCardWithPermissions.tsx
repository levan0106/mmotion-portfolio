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
}

const PortfolioCardWithPermissions: React.FC<PortfolioCardWithPermissionsProps> = ({
  portfolio,
  onView,
  onEdit,
  onDelete,
  onPortfolioCopied,
  onManagePermissions,
  hideActions = false,
}) => {
  const { accountId } = useAccount();
  
  // Check if current user is the owner
  const isOwner = portfolio.accountId === accountId;
  
  // Only fetch permission stats if user is owner
  const { data: permissionStats } = usePortfolioPermissionStats(portfolio.portfolioId, isOwner);
  
  // Only show actions and permission stats for owners
  const shouldShowActions = !hideActions && isOwner;
  const shouldShowPermissionStats = isOwner;

  return (
    <PortfolioCard
      portfolio={portfolio}
      onView={onView}
      onEdit={isOwner ? onEdit : undefined}
      onDelete={isOwner ? onDelete : undefined}
      onPortfolioCopied={onPortfolioCopied}
      onManagePermissions={isOwner ? onManagePermissions : undefined}
      hideActions={!shouldShowActions}
      permissionStats={shouldShowPermissionStats ? (permissionStats || undefined) : undefined}
    />
  );
};

export default PortfolioCardWithPermissions;
