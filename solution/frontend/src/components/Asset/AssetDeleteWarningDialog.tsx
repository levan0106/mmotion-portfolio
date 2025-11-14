/**
 * Asset Delete Warning Dialog Component
 * Shows warning when trying to delete asset with associated trades
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { ResponsiveButton, ResponsiveTypography, ModalWrapper } from '../Common';
import { 
  Warning as WarningIcon,
  AccountBalance as PortfolioIcon,
  Delete as DeleteIcon,
  CheckCircle as SafeIcon,
} from '@mui/icons-material';

export interface AssetDeleteWarningDialogProps {
  open: boolean;
  assetName: string;
  tradeCount: number;
  portfolios?: Array<{ id: string; name: string }>;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const AssetDeleteWarningDialog: React.FC<AssetDeleteWarningDialogProps> = ({
  open,
  assetName,
  tradeCount,
  portfolios = [],
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  const { t } = useTranslation();
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Reset confirmation when dialog opens/closes
  useEffect(() => {
    if (open) {
      setIsConfirmed(false);
    }
  }, [open]);
  const modalTitle = tradeCount > 0 ? t('asset.delete.titleWithTrades') : t('asset.delete.title');
  const modalIcon = <WarningIcon color="warning" />;

  const modalActions = (
    <>
      <ResponsiveButton
        onClick={onCancel}
        disabled={isDeleting}
        variant="outlined"
        size="medium"
        mobileText={t('common.cancel')}
        desktopText={t('common.cancel')}
      >
        {t('common.cancel')}
      </ResponsiveButton>
      <ResponsiveButton
        onClick={onConfirm}
        disabled={isDeleting || !isConfirmed}
        variant="contained"
        color="error"
        size="medium"
        startIcon={isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
        mobileText={isDeleting ? t('asset.delete.deleting') : t('asset.delete.delete')}
        desktopText={isDeleting ? t('asset.delete.deleting') : (tradeCount > 0 || portfolios.length > 0 ? t('asset.delete.deleteWithImpact') : t('asset.delete.delete'))}
      >
        {isDeleting ? t('asset.delete.deleting') : (tradeCount > 0 || portfolios.length > 0 ? t('asset.delete.deleteWithImpact') : t('asset.delete.delete'))}
      </ResponsiveButton>
    </>
  );

  return (
    <ModalWrapper
      open={open}
      onClose={onCancel}
      title={modalTitle}
      icon={modalIcon}
      actions={modalActions}
      maxWidth="sm"
      fullWidth
      titleColor="warning"
      size="medium"
    >
        {/* <Alert severity="warning" sx={{ mb: 3 }}>
          <ResponsiveTypography variant="cardLabel" fontWeight="medium">
            This action cannot be undone!
          </ResponsiveTypography>
        </Alert> */}

        {/* Affected Portfolios */}
        {tradeCount > 0 && (
          <Box sx={{ mb: 3, mt: 2 }}>
            <ResponsiveTypography variant="cardLabel" gutterBottom 
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            ellipsis={false}>
              {/* <PortfolioIcon color="primary" /> */}
              {t('asset.delete.affectedPortfolios')}
            </ResponsiveTypography>
            {portfolios.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {portfolios.map((portfolio) => (
                  <Chip
                    key={portfolio.id}
                    label={portfolio.name}
                    color="primary"
                    variant="outlined"
                    icon={<PortfolioIcon />}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Box>
            )}
            {portfolios.length == 0 && (
              <ResponsiveTypography variant="cardValueSmall" paragraph 
              ellipsis={false} 
              >
                {t('asset.delete.affectedPortfolios', 'Danh mục bị ảnh hưởng được quản lý bởi account khác.')}
              </ResponsiveTypography>
            )}
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Impact Analysis */}
        {tradeCount > 0 || portfolios.length > 0 ? (
          <Box>
            <ResponsiveTypography variant="cardLabel" gutterBottom 
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            ellipsis={false}>
              <WarningIcon color="warning" />
              {t('asset.delete.impactAnalysis')}
            </ResponsiveTypography>
            
            <ResponsiveTypography variant="cardLabel" paragraph ellipsis={false}>
              {t('asset.delete.impactDescription', { 
                assetName, 
                portfolioCount: portfolios.length,
                tradeCount 
              })}
            </ResponsiveTypography>

            <Alert severity="warning" sx={{ mb: 2 }}>
              <ResponsiveTypography variant="cardLabel" fontWeight="medium">
                {t('asset.delete.warningMessage')}
              </ResponsiveTypography>
            </Alert>

            <Card sx={{ bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}>
              <CardContent>
                <ResponsiveTypography variant="cardTitle" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DeleteIcon color="error" />
                  {t('asset.delete.whatWillBeDeleted')}:
                </ResponsiveTypography>
                <Box sx={{ mt: 1, pl: 2, mb: 1 }}>
                  <ResponsiveTypography  variant="cardLabel" sx={{ color: 'text.secondary' }}>
                    {t('asset.delete.theAsset', { assetName })}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="cardLabel" sx={{ color: 'text.secondary' }}>
                    {t('asset.delete.tradingRecords', { count: tradeCount })}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="cardLabel" sx={{ color: 'text.secondary' }}>
                    {t('asset.delete.transactionHistory')}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="cardLabel" sx={{ color: 'text.secondary' }}>
                    {t('asset.delete.portfolioCalculations')}
                  </ResponsiveTypography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ) : (
          <Box>
            <ResponsiveTypography variant="cardLabel" gutterBottom 
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            ellipsis={false}>
              <SafeIcon color="success" />
              {t('asset.delete.safeToDelete')}
            </ResponsiveTypography>
            
            <ResponsiveTypography variant="cardLabel" paragraph ellipsis={false}>
              {t('asset.delete.safeDescription', { assetName })}
            </ResponsiveTypography>

            <Alert severity="success" sx={{ mb: 2 }}>
              <ResponsiveTypography variant="cardLabel" ellipsis={false}>
                {t('asset.delete.safeMessage')}
              </ResponsiveTypography>
            </Alert>

            <Card sx={{ bgcolor: 'green.50', border: '1px solid', borderColor: 'green.200' }}>
              <CardContent>
                <ResponsiveTypography variant="cardTitle" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SafeIcon color="success" />
                  {t('asset.delete.whatWillBeDeleted')}:
                </ResponsiveTypography>
                <Box sx={{ mt: 1, pl: 2, mb: 1 }}>
                  <ResponsiveTypography variant="cardLabel" sx={{ color: 'text.secondary' }}>
                    {t('asset.delete.theAsset', { assetName })}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="cardLabel" sx={{ color: 'text.secondary' }}>
                    {t('asset.delete.noTradeRecords')}
                  </ResponsiveTypography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Confirmation Checkbox */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                color="error"
                disabled={isDeleting}
              />
            }
            label={
              <ResponsiveTypography variant="labelSmall"  sx={{ fontWeight: 500, color:"error.main" }} ellipsis={false}>
                {t('asset.delete.confirmationText', { 
                  assetName, 
                  tradeCount, 
                  portfolioCount: portfolios.length 
                })}
              </ResponsiveTypography>
            }
            sx={{ alignItems: 'flex-start' }}
          />
        </Box>
    </ModalWrapper>
  );
};
