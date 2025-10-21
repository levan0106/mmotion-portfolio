import React from 'react';
import AssetPriceManagement from '../AssetPriceManagement';
import { ResponsiveButton } from '../Common';
import { ModalWrapper } from '../Common/ModalWrapper';

interface GlobalAsset {
  id: string;
  symbol: string;
  name: string;
  type: string;
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
