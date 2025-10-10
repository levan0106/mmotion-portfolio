import React, { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { AssetType, AssetTypeLabels } from '../../types/asset.types';
import { useGlobalAssets } from '../../hooks/useGlobalAssets';
import { ModalWrapper } from '../Common/ModalWrapper';
import { toastService } from '../../utils/toast';
import { getAssetTypeColor } from '../../config/chartColors';

interface BulkAssetSelectorProps {
  open: boolean;
  onClose: () => void;
  onBulkCreate: (globalAssetIds: string[]) => Promise<BulkCreateResult>;
  existingAssets?: Array<{ symbol: string; name: string }>; // User's existing assets
  onRefresh?: () => void | Promise<void>; // Callback to refresh data list
}

interface BulkCreateResult {
  created: any[];
  failed: Array<{ globalAssetId: string; error: string }>;
  summary: { total: number; created: number; failed: number };
}

export const BulkAssetSelector: React.FC<BulkAssetSelectorProps> = ({
  open,
  onClose,
  onBulkCreate,
  existingAssets = [],
  onRefresh,
}) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<AssetType | 'ALL'>('ALL');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const { data: globalAssets = [], isLoading: loading, error, refetch: fetchGlobalAssets } = useGlobalAssets({
    isActive: true,
    limit: 100,
    sortBy: 'name',
    sortOrder: 'ASC'
  });

  // Fetch global assets when dialog opens
  useEffect(() => {
    if (open) {
      fetchGlobalAssets();
    }
  }, [open, fetchGlobalAssets]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setSelectedType('ALL');
      setSelectedAssets([]);
    }
  }, [open]);

  const handleAssetToggle = (assetId: string) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAssets.length === filteredAssets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(filteredAssets.map((asset: any) => asset.id));
    }
  };

  const handleBulkCreate = async () => {
    if (selectedAssets.length === 0) return;

    setIsCreating(true);
    try {
      const result = await onBulkCreate(selectedAssets);
      
      // Show toast message based on result
      if (result.summary.failed === 0) {
        // All successful
        // Use toast service
        toastService.show(`✅ Tạo thành công ${result.summary.created} assets`, 'success', 3000);
        // Delay closing modal to show toast
        setTimeout(() => {
          onClose();
          if (onRefresh) {
            setTimeout(async () => {
              await onRefresh();
            }, 100);
          }
        }, 1500);
      } else if (result.summary.created > 0) {
        // Partial success
        toastService.show(`⚠️ Tạo thành công ${result.summary.created}/${result.summary.total} assets. ${result.summary.failed} assets thất bại.`, 'warning', 4000);
        // Delay closing modal to show toast
        setTimeout(() => {
          onClose();
          if (onRefresh) {
            setTimeout(async () => {
              await onRefresh();
            }, 100);
          }
        }, 1500);
      } else {
        // All failed
        toastService.show(`❌ Tạo thất bại tất cả ${result.summary.total} assets`, 'error', 5000);
        // Close modal after showing error
        setTimeout(() => {
          onClose();
        }, 2000);
      }
      
      setSelectedAssets([]);
    } catch (error) {
      console.error('Bulk create failed:', error);
      toastService.show('❌ Lỗi khi tạo assets', 'error', 3000);
      // Delay closing modal to show toast
      setTimeout(() => {
        onClose();
      }, 1500);
    } finally {
      setIsCreating(false);
    }
  };

  // Filter out assets that user already has
  const availableAssets = React.useMemo(() => {
    const existingSymbols = new Set(existingAssets.map(asset => asset.symbol.toUpperCase()));
    return globalAssets.filter((asset: any) => 
      !existingSymbols.has(asset.symbol.toUpperCase())
    );
  }, [globalAssets, existingAssets]);

  // Get unique asset types from available assets (not owned by user)
  const availableTypes = React.useMemo(() => {
    const types = [...new Set(availableAssets.map((asset: any) => asset.type))];
    return types.sort();
  }, [availableAssets]);

  // Filter assets based on search and type
  const filteredAssets = availableAssets.filter((asset: any) => {
    const matchesSearch = !searchTerm || 
      asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'ALL' || asset.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getAssetTypeChipColor = (type: AssetType): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    const colors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
      STOCK: 'primary',
      BOND: 'secondary',
      GOLD: 'warning',
      COMMODITY: 'info',
      DEPOSIT: 'success',
      CASH: 'default',
    };
    return colors[type as string] || 'default';
  };

  const modalActions = (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button onClick={onClose}>
        Hủy
      </Button>
      <Button
        variant="contained"
        onClick={handleBulkCreate}
        disabled={selectedAssets.length === 0 || isCreating}
        startIcon={isCreating ? <CircularProgress size={20} /> : <AddIcon />}
      >
        {isCreating ? 'Đang tạo...' : `Tạo ${selectedAssets.length} Assets`}
      </Button>
    </Box>
  );

  return (
    <>
    <ModalWrapper
      open={open}
      onClose={onClose}
      title="Chọn Assets từ danh sách mẫu"
      maxWidth="md"
      fullWidth
      loading={isCreating}
      actions={modalActions}
    >
        <Box>
            {/* Collapsible Help Text */}
            <Box sx={{ 
              mb: 3, 
              mt: 2,
              backgroundColor: alpha(theme.palette.info.main, 0.08),
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
              overflow: 'hidden'
            }}>
              <Button
                fullWidth
                onClick={() => setShowHelp(!showHelp)}
                sx={{
                  justifyContent: 'flex-start',
                  p: 2,
                  textTransform: 'none',
                  color: 'text.secondary',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.info.main, 0.12)
                  }
                }}
                startIcon={showHelp ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              >
                💡 Hướng dẫn sử dụng
              </Button>
              
              {showHelp && (
                <Box sx={{ p: 3, pt: 0 }}>
                  <Typography variant="body2" sx={{ 
                    color: 'text.secondary', 
                    fontWeight: 500,
                    lineHeight: 1.6
                  }}>
                    Chọn các assets từ danh sách mẫu để tạo nhanh trong portfolio của bạn. 
                    Danh sách chỉ hiển thị các assets mà bạn chưa sở hữu. Bạn cũng có thể tìm kiếm theo tên hoặc symbol.
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Box mb={3} sx={{ pt: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tìm kiếm assets"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                    placeholder="Nhập tên hoặc symbol..."
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Loại Asset</InputLabel>
                    <Select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value as AssetType | 'ALL')}
                      label="Loại Asset"
                    >
                      <MenuItem value="ALL">Tất cả</MenuItem>
                      {availableTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {AssetTypeLabels[type as keyof typeof AssetTypeLabels] || type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleSelectAll}
                    disabled={loading || filteredAssets.length === 0}
                  >
                    {selectedAssets.length === filteredAssets.length ? 'Bỏ chọn' : 'Chọn tất cả'}
                  </Button>
                </Grid>
              </Grid>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">
                Lỗi khi tải danh sách assets: {String(error)}
              </Alert>
            ) : filteredAssets.length === 0 ? (
              <Alert severity="info">
                {availableAssets.length === 0 
                  ? "Bạn đã có tất cả assets có sẵn trong hệ thống"
                  : "Không tìm thấy assets phù hợp với điều kiện tìm kiếm"
                }
              </Alert>
            ) : (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Tìm thấy {filteredAssets.length} assets chưa có trong portfolio
                </Typography>
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {filteredAssets.map((asset: any) => (
                    <ListItem
                      key={asset.id}
                      dense
                      button
                      onClick={() => handleAssetToggle(asset.id)}
                      sx={{
                        borderLeft: selectedAssets.includes(asset.id) ? '4px solid primary.main' : 'none',
                        bgcolor: selectedAssets.includes(asset.id) ? 'action.selected' : 'inherit',
                      }}
                    >
                      <Checkbox
                        edge="start"
                        checked={selectedAssets.includes(asset.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body1" fontWeight="medium">
                              {asset.symbol}
                            </Typography>
                            <Chip
                              label={AssetTypeLabels[asset.type as keyof typeof AssetTypeLabels]}
                              size="small"
                              color={getAssetTypeChipColor(asset.type)}
                              sx={{
                                backgroundColor: getAssetTypeColor(asset.type),
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: getAssetTypeColor(asset.type),
                                  opacity: 0.8,
                                }
                              }}
                            />
                          </Box>
                        }
                        secondary={asset.name}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
    </ModalWrapper>
  </>
  );
};
