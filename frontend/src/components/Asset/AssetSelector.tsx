/**
 * Asset Selector Component
 * Allows users to select existing assets or create new ones for portfolio
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ResponsiveButton } from '../Common';
import { Asset, CreateAssetRequest } from '../../types/asset.types';
import { useAssets } from '../../hooks/useAssets';
import { useAccount } from '../../contexts/AccountContext';
import { AssetForm } from './AssetForm';

export interface AssetSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: Asset) => void;
  onCreate: (assetData: CreateAssetRequest) => void;
  userId?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`asset-selector-tabpanel-${index}`}
      aria-labelledby={`asset-selector-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  open,
  onClose,
  onSelect,
  onCreate,
  userId,
}) => {
  const { accountId } = useAccount();
  const currentUserId = userId || accountId;
  
  const [tabValue, setTabValue] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { assets, loading, error: assetsError, setFilters } = useAssets({
    initialFilters: { createdBy: currentUserId },
    autoFetch: true,
  });

  // Filter assets based on search term
  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.symbol && asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setSelectedAsset(null);
    setError(null);
  };

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  const handleConfirmSelect = () => {
    if (selectedAsset) {
      onSelect(selectedAsset);
      onClose();
    }
  };

  const handleCreateAsset = (assetData: CreateAssetRequest) => {
    try {
      onCreate(assetData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset');
    }
  };

  const handleClose = () => {
    setSelectedAsset(null);
    setSearchTerm('');
    setError(null);
    setTabValue(0);
    onClose();
  };

  useEffect(() => {
    if (searchTerm) {
      setFilters({ search: searchTerm });
    }
  }, [searchTerm, setFilters]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          Add Asset to Portfolio
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choose an existing asset or create a new one
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Select Existing Asset" />
            <Tab label="Create New Asset" />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Search assets"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or code..."
              variant="outlined"
            />
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : assetsError ? (
            <Alert severity="error">
              {assetsError}
            </Alert>
          ) : filteredAssets.length === 0 ? (
            <Box textAlign="center" p={3}>
              <Typography variant="body2" color="text.secondary">
                No assets found. Try creating a new asset.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
              {filteredAssets.map((asset) => (
                <Box
                  key={asset.id}
                  onClick={() => handleAssetSelect(asset)}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: selectedAsset?.id === asset.id ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    mb: 1,
                    cursor: 'pointer',
                    backgroundColor: selectedAsset?.id === asset.id ? 'primary.50' : 'background.paper',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="medium">
                    {asset.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {asset.symbol && `${asset.symbol} • `}
                    {asset.type} • {asset.currency}
                  </Typography>
                  {asset.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {asset.description}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <AssetForm
            onSubmit={handleCreateAsset}
            userId={currentUserId}
            submitText="Create Asset"
          />
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <ResponsiveButton 
          onClick={handleClose}
          icon={<CircularProgress />}
          mobileText="Cancel"
          desktopText="Cancel"
        >
          Cancel
        </ResponsiveButton>
        {tabValue === 0 && (
          <ResponsiveButton
            onClick={handleConfirmSelect}
            variant="contained"
            disabled={!selectedAsset}
            icon={<CircularProgress />}
            mobileText="Add"
            desktopText="Add Selected Asset"
          >
            Add Selected Asset
          </ResponsiveButton>
        )}
      </DialogActions>
    </Dialog>
  );
};
