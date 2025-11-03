import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  AccountBalance,
  PieChart,
  AttachMoney,
  ShowChart,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate, formatNumber, formatPercentage, formatPercentageValue } from '../../utils/format';
import { InvestorReportData } from '../../types/investor-report.types';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import ResponsiveTable from '../Common/ResponsiveTable';
import ResponsiveCard from '../Common/ResponsiveCard';

interface InvestorReportProps {
  data: InvestorReportData;
  loading?: boolean;
  error?: string | null;
}

const InvestorReport: React.FC<InvestorReportProps> = ({ 
  data,
  loading = false,
  error = null
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Alert severity="error">
        {error || t('investorReport.error.loadFailed', 'Không thể tải báo cáo đầu tư. Vui lòng thử lại sau.')}
      </Alert>
    );
  }

  // Map English asset types to Vietnamese
  const getAssetTypeVietnamese = (assetType: string) => {
    const mapping = {
      'STOCK': 'Cổ phiếu',
      'BOND': 'Trái phiếu', 
      'GOLD': 'Vàng',
      'CASH': 'Tiền mặt',
      'DEPOSITS': 'Tiền gửi',
      'CRYPTO': 'Crypto',
      'REALESTATE': 'Bất động sản',
      'COMMODITY': 'Hàng hóa',
      'OTHER': 'Khác',
      'ETF': 'ETF',
    };
    return mapping[assetType.toUpperCase() as keyof typeof mapping] || assetType;
  };

  const getAssetTypeColor = (assetType: string) => {
    const vietnameseType = getAssetTypeVietnamese(assetType);
    const colors = {
      'Cổ phiếu': theme.palette.primary.main,
      'Trái phiếu': theme.palette.secondary.main,
      'Vàng': theme.palette.warning.main,
      'Tiền gửi': theme.palette.info.main,
      'Tiền mặt': theme.palette.success.main,
      'Crypto': theme.palette.error.main,
      'Bất động sản': theme.palette.secondary.main,
      'Hàng hóa': theme.palette.warning.main,
      'Khác': theme.palette.grey[500],
    };
    return colors[vietnameseType as keyof typeof colors] || theme.palette.grey[500];
  };

  return (
    <Box sx={{ backgroundColor: 'background.paper', px:{xs:0, md:2}}}>
      {/* Header */}
      <Box mb={2} px={{xs:1, md:0}} pt={{xs:1, sm:0}}>
        <Box display="flex" flexDirection="column" gap={1}>
          
          {/* Growth Metrics - Right aligned like "Cập nhật lần cuối" */}
          {data.performance && (
            <Box justifyContent="flex-end" sx={{ display: { xs: 'none', sm: 'flex' } }}>
              <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                <Box display="flex" alignItems="center" gap={0.5}>
                  <ResponsiveTypography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  {data.lastUpdated && formatDate(data.lastUpdated) !== formatDate(new Date()) 
                                    ? t('investorView.lastestDaily', 'Gần nhất')
                                    : t('investorView.daily', 'Hôm nay')
                                    }:
                  </ResponsiveTypography>
                  <ResponsiveTypography 
                    variant="caption" 
                    color={(data.performance.dailyGrowth || 0) >= 0 ? 'success.main' : 'error.main'} 
                    fontWeight="bold" 
                    sx={{ fontSize: '0.7rem' }}
                  >
                    {formatPercentageValue(data.performance.dailyGrowth || 0, 2)} 
                  </ResponsiveTypography>
                </Box>
                
                <Box display="flex" alignItems="center" gap={0.5}>
                  <ResponsiveTypography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    {t('investorReport.monthlyGrowth', 'Tháng này')}:
                  </ResponsiveTypography>
                  <ResponsiveTypography 
                    variant="caption" 
                    color={(data.performance.monthlyGrowth || 0) >= 0 ? 'success.main' : 'error.main'} 
                    fontWeight="bold" 
                    sx={{ fontSize: '0.7rem' }}
                  >
                    {formatPercentageValue(data.performance.monthlyGrowth || 0, 2)}
                  </ResponsiveTypography>
                </Box>
                
                <Box display="flex" alignItems="center" gap={0.5}>
                  <ResponsiveTypography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    {t('investorReport.ytdGrowth', 'Từ đầu năm')}:
                  </ResponsiveTypography>
                  <ResponsiveTypography 
                    variant="caption" 
                    color={(data.performance.ytdGrowth || 0) >= 0 ? 'success.main' : 'error.main'} 
                    fontWeight="bold" 
                    sx={{ fontSize: '0.7rem' }}
                  >
                    {formatPercentageValue(data.performance.ytdGrowth || 0, 2)}
                  </ResponsiveTypography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
        <Box display="flex" justifyContent="flex-end">
          <ResponsiveTypography variant="caption" color="text.secondary">
            {t('investorReport.lastUpdated', 'Cập nhật lần cuối')}: {formatDate(data.lastUpdated, 'dd/MM/yyyy')}
          </ResponsiveTypography>
        </Box>
      </Box>

      {/* Summary Cards - Responsive Layout */}
      <Box sx={{ mb: 3 }}>
        {/* Desktop: Grid Layout */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ mb: 1 }}>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                      <AccountBalance color="primary" sx={{ fontSize: 32 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <ResponsiveTypography variant="cardTitle" sx={{ mb: 0.5 }}>
                        {t('investorReport.totalValue', 'Tổng giá trị danh mục')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardValue" color="primary" sx={{ mb: 0.5 }}>
                        {formatCurrency(data.totalValue)}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardSubtitle" color="text.secondary">
                        {t('investorReport.totalValueDesc', 'Tổng tài sản quỹ')}
                      </ResponsiveTypography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ mb: 1 }}>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                      <PieChart color="info" sx={{ fontSize: 32 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <ResponsiveTypography variant="cardTitle" sx={{ mb: 0.5 }}>
                        {t('investorReport.investmentAssets', 'Tiền đầu tư')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardValue" color="warning.main" sx={{ mb: 0.5 }}>
                        {formatCurrency(data.assetValue)}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardSubtitle" color="text.secondary">
                        {formatPercentage(data.summary.assetPercentage)} {t('investorReport.ofTotal', 'tổng tài sản')}
                      </ResponsiveTypography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ mb: 1 }}>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                      <AttachMoney color="success" sx={{ fontSize: 32 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <ResponsiveTypography variant="cardTitle" sx={{ mb: 0.5 }}>
                        {t('investorReport.cashBalance', 'Tiền mặt')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardValue" color="success.main" sx={{ mb: 0.5 }}>
                        {formatCurrency(data.cashBalance)}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardSubtitle" color="text.secondary">
                        {formatPercentage(data.summary.cashPercentage)} {t('investorReport.ofTotal', 'tổng tài sản')}
                      </ResponsiveTypography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ mb: 1 }} >
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                      <ShowChart color="warning" sx={{ fontSize: 32 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <ResponsiveTypography variant="cardTitle" sx={{ mb: 0.5 }}>
                        {t('investorReport.deposits', 'Tiền gửi')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardValue" color="info.main" sx={{ mb: 0.5 }}>
                        {formatCurrency(data.summary.depositsValue || 0)}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardSubtitle" color="text.secondary">
                        {formatPercentage(data.summary.depositsPercentage || 0)} {t('investorReport.ofTotal', 'tổng tài sản')}
                      </ResponsiveTypography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Mobile: 2-Column List Layout */}
        <Box sx={{ display: { xs: 'block', md: 'none' },p:{xs:1, md:2} }}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Grid container spacing={2}>
                {/* Cột 1 */}
                <Grid item xs={6}>
                  {/* Tổng giá trị danh mục */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <AccountBalance color="primary" sx={{ fontSize: 20, mr: 1 }} />
                    <Box sx={{ flex: 1 }}>
                      <ResponsiveTypography variant="cardTitle" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {t('investorReport.totalValue', 'Tổng giá trị')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardValue" color="primary" fontWeight="600" sx={{ fontSize: '0.9rem' }}>
                        {formatCurrency(data.totalValue)}
                      </ResponsiveTypography>
                    </Box>
                  </Box>

                  {/* Tiền mặt */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AttachMoney color="success" sx={{ fontSize: 20, mr: 1 }} />
                    <Box sx={{ flex: 1 }}>
                      <ResponsiveTypography variant="cardTitle" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {t('investorReport.cashBalance', 'Tiền mặt')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardValue" color="success.main" fontWeight="600" sx={{ fontSize: '0.9rem' }}>
                        {formatCurrency(data.cashBalance)}
                      </ResponsiveTypography>
                    </Box>
                  </Box>
                </Grid>

                {/* Cột 2 */}
                <Grid item xs={6}>
                  {/* Tiền đầu tư */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <PieChart color="info" sx={{ fontSize: 20, mr: 1 }} />
                    <Box sx={{ flex: 1 }}>
                      <ResponsiveTypography variant="cardTitle" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {t('investorReport.investmentAssets', 'Tiền đầu tư')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardValue" color="warning.main" fontWeight="600" sx={{ fontSize: '0.9rem' }}>
                        {formatCurrency(data.assetValue)}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }} desktopOnly >
                        {formatPercentage(data.summary.assetPercentage)} {t('investorReport.ofTotal', 'tổng')}
                      </ResponsiveTypography>
                    </Box>
                  </Box>

                  {/* Tiền gửi */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ShowChart color="warning" sx={{ fontSize: 20, mr: 1 }} />
                    <Box sx={{ flex: 1 }}>
                      <ResponsiveTypography variant="cardTitle" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {t('investorReport.deposits', 'Tiền gửi')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardValue" color="info.main" fontWeight="600" sx={{ fontSize: '0.9rem' }}>
                        {formatCurrency(data.summary.depositsValue || 0)}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }} desktopOnly>
                        {formatPercentage(data.summary.depositsPercentage || 0)} {t('investorReport.ofTotal', 'tổng')}
                      </ResponsiveTypography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              {/* Performance Metrics - Mobile Full Width */}
              {data.performance && (
                <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.8rem', fontWeight: 600 }}>
                    {t('investorReport.performance', 'Hiệu suất')}
                  </ResponsiveTypography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                      <ResponsiveTypography 
                        variant="body1" 
                        color={(data.performance.dailyGrowth || 0) >= 0 ? 'success.main' : 'error.main'} 
                        fontWeight="600" 
                        sx={{ fontSize: '0.9rem' }}
                      >
                        {formatPercentageValue(data.performance.dailyGrowth || 0, 2)}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      {data.lastUpdated && formatDate(data.lastUpdated) !== formatDate(new Date()) 
                                    ? t('investorView.lastestDaily', 'Gần nhất')
                                    : t('investorView.daily', 'Hôm nay')
                                    }
                      </ResponsiveTypography>
                    </Box>
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                      <ResponsiveTypography 
                        variant="body1" 
                        color={(data.performance.monthlyGrowth || 0) >= 0 ? 'success.main' : 'error.main'} 
                        fontWeight="600" 
                        sx={{ fontSize: '0.9rem' }}
                      >
                        {formatPercentageValue(data.performance.monthlyGrowth || 0, 2)}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {t('investorReport.monthlyGrowth', 'Tháng này')}
                      </ResponsiveTypography>
                    </Box>
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                      <ResponsiveTypography 
                        variant="body1" 
                        color={(data.performance.ytdGrowth || 0) >= 0 ? 'success.main' : 'error.main'} 
                        fontWeight="600" 
                        sx={{ fontSize: '0.9rem' }}
                      >
                        {formatPercentageValue(data.performance.ytdGrowth || 0, 2)}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {t('investorReport.ytdGrowth', 'Từ đầu năm')}
                      </ResponsiveTypography>
                    </Box>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* <Divider sx={{ mb: 1 }} /> */}
      
      {/* Asset Allocation by Type */}
      <ResponsiveCard
        variant="transparent"
        size="medium"
        spacing="medium"
        hoverable={false}
        title={t('investorReport.assetAllocation', 'Phân bổ tài sản theo loại')}
        sx={{ 
          padding: '0 !important',
          '& .MuiCardContent-root': {
            padding: '0 !important',
          },
          '& .MuiCard-root': {
            padding: '0 !important',
          },
          '& .MuiPaper-root': {
            padding: '0 !important',
          }
         }}
      >
        <ResponsiveTable
          hoverable={false}
          columns={[
              {
                key: 'assetType',
                header: t('investorReport.assetType', 'Loại tài sản'),
                render: (allocation: any) => (
                  <Box display="flex" alignItems="center">
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: getAssetTypeColor(allocation.assetType),
                        mr: 1,
                      }}
                    />
                    {getAssetTypeVietnamese(allocation.assetType)}
                  </Box>
                ),
              },
              {
                key: 'value',
                header: t('investorReport.value', 'Giá trị'),
                align: 'right',
                render: (allocation: any) => (
                  <ResponsiveTypography variant="tableCell" fontWeight="medium">
                    {formatCurrency(allocation.value)}
                  </ResponsiveTypography>
                ),
              },
              {
                key: 'percentage',
                header: t('investorReport.percentage', 'Tỷ lệ'),
                align: 'right',
                render: (allocation: any) => (
                  <Chip
                    label={formatPercentage(allocation.percentage)}
                    size="small"
                    sx={{
                      backgroundColor: alpha(getAssetTypeColor(allocation.assetType), 0.1),
                      color: getAssetTypeColor(allocation.assetType),
                    }}
                  />
                ),
              },
              {
                key: 'count',
                header: t('investorReport.count', 'Số lượng'),
                align: 'right',
                cellSx: { display: { xs: 'none', sm: 'table-cell' } },
                render: (allocation: any) => (
                  <ResponsiveTypography variant="tableCell">
                    {allocation.count} {t('investorReport.positions', 'vị thế')}
                  </ResponsiveTypography>
                ),
              },
            ]}
            data={data.assetAllocation}
            size="small"
          />
      </ResponsiveCard>
      
      {/* <Divider sx={{ mb: 1 }} /> */}

      {/* Asset Details */}
      <ResponsiveCard
        variant="transparent"
        size="medium"
        spacing="medium"
        hoverable={false}
        title={t('investorReport.assetDetails', 'Chi tiết tài sản')}
        sx={{ 
          padding: '0 !important',
          '& .MuiCardContent-root': {
            padding: '0 !important',
          },
          '& .MuiCard-root': {
            padding: '0 !important',
          },
          '& .MuiPaper-root': {
            padding: '0 !important',
          }
         }}
      >
        <ResponsiveTable
          hoverable={false}
          columns={[
              {
                key: 'symbol',
                header: t('investorReport.symbol', 'Mã'),
                render: (asset: any) => (
                  <ResponsiveTypography variant="tableCell" fontWeight="medium">
                    {asset.symbol}
                  </ResponsiveTypography>
                ),
              },
              {
                key: 'type',
                header: t('investorReport.type', 'Loại'),
                render: (asset: any) => (
                  <Chip 
                    label={getAssetTypeVietnamese(asset.assetType)}
                    size="small"
                    sx={{
                      fontSize: {xs: '0.6rem', sm: '0.9rem'},
                      height: 24,
                      padding: '0 4px',
                      backgroundColor: alpha(getAssetTypeColor(asset.assetType), 0.1),
                      color: getAssetTypeColor(asset.assetType),
                    }}
                  />
                ),
              },
              {
                key: 'quantity',
                header: t('investorReport.quantity', 'Số lượng'),
                align: 'right',
                render: (asset: any) => (
                  <ResponsiveTypography variant="tableCell">
                    {formatNumber(asset.quantity, asset.assetType === 'CRYPTO' ? 5 : 1)}
                  </ResponsiveTypography>
                ),
              },
              {
                key: 'price',
                header: t('investorReport.price', 'Giá hiện tại'),
                align: 'right',
                cellSx: { display: { xs: 'none', sm: 'table-cell' } },
                render: (asset: any) => (
                  <ResponsiveTypography variant="tableCell">
                    {formatCurrency(asset.currentPrice)}
                  </ResponsiveTypography>
                ),
              },
              {
                key: 'value',
                header: t('investorReport.value', 'Giá trị'),
                align: 'right',
                render: (asset: any) => (
                  <ResponsiveTypography variant="tableCell" fontWeight="medium">
                    {formatCurrency(asset.currentValue)}
                  </ResponsiveTypography>
                ),
              },
              {
                key: 'percentage',
                header: t('investorReport.percentage', 'Tỷ lệ'),
                align: 'right',
                cellSx: { display: { xs: 'none', sm: 'table-cell' } },
                render: (asset: any) => (
                  <ResponsiveTypography variant="tableCell">
                    {formatPercentage(asset.percentage)}
                  </ResponsiveTypography>
                ),
              },
              {
                key: 'unrealizedPl',
                header: t('investorReport.unrealizedPl', 'Lãi/Lỗ chưa thực hiện'),
                align: 'right',
                cellSx: { display: { xs: 'none', sm: 'table-cell' } },
                render: (asset: any) => (
                  <ResponsiveTypography
                    variant="tableCell"
                    sx={{ color: asset.unrealizedPl >= 0 ? 'success.main' : 'error.main' }}
                  >
                    {asset.unrealizedPl >= 0 ? '+' : ''}{formatCurrency(asset.unrealizedPl)}
                  </ResponsiveTypography>
                ),
              },
            ]}
            data={data.assetDetails}
            size="small"
          />
      </ResponsiveCard>

      {/* <Divider sx={{ mb: 1 }} /> */}

      {data.deposits && data.deposits.length > 0 && (
        <ResponsiveCard
        variant="transparent"
        size="medium"
        spacing="medium"
        hoverable={false}
        title={t('investorReport.depositsDetails', 'Chi tiết tiền gửi')}
        sx={{ 
          padding: '0 !important',
          '& .MuiCardContent-root': {
            padding: '0 !important',
          },
          '& .MuiCard-root': {
            padding: '0 !important',
          },
          '& .MuiPaper-root': {
            padding: '0 !important',
          }
         }}
      >
          <ResponsiveTable
            hoverable={false}
            columns={[
                {
                  key: 'bankName',
                  header: t('investorReport.bankName', 'Ngân hàng'),
                  render: (deposit: any) => (
                    <ResponsiveTypography variant="tableCell">
                      {deposit.bankName}
                    </ResponsiveTypography>
                  ),
                },
                {
                  key: 'principal',
                  header: t('investorReport.principal', 'Số tiền gốc'),
                  align: 'right',
                  cellSx: { display: { xs: 'none', sm: 'table-cell' } },
                  render: (deposit: any) => (
                    <ResponsiveTypography variant="tableCell" fontWeight="medium">
                      {formatCurrency(deposit.principal)}
                    </ResponsiveTypography>
                  ),
                },
                {
                  key: 'interestRate',
                  header: t('investorReport.interestRate', 'Lãi suất (%)'),
                  align: 'right',
                  render: (deposit: any) => (
                    <ResponsiveTypography variant="tableCell" color="success.main">
                      {typeof deposit.interestRate === 'number' ? deposit.interestRate.toFixed(2) : (parseFloat(deposit.interestRate) || 0).toFixed(2)}%
                    </ResponsiveTypography>
                  ),
                },
                {
                  key: 'totalValue',
                  header: t('investorReport.totalValueWithInterest', 'Tổng vốn và lãi'),
                  align: 'right',
                  render: (deposit: any) => (
                    <ResponsiveTypography variant="tableCell" fontWeight="medium" color="primary.main">
                      {formatCurrency(deposit.totalValue)}
                    </ResponsiveTypography>
                  ),
                },
                {
                  key: 'status',
                  header: t('investorReport.status', 'Trạng thái'),
                  cellSx: { display: { xs: 'none', sm: 'table-cell' } },
                  render: (deposit: any) => (
                    <Chip
                      label={deposit.status}
                      size="small"
                      color={deposit.status === 'ACTIVE' ? 'success' : 'default'}
                      variant={deposit.status === 'ACTIVE' ? 'filled' : 'outlined'}
                    />
                  ),
                },
                {
                  key: 'startDate',
                  header: t('investorReport.startDate', 'Ngày bắt đầu'),
                  cellSx: { display: { xs: 'none', sm: 'table-cell' } },
                  render: (deposit: any) => (
                    <ResponsiveTypography variant="tableCell">
                      {new Date(deposit.startDate).toLocaleDateString('vi-VN')}
                    </ResponsiveTypography>
                  ),
                },
                {
                  key: 'endDate',
                  header: t('investorReport.endDate', 'Ngày kết thúc'),
                  render: (deposit: any) => (
                    <ResponsiveTypography variant="tableCell">
                      {deposit.endDate ? new Date(deposit.endDate).toLocaleDateString('vi-VN') : 'Không xác định'}
                    </ResponsiveTypography>
                  ),
                },
              ]}
              data={data.deposits}
              size="small"
            />
          </ResponsiveCard>
      )}
    </Box>
  );
};

export default InvestorReport;
