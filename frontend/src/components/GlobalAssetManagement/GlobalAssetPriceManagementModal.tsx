import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { AutoMode as AutoModeIcon, Edit as EditIcon } from '@mui/icons-material';
import AssetPriceManagement from '../AssetPriceManagement';
import { ResponsiveButton } from '../Common';
import { ModalWrapper } from '../Common/ModalWrapper';

interface GlobalAsset {
  id: string;
  symbol: string;
  name: string;
  type: string;
  priceMode: string;
  nation: string;
  marketCode: string;
  currency: string;
  timezone: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  assetPrice?: {
    currentPrice: number;
    priceType: string;
    priceSource: string;
    lastPriceUpdate: string;
  };
}

interface GlobalAssetPriceManagementModalProps {
  open: boolean;
  onClose: () => void;
  asset: GlobalAsset | null;
  onPriceUpdate: (assetId: string, price: number, priceType: string, priceSource: string, changeReason?: string) => Promise<void>;
  onPriceHistoryRefresh: (assetId: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}

const GlobalAssetPriceManagementModal: React.FC<GlobalAssetPriceManagementModalProps> = ({
  open,
  onClose,
  asset,
  onPriceUpdate,
  onPriceHistoryRefresh,
  loading = false,
  error,
}) => {

  if (!asset) return null;

  const getPriceModeColor = (priceMode: string) => {
    switch (priceMode) {
      case 'AUTOMATIC':
        return 'success';
      case 'MANUAL':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPriceModeIcon = (priceMode: string) => {
    switch (priceMode) {
      case 'AUTOMATIC':
        return <AutoModeIcon fontSize="small" />;
      case 'MANUAL':
        return <EditIcon fontSize="small" />;
      default:
        return undefined;
    }
  };

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={`Price Management - ${asset.symbol}`}
      maxWidth="lg"
      fullWidth
      loading={loading}
      size="large"
      actions={
        <ResponsiveButton onClick={onClose} mobileText="Close" desktopText="Close">
          Close
        </ResponsiveButton>
      }
    >
      {/* Price Mode Display */}
      <Box sx={{ 
        mx: 2,
        p: 2, 
        backgroundColor: 'grey.50', 
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'grey.200'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Price Mode:
          </Typography>
          <Chip
            label={asset.priceMode}
            color={getPriceModeColor(asset.priceMode) as any}
            icon={getPriceModeIcon(asset.priceMode)}
            size="small"
            sx={{ 
              fontWeight: 500,
              '& .MuiChip-icon': {
                fontSize: '16px'
              }
            }}
          />
        </Box>
      </Box>

      <AssetPriceManagement
        asset={{
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
          currency: asset.currency,
          assetPrice: asset.assetPrice ? {
            id: '',
            assetId: asset.id,
            currentPrice: asset.assetPrice.currentPrice,
            priceType: asset.assetPrice.priceType,
            priceSource: asset.assetPrice.priceSource,
            lastPriceUpdate: asset.assetPrice.lastPriceUpdate,
          } : undefined
        }}
        onPriceUpdate={onPriceUpdate}
        onPriceHistoryRefresh={onPriceHistoryRefresh}
        loading={loading}
        error={error}
      />
    </ModalWrapper>
  );
};

export default GlobalAssetPriceManagementModal;
