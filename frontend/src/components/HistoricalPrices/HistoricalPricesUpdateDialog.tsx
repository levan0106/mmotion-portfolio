import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  Grid,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch,
  Chip,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { ResponsiveTypography, ResponsiveButton } from '../Common';
import {
  History as HistoryIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import { useAllGlobalAssets } from '../../hooks/useGlobalAssets';
import { useHistoricalPrices } from '../../hooks/useHistoricalPrices';
import { formatCurrency } from '../../utils/format';

interface GlobalAsset {
  id: string;
  symbol: string;
  name: string;
  type: string;
  currency: string;
  selected: boolean;
  assetPrice?: {
    currentPrice: number;
    priceType: string;
    priceSource: string;
    lastPriceUpdate: string;
  };
}

interface HistoricalPricesUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: any) => void;
}

const HistoricalPricesUpdateDialog: React.FC<HistoricalPricesUpdateDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  // Form state
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [cleanup, setCleanup] = useState<'none' | 'external_api' | 'all'>('external_api');
  
  // Global assets state
  const [globalAssets, setGlobalAssets] = useState<GlobalAsset[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Step management
  const [step, setStep] = useState<'date' | 'assets' | 'confirm' | 'result'>('date');
  const [updateResult, setUpdateResult] = useState<any>(null);

  // Hooks
  const {
    updateHistoricalPrices,
    isUpdating,
    updateError,
    setUpdateError
  } = useHistoricalPrices();

  const {
    data: globalAssetsData,
    isLoading: assetsLoading,
    error: assetsError
  } = useAllGlobalAssets();

  // Load global assets when dialog opens
  useEffect(() => {
    if (open) {
      // Auto fill default dates (last 30 days)
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      setStartDate(thirtyDaysAgo);
      setEndDate(today);
      setForceUpdate(false);
      setCleanup('external_api');
      setShowAdvanced(false);
      setStep('date');
      setUpdateResult(null);
      setUpdateError(null);
      
      // Load global assets
      if (globalAssetsData && globalAssetsData.length > 0) {
        const assetsWithSelection = globalAssetsData.map((asset: any) => ({
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
          type: asset.type,
          currency: asset.currency,
          selected: false,
          assetPrice: asset.assetPrice
        }));
        setGlobalAssets(assetsWithSelection);
      }
    }
  }, [open, globalAssetsData]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      return;
    }

    const selectedAssets = globalAssets.filter(asset => asset.selected);
    if (selectedAssets.length === 0) {
      return;
    }

    const symbolsToUpdate = selectedAssets.map(asset => ({
      symbol: asset.symbol,
      assetType: asset.type
    }));

    try {
      // Clear previous errors
      setUpdateError(null);
      
      const result = await updateHistoricalPrices({
        symbols: symbolsToUpdate,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        forceUpdate,
        cleanup: cleanup
      });

      setUpdateResult(result);
      setStep('result');
    } catch (error) {
      console.error('Failed to update historical prices:', error);
      setUpdateError(error as Error);
      setStep('result');
    }
  };

  // Handle asset selection
  const handleAssetSelection = (assetId: string, selected: boolean) => {
    setGlobalAssets(prev => prev.map(asset => 
      asset.id === assetId ? { ...asset, selected } : asset
    ));
  };

  // Handle select all/none
  const handleSelectAll = (selected: boolean) => {
    setGlobalAssets(prev => prev.map(asset => ({ ...asset, selected })));
  };

  // Get unique asset types
  const getAssetTypes = () => {
    const types = [...new Set(globalAssets.map(asset => asset.type))];
    return types.sort();
  };

  // Handle select all assets by type
  const handleSelectByType = (type: string, selected: boolean) => {
    setGlobalAssets(prev => prev.map(asset => 
      asset.type === type ? { ...asset, selected } : asset
    ));
  };

  // Get selected count by type
  const getSelectedCountByType = (type: string) => {
    const assetsOfType = globalAssets.filter(asset => asset.type === type);
    const selectedOfType = assetsOfType.filter(asset => asset.selected);
    return { total: assetsOfType.length, selected: selectedOfType.length };
  };

  // Get selected assets
  const selectedAssets = globalAssets.filter(asset => asset.selected);

  // Processing state
  const isProcessing = isUpdating;

  // Step configuration
  const steps = [
    {
      label: 'Chọn thời gian',
      icon: <ScheduleIcon />,
      description: 'Chọn khoảng thời gian cần cập nhật giá'
    },
    {
      label: 'Chọn tài sản',
      icon: <AssignmentIcon />,
      description: 'Chọn các tài sản cần cập nhật'
    },
    {
      label: 'Xác nhận',
      icon: <CheckCircleIcon />,
      description: 'Xác nhận thông tin cập nhật'
    },
    {
      label: 'Kết quả',
      icon: <HistoryIcon />,
      description: 'Kết quả cập nhật'
    }
  ];

  const getCurrentStepIndex = () => {
    switch (step) {
      case 'date': return 0;
      case 'assets': return 1;
      case 'confirm': return 2;
      case 'result': return 3;
      default: return 0;
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'date':
        return (
          <Stack spacing={3}>
            <ResponsiveTypography variant="h6" gutterBottom>
              Chọn khoảng thời gian cập nhật
            </ResponsiveTypography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <DatePicker
                  label="Ngày bắt đầu"
                  value={startDate}
                  onChange={(date) => setStartDate(date)}
                  slotProps={{
                    textField: { fullWidth: true }
                  }}
                  maxDate={endDate || new Date()}
                />
              </Grid>
              <Grid item xs={6}>
                <DatePicker
                  label="Ngày kết thúc"
                  value={endDate}
                  onChange={(date) => setEndDate(date)}
                  slotProps={{
                    textField: { fullWidth: true }
                  }}
                  minDate={startDate}
                  maxDate={new Date()}
                />
              </Grid>
            </Grid>
          </Stack>
        );

      case 'assets':
        return (
          <Stack spacing={3}>
            <ResponsiveTypography variant="h6" gutterBottom>
              Chọn tài sản cần cập nhật
            </ResponsiveTypography>
            <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Chọn các tài sản cần cập nhật giá lịch sử. Bạn có thể chọn tất cả hoặc chọn từng tài sản cụ thể.
            </ResponsiveTypography>
            
            {assetsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : assetsError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                Lỗi tải danh sách tài sản: {String(assetsError)}
              </Alert>
            ) : globalAssets.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Không có tài sản nào trong hệ thống
              </Alert>
            ) : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <ResponsiveTypography variant="body2" color="text.secondary">
                    Tổng cộng: {globalAssets.length} tài sản | 
                    Đã chọn: {selectedAssets.length}
                  </ResponsiveTypography>
                  <Box>
                    <ResponsiveButton
                      size="small"
                      icon={<CheckIcon />}
                      mobileText="Chọn tất cả"
                      desktopText="Chọn tất cả"
                      onClick={() => handleSelectAll(true)}
                      sx={{ mr: 1 }}
                    >
                      Chọn tất cả
                    </ResponsiveButton>
                    <ResponsiveButton
                      size="small"
                      icon={<ClearIcon />}
                      mobileText="Bỏ chọn tất cả"
                      desktopText="Bỏ chọn tất cả"
                      onClick={() => handleSelectAll(false)}
                    >
                      Bỏ chọn tất cả
                    </ResponsiveButton>
                  </Box>
                </Box>

                {/* Asset Type Selection */}
                <Box sx={{ mb: 2 }}>
                  <ResponsiveTypography variant="subtitle2" gutterBottom>
                    Chọn theo loại tài sản:
                  </ResponsiveTypography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {getAssetTypes().map(type => {
                      const { total, selected } = getSelectedCountByType(type);
                      const isAllSelected = selected === total;
                      const isPartialSelected = selected > 0 && selected < total;
                      
                      return (
                        <Chip
                          key={type}
                          label={`${type} (${selected}/${total})`}
                          variant={isAllSelected ? "filled" : isPartialSelected ? "outlined" : "outlined"}
                          color={isAllSelected ? "primary" : isPartialSelected ? "primary" : "default"}
                          onClick={() => handleSelectByType(type, !isAllSelected)}
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: isAllSelected ? 'primary.dark' : 'primary.light',
                              color: 'white'
                            }
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>

                <Box sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  {globalAssets.map((asset) => (
                    <Box
                      key={asset.id}
                      sx={{
                        p: 1.5,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        '&:last-child': { borderBottom: 'none' },
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <Checkbox
                          checked={asset.selected}
                          onChange={(e) => handleAssetSelection(asset.id, e.target.checked)}
                          size="small"
                        />
                        <Box sx={{ ml: 1, flex: 1 }}>
                          <ResponsiveTypography 
                            variant="body2" 
                            fontWeight="medium"
                            sx={{ 
                              fontSize: '0.875rem'
                            }}
                          >
                            {asset.symbol} - {asset.name}
                          </ResponsiveTypography>
                          <ResponsiveTypography 
                            variant="caption" 
                            sx={{ 
                              color: 'text.secondary',
                              fontSize: '0.75rem'
                            }}
                          >
                            Loại: {asset.type}
                          </ResponsiveTypography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right', minWidth: 180 }}>
                        {asset.assetPrice ? (
                          <>
                            <ResponsiveTypography 
                              variant="body2"
                              sx={{ 
                                fontSize: '0.875rem',
                                fontWeight: 'medium'
                              }}
                            >
                              Giá hiện tại: {formatCurrency(asset.assetPrice.currentPrice)} {asset.currency}
                            </ResponsiveTypography>
                            <ResponsiveTypography 
                              variant="caption" 
                              sx={{ 
                                color: 'text.secondary',
                                fontSize: '0.75rem'
                              }}
                            >
                              {asset.selected ? 'Đã chọn' : 'Chưa chọn'} • {asset.assetPrice.priceSource}
                            </ResponsiveTypography>
                          </>
                        ) : (
                          <ResponsiveTypography 
                            variant="body2"
                            sx={{ 
                              fontSize: '0.875rem',
                              color: 'text.disabled'
                            }}
                          >
                            {asset.selected ? 'Đã chọn' : 'Chưa chọn'} • Chưa có giá
                          </ResponsiveTypography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Stack>
        );

      case 'confirm':
        return (
          <Stack spacing={3}>
            <ResponsiveTypography variant="h6" gutterBottom>
              Xác nhận cập nhật giá
            </ResponsiveTypography>
            
            <Card>
              <CardContent>
                <ResponsiveTypography variant="subtitle1" gutterBottom>
                  Thông tin cập nhật
                </ResponsiveTypography>
                <Stack spacing={1}>
                  <ResponsiveTypography variant="body2">
                    <strong>Khoảng thời gian:</strong> {startDate?.toLocaleDateString('vi-VN')} - {endDate?.toLocaleDateString('vi-VN')}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="body2">
                    <strong>Số tài sản đã chọn:</strong> {selectedAssets.length} tài sản
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="body2">
                    <strong>Force Update:</strong> {forceUpdate ? 'Có' : 'Không'}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="body2">
                    <strong>Cleanup:</strong> {
                      cleanup === 'none' ? 'Không xóa' :
                      cleanup === 'external_api' ? 'Chỉ xóa External API' :
                      'Xóa toàn bộ'
                    }
                  </ResponsiveTypography>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <ResponsiveTypography variant="subtitle1" gutterBottom>
                  Danh sách tài sản sẽ được cập nhật
                </ResponsiveTypography>
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {selectedAssets.map((asset) => (
                    <Box key={asset.id} sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
                      <ResponsiveTypography variant="body2">
                        {asset.symbol} - {asset.name} ({asset.type})
                      </ResponsiveTypography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Advanced Options */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <ResponsiveButton
                    size="small"
                    icon={<InfoIcon />}
                    mobileText="Tùy chọn nâng cao"
                    desktopText="Tùy chọn nâng cao"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    Tùy chọn nâng cao
                  </ResponsiveButton>
                </Box>

                {showAdvanced && (
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={forceUpdate}
                          onChange={(e) => setForceUpdate(e.target.checked)}
                          name="forceUpdate"
                        />
                      }
                      label={
                        <Box>
                          <ResponsiveTypography variant="body2">
                            Force Update - Luôn thêm record mới (giữ lại lịch sử)
                          </ResponsiveTypography>
                          <ResponsiveTypography variant="caption" color="text.secondary">
                            Nếu chọn, hệ thống sẽ luôn thêm các bản ghi giá mới, giữ lại các bản ghi cũ
                          </ResponsiveTypography>
                        </Box>
                      }
                    />
                    <FormControl fullWidth>
                      <InputLabel>Cleanup Options</InputLabel>
                      <Select
                        value={cleanup}
                        onChange={(e) => setCleanup(e.target.value as 'none' | 'external_api' | 'all')}
                        label="Cleanup Options"
                      >
                        <MenuItem value="none">Thêm nếu chưa tồn tại (giữ dữ liệu cũ)</MenuItem>
                        <MenuItem value="external_api">Chỉ xóa External API (giữ User Input)</MenuItem>
                        <MenuItem value="all">Xóa toàn bộ (xóa tất cả dữ liệu cũ)</MenuItem>
                      </Select>
                    </FormControl>
                    {cleanup !== 'none' && (
                      <Alert severity="warning" icon={<WarningIcon />}>
                        {cleanup === 'external_api' 
                          ? 'Cảnh báo: Sẽ xóa dữ liệu từ External API, giữ lại dữ liệu User Input.'
                          : 'Cảnh báo: Sẽ xóa TẤT CẢ dữ liệu giá lịch sử hiện có trước khi cập nhật.'
                        }
                      </Alert>
                    )}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        );

      case 'result':
        return (
          <Stack spacing={3}>
            <ResponsiveTypography variant="h6" gutterBottom>
              Kết quả cập nhật giá lịch sử
            </ResponsiveTypography>
            
            {updateError ? (
              <Alert severity="error">
                <ResponsiveTypography variant="subtitle2" gutterBottom>
                  Cập nhật thất bại
                </ResponsiveTypography>
                <ResponsiveTypography variant="body2">
                  {updateError.message}
                </ResponsiveTypography>
              </Alert>
            ) : updateResult ? (
              <Stack spacing={2}>
                <Alert severity={updateResult.success > 0 ? "success" : "error"}>
                  <ResponsiveTypography variant="subtitle2" gutterBottom>
                    {updateResult.success > 0 ? "Cập nhật thành công!" : "Cập nhật thất bại"}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="body2">
                    Đã xử lý {updateResult.totalRecords} bản ghi cho {updateResult.success} tài sản.
                  </ResponsiveTypography>
                  {updateResult.failed > 0 && (
                    <ResponsiveTypography variant="body2" color="warning.main">
                      {updateResult.failed} tài sản cập nhật thất bại.
                    </ResponsiveTypography>
                  )}
                </Alert>

                {/* Chi tiết kết quả */}
                <Card>
                  <CardContent>
                    <ResponsiveTypography variant="subtitle2" gutterBottom>
                      Chi tiết kết quả:
                    </ResponsiveTypography>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <ResponsiveTypography variant="body2">Tổng số bản ghi:</ResponsiveTypography>
                        <ResponsiveTypography variant="body2" fontWeight="medium">
                          {updateResult.totalRecords}
                        </ResponsiveTypography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <ResponsiveTypography variant="body2">Thành công:</ResponsiveTypography>
                        <ResponsiveTypography variant="body2" color="success.main" fontWeight="medium">
                          {updateResult.success}
                        </ResponsiveTypography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <ResponsiveTypography variant="body2">Thất bại:</ResponsiveTypography>
                        <ResponsiveTypography variant="body2" color="error.main" fontWeight="medium">
                          {updateResult.failed}
                        </ResponsiveTypography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Danh sách tài sản đã xử lý */}
                {updateResult.processedSymbols && updateResult.processedSymbols.length > 0 && (
                  <Card>
                    <CardContent>
                      <ResponsiveTypography variant="subtitle2" gutterBottom>
                        Tài sản đã xử lý:
                      </ResponsiveTypography>
                      <Stack spacing={1}>
                        {updateResult.processedSymbols.map((symbol: any, index: number) => (
                          <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <ResponsiveTypography variant="body2">{symbol.symbol}</ResponsiveTypography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label={`${symbol.recordCount} bản ghi`} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                              {symbol.dateRange && (
                                <ResponsiveTypography variant="caption" color="text.secondary">
                                  {symbol.dateRange.start} - {symbol.dateRange.end}
                                </ResponsiveTypography>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                {/* Lỗi nếu có */}
                {updateResult.errors && updateResult.errors.length > 0 && (
                  <Card>
                    <CardContent>
                      <ResponsiveTypography variant="subtitle2" gutterBottom color="error">
                        Lỗi chi tiết:
                      </ResponsiveTypography>
                      <Stack spacing={1}>
                        {updateResult.errors.map((error: string, index: number) => (
                          <Alert key={index} severity="error" sx={{ py: 0.5 }}>
                            <ResponsiveTypography variant="body2">{error}</ResponsiveTypography>
                          </Alert>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                )}
              </Stack>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '600px' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon color="primary" />
              <ResponsiveTypography variant="h6">Cập nhật giá lịch sử</ResponsiveTypography>
            </Box>
            <ResponsiveButton
              onClick={onClose}
              color="secondary"
              size="small"
              icon={<CloseIcon />}
              mobileText="Hủy"
              desktopText="Hủy"
              sx={{ minWidth: 'auto', px: 1 }}
            >
              Hủy
            </ResponsiveButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {/* Stepper */}
          <Stepper activeStep={getCurrentStepIndex()} alternativeLabel sx={{ mb: 3 }}>
            {steps.map((stepConfig, index) => (
              <Step key={stepConfig.label}>
                <StepLabel
                  icon={stepConfig.icon}
                  optional={
                    index < getCurrentStepIndex() ? (
                      <Chip label="Hoàn thành" size="small" color="success" />
                    ) : null
                  }
                >
                  {stepConfig.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step Content */}
          {renderStepContent()}
          
        </DialogContent>
        
        <DialogActions>
          {step === 'result' ? (
            <>
              {updateError && (
                <ResponsiveButton
                  onClick={() => {
                    setStep('date');
                    setUpdateError(null);
                    setUpdateResult(null);
                  }}
                  color="secondary"
                  variant="outlined"
                  icon={<RefreshIcon />}
                  mobileText="Thử lại"
                  desktopText="Thử lại"
                  sx={{ mr: 1 }}
                >
                  Thử lại
                </ResponsiveButton>
              )}
              <ResponsiveButton
                onClick={() => {
                  onSuccess?.(updateResult);
                  onClose();
                }}
                color="primary"
                variant="contained"
                icon={<CheckCircleIcon />}
                mobileText="Hoàn thành"
                desktopText="Hoàn thành"
              >
                Hoàn thành
              </ResponsiveButton>
            </>
          ) : (
            <>
              <ResponsiveButton
                onClick={onClose}
                color="inherit"
                icon={<CloseIcon />}
                mobileText="Hủy"
                desktopText="Hủy"
              >
                Hủy
              </ResponsiveButton>
              
              <Box sx={{ flex: 1 }} />
              
              <ResponsiveButton
                onClick={() => {
                  if (step === 'assets') setStep('date');
                  else if (step === 'confirm') setStep('assets');
                }}
                disabled={step === 'date'}
                icon={<ArrowBackIcon />}
                mobileText="Quay lại"
                desktopText="Quay lại"
                sx={{ mr: 1 }}
              >
                Quay lại
              </ResponsiveButton>
              
              <ResponsiveButton
                onClick={() => {
                  if (step === 'date' && startDate && endDate) setStep('assets');
                  else if (step === 'assets' && selectedAssets.length > 0) setStep('confirm');
                  else if (step === 'confirm') handleSubmit();
                }}
                variant="contained"
                icon={step === 'confirm' && isProcessing ? <CircularProgress size={20} color="inherit" /> : <ArrowForwardIcon />}
                mobileText={step === 'confirm' ? (isProcessing ? 'Đang cập nhật...' : 'Xác nhận cập nhật') : 'Tiếp theo'}
                desktopText={step === 'confirm' ? (isProcessing ? 'Đang cập nhật...' : 'Xác nhận cập nhật') : 'Tiếp theo'}
                disabled={
                  (step === 'date' && (!startDate || !endDate)) ||
                  (step === 'assets' && selectedAssets.length === 0) ||
                  (step === 'confirm' && isProcessing)
                }
              >
                {step === 'date' && 'Tiếp theo'}
                {step === 'assets' && 'Tiếp theo'}
                {step === 'confirm' && (isProcessing ? 'Đang cập nhật...' : 'Xác nhận cập nhật')}
              </ResponsiveButton>
            </>
          )}
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default HistoricalPricesUpdateDialog;
