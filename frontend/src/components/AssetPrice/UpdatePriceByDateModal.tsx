import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Grid,
} from '@mui/material';
import {
  DatePicker,
  LocalizationProvider,
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import {
  CheckCircle,
  Error,
  Refresh,
  History,
} from '@mui/icons-material';
import { useAssetPriceBulk, AssetWithHistoricalPrice, BulkUpdateResult } from '../../hooks/useAssetPriceBulk';
import { formatCurrency, formatNumber } from '../../utils/format';

interface UpdatePriceByDateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: BulkUpdateResult) => void;
}

interface AssetSelection extends AssetWithHistoricalPrice {
  selected: boolean;
}

export const UpdatePriceByDateModal: React.FC<UpdatePriceByDateModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { loading, error, getAssetsWithHistoricalPrice, bulkUpdatePricesByDate } = useAssetPriceBulk();
  
  // State management
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [assets, setAssets] = useState<AssetSelection[]>([]);
  const [reason, setReason] = useState('');
  const [step, setStep] = useState<'date' | 'assets' | 'confirm' | 'result'>('date');
  const [updateResult, setUpdateResult] = useState<BulkUpdateResult | null>(null);

  // Initialize with today's date
  useEffect(() => {
    if (open && !targetDate) {
      const today = new Date();
      setTargetDate(today);
    }
  }, [open, targetDate]);

  // Load assets manually
  const loadAssets = useCallback(async () => {
    if (!targetDate) return;

    try {
      const assetsData = await getAssetsWithHistoricalPrice(
        targetDate.toISOString().split('T')[0]
      );
      
      const assetsWithSelection = assetsData.map(asset => ({
        ...asset,
        selected: asset.hasHistoricalData, // Auto-select assets with historical data
      }));
      
      setAssets(assetsWithSelection);
      // Don't change step, just load data
    } catch (err) {
      console.error('Failed to load assets:', err);
    }
  }, [targetDate, getAssetsWithHistoricalPrice]);

  // Handle date selection - don't auto-load
  const handleDateChange = (date: Date | null) => {
    setTargetDate(date);
    // Clear previous data when date changes
    setAssets([]);
  };

  // Handle asset selection
  const handleAssetSelection = (assetId: string, selected: boolean) => {
    setAssets(prev => prev.map(asset => 
      asset.assetId === assetId ? { ...asset, selected } : asset
    ));
  };

  // Handle select all/none
  const handleSelectAll = (selected: boolean) => {
    setAssets(prev => prev.map(asset => ({ 
      ...asset, 
      selected: selected ? asset.hasHistoricalData : false 
    })));
  };

  // Get selected assets
  const selectedAssets = assets.filter(asset => asset.selected);
  const assetsWithData = selectedAssets.filter(asset => asset.hasHistoricalData);
  const assetsWithoutData = selectedAssets.filter(asset => !asset.hasHistoricalData);

  // Handle bulk update
  const handleBulkUpdate = async () => {
    if (!targetDate || selectedAssets.length === 0) return;

    // Filter only assets with valid historical data
    const validAssets = selectedAssets.filter(asset => 
      asset.hasHistoricalData && 
      asset.historicalPrice && 
      asset.historicalPrice > 0 &&
      isFinite(asset.historicalPrice)
    );

    if (validAssets.length === 0) {
      console.error('No valid assets with historical data found');
      return;
    }

    try {
      const result = await bulkUpdatePricesByDate(
        targetDate.toISOString().split('T')[0],
        validAssets.map(asset => asset.assetId),
        reason
      );
      
      setUpdateResult(result);
      setStep('result');
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      console.error('Failed to bulk update:', err);
    }
  };

  // Reset modal state
  const handleClose = () => {
    setStep('date');
    setAssets([]);
    setReason('');
    setUpdateResult(null);
    onClose();
  };

  // Render date selection step
  const renderDateStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Chọn ngày để lấy giá lịch sử
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Hệ thống sẽ tìm giá cuối cùng của ngày được chọn và cập nhật vào giá hiện tại.
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
            <DatePicker
              label="Ngày lấy giá lịch sử"
              value={targetDate}
              onChange={handleDateChange}
              maxDate={new Date()} // Can select today and past dates
              slotProps={{
                textField: {
                  fullWidth: true,
                  helperText: 'Chọn ngày hiện tại hoặc trong quá khứ để lấy giá lịch sử',
                },
              }}
            />
          </LocalizationProvider>
        </Box>
        <Box sx={{ mt: 1 }}>
          <Button
            variant="contained"
            onClick={loadAssets}
            disabled={!targetDate || loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            size="large"
          >
            {loading ? 'Đang tải...' : 'Tải dữ liệu'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Show assets data below if loaded */}
      {assets.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Danh sách tài sản ({assets.length})
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Tài sản có dữ liệu lịch sử sẽ được tự động chọn. Bạn có thể bỏ chọn nếu không muốn cập nhật.
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Tổng cộng: {assets.length} tài sản | 
              Đã chọn: {assets.filter(a => a.selected).length} | 
              Có dữ liệu: {assets.filter(a => a.hasHistoricalData).length} | 
              Không có dữ liệu: {assets.filter(a => !a.hasHistoricalData).length}
            </Typography>
            <Box>
              <Button
                size="small"
                onClick={() => handleSelectAll(true)}
                sx={{ mr: 1 }}
              >
                Chọn có dữ liệu
              </Button>
              <Button
                size="small"
                onClick={() => handleSelectAll(false)}
              >
                Bỏ chọn tất cả
              </Button>
            </Box>
          </Box>

          <Box sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            {assets.map((asset) => (
              <Box
                key={asset.assetId}
                sx={{
                  p: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: !asset.hasHistoricalData ? 0.6 : 1,
                  backgroundColor: !asset.hasHistoricalData ? 'action.hover' : 'transparent',
                  '&:last-child': { borderBottom: 'none' },
                  '&:hover': {
                    backgroundColor: asset.hasHistoricalData ? 'action.hover' : 'action.selected',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <Checkbox
                    checked={asset.selected}
                    onChange={(e) => handleAssetSelection(asset.assetId, e.target.checked)}
                    disabled={!asset.hasHistoricalData}
                    size="small"
                  />
                  <Box sx={{ ml: 1, flex: 1 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight="medium"
                      sx={{ 
                        color: !asset.hasHistoricalData ? 'text.disabled' : 'text.primary',
                        fontSize: '0.875rem'
                      }}
                    >
                      {asset.symbol} - {asset.name}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: !asset.hasHistoricalData ? 'text.disabled' : 'text.secondary',
                        fontSize: '0.75rem'
                      }}
                    >
                      Loại: {asset.type} | Tiền tệ: {asset.currency}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right', minWidth: 180 }}>
                  <Typography 
                    variant="body2"
                    sx={{ 
                      color: !asset.hasHistoricalData ? 'text.disabled' : 'text.primary',
                      fontSize: '0.875rem'
                    }}
                  >
                    Giá hiện tại: {formatNumber(asset.currentPrice)} {asset.currency}
                  </Typography>
                  {asset.hasHistoricalData ? (
                    <Typography 
                      variant="body2" 
                      color="success.main"
                      sx={{ fontSize: '0.875rem' }}
                    >
                      Giá lịch sử: {formatNumber(asset.historicalPrice!)} {asset.currency}
                    </Typography>
                  ) : (
                    <Typography 
                      variant="body2" 
                      color="error.main"
                      sx={{ fontSize: '0.875rem' }}
                    >
                      Không có dữ liệu
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={() => setStep('confirm')}
              disabled={assets.filter(a => a.selected).length === 0}
            >
              Tiếp tục ({assets.filter(a => a.selected).length} tài sản)
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );


  // Render confirmation step
  const renderConfirmStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Xác nhận cập nhật giá
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Bạn sắp cập nhật giá cho {selectedAssets.length} tài sản từ ngày {targetDate?.toLocaleDateString('vi-VN')}.
          Thao tác này không thể hoàn tác.
        </Typography>
      </Alert>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {assetsWithData.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tài sản sẽ được cập nhật
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {assetsWithoutData.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tài sản không có dữ liệu
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {reason && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Lý do: {reason}
          </Typography>
        </Box>
      )}
    </Box>
  );

  // Render result step
  const renderResultStep = () => {
    if (!updateResult) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Kết quả cập nhật
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mb: 2, 
          p: 1.5, 
          backgroundColor: 'background.paper',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="h5" color="success.main" sx={{ fontWeight: 'bold' }}>
              {updateResult.successCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Thành công
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="h5" color="error.main" sx={{ fontWeight: 'bold' }}>
              {updateResult.failedCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Thất bại
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="h5" color="primary.main" sx={{ fontWeight: 'bold' }}>
              {updateResult.totalCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tổng cộng
            </Typography>
          </Box>
        </Box>

        <Box sx={{ 
          maxHeight: 400, 
          overflow: 'auto', 
          border: '1px solid', 
          borderColor: 'divider', 
          borderRadius: 1,
          backgroundColor: 'background.paper'
        }}>
          {updateResult.results.map((result, index) => (
            <Box
              key={index}
              sx={{
                p: 1.5,
                borderBottom: index < updateResult.results.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                {result.success ? (
                  <CheckCircle color="success" sx={{ mr: 1, fontSize: 20 }} />
                ) : (
                  <Error color="error" sx={{ mr: 1, fontSize: 20 }} />
                )}
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {result.symbol}
                  </Typography>
                </Box>
              </Box>
              {result.oldPrice && result.newPrice && (
                <Box sx={{ textAlign: 'right', minWidth: 120 }}>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(result.oldPrice)}
                  </Typography>
                  <Typography variant="caption" sx={{ mx: 0.5 }}>→</Typography>
                  <Typography variant="caption" color="primary.main" fontWeight="medium">
                    {formatCurrency(result.newPrice)}
                  </Typography>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  // Render current step
  const renderCurrentStep = () => {
    switch (step) {
      case 'date':
        return renderDateStep();
      case 'confirm':
        return renderConfirmStep();
      case 'result':
        return renderResultStep();
      default:
        return renderDateStep();
    }
  };

  // Get dialog actions based on current step
  const getDialogActions = () => {
    switch (step) {
      case 'date':
        return null; // No actions needed, close button is in header
      
      case 'confirm':
        return (
          <>
            <Button onClick={() => setStep('date')}>
              Quay lại
            </Button>
            <Button
              variant="contained"
              onClick={handleBulkUpdate}
              disabled={loading || assetsWithData.length === 0}
              startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật giá'}
            </Button>
          </>
        );
      
      case 'result':
        return null; // No actions needed, close button is in header
      
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: 500 }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontWeight: 700,
        fontSize: '1.25rem',
        py: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <History sx={{ mr: 1.5, fontSize: '1.5rem' }} />
            Cập nhật giá theo ngày lịch sử
          </Box>
          <Button
            onClick={handleClose}
            size="small"
            sx={{ 
              color: 'white',
              minWidth: 'auto',
              p: 1,
              borderRadius: '50%',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              }
            }}
          >
            ✕
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {renderCurrentStep()}
      </DialogContent>
      
      <DialogActions>
        {getDialogActions()}
      </DialogActions>
    </Dialog>
  );
};
