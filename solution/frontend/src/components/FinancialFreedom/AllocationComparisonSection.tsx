import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { formatPercentageValue } from '../../utils/format';
import { useTranslation } from 'react-i18next';
import { AllocationChart } from './AllocationChart';
import { ASSET_TYPE_TEMPLATES } from '../../config/assetTypeTemplates';
import { useAllocationComparison } from '../../hooks/useAllocationComparison';

interface AllocationComparisonSectionProps {
  planId: string;
  baseCurrency?: string;
}

export const AllocationComparisonSection: React.FC<AllocationComparisonSectionProps> = ({
  planId,
}) => {
  const { t } = useTranslation();
  const { data: comparison, isLoading } = useAllocationComparison(planId);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!comparison) {
    return null;
  }

  // Convert allocation records to format expected by AllocationChart
  // Only include asset types with value > 0
  const convertToAllocationFormat = (allocation: Record<string, number>) => {
    const result: Record<string, number> = {};
    ASSET_TYPE_TEMPLATES.forEach(template => {
      // Map AssetType enum values to template codes
      const assetTypeKey = template.code.toUpperCase();
      const value = allocation[assetTypeKey] || allocation[template.code] || 0;
      // Only include if value > 0
      if (value > 0) {
        result[template.code] = value;
      }
    });
    return result;
  };

  const currentAllocationFormatted = convertToAllocationFormat(comparison.currentAllocation);
  const suggestedAllocationFormatted = convertToAllocationFormat(comparison.suggestedAllocation);

  // Get asset type names for display
  const getAssetTypeName = (assetType: string): string => {
    const template = ASSET_TYPE_TEMPLATES.find(t => 
      t.code.toUpperCase() === assetType || t.code === assetType.toLowerCase()
    );
    return template ? (t('i18n.language') === 'en' ? template.nameEn : template.name) : assetType;
  };

  return (
    <Box>
      <ResponsiveTypography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        {t('financialFreedom.planDetails.allocationComparison.title') || 'So sánh phân bổ tài sản'}
      </ResponsiveTypography>

      {/* Rebalancing Alert */}
      {comparison.needsRebalancing && (
        <Alert 
          severity="warning" 
          icon={<WarningIcon />}
          sx={{ mb: 3 }}
        >
          <AlertTitle>
            {t('financialFreedom.planDetails.allocationComparison.needsRebalancing') || 'Cần điều chỉnh phân bổ'}
          </AlertTitle>
          {t('financialFreedom.planDetails.allocationComparison.rebalancingMessage', {
            count: comparison.significantDeviationsCount,
          }) || `Có ${comparison.significantDeviationsCount} loại tài sản cần điều chỉnh (>5% chênh lệch)`}
        </Alert>
      )}

      {!comparison.needsRebalancing && (
        <Alert 
          severity="success" 
          icon={<CheckCircleIcon />}
          sx={{ mb: 3 }}
        >
          {t('financialFreedom.planDetails.allocationComparison.noRebalancingNeeded') || 'Phân bổ hiện tại phù hợp với kế hoạch'}
        </Alert>
      )}

      {/* Comparison Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <ResponsiveTypography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                {t('financialFreedom.planDetails.allocationComparison.currentAllocation') || 'Phân bổ hiện tại'}
              </ResponsiveTypography>
              <AllocationChart
                allocation={currentAllocationFormatted}
                height={300}
                assetTypes={ASSET_TYPE_TEMPLATES}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <ResponsiveTypography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                {t('financialFreedom.planDetails.allocationComparison.suggestedAllocation') || 'Phân bổ đề xuất'}
              </ResponsiveTypography>
              <AllocationChart
                allocation={suggestedAllocationFormatted}
                height={300}
                assetTypes={ASSET_TYPE_TEMPLATES}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Deviations Table */}
      {comparison.deviations.length > 0 && (
        <Card>
          <CardContent>
            <ResponsiveTypography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              {t('financialFreedom.planDetails.allocationComparison.deviations') || 'Chênh lệch phân bổ'}
            </ResponsiveTypography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      {t('financialFreedom.planDetails.allocationComparison.assetType') || 'Loại tài sản'}
                    </TableCell>
                    <TableCell align="right">
                      {t('financialFreedom.planDetails.allocationComparison.current') || 'Hiện tại'}
                    </TableCell>
                    <TableCell align="right">
                      {t('financialFreedom.planDetails.allocationComparison.suggested') || 'Đề xuất'}
                    </TableCell>
                    <TableCell align="right">
                      {t('financialFreedom.planDetails.allocationComparison.deviation') || 'Chênh lệch'}
                    </TableCell>
                    <TableCell align="center">
                      {t('financialFreedom.planDetails.allocationComparison.status') || 'Trạng thái'}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comparison.deviations
                    .filter(deviation => deviation.currentAllocation > 0 || deviation.suggestedAllocation > 0)
                    .map((deviation) => {
                    const isSignificant = Math.abs(deviation.deviation) > 5;
                    const isOver = deviation.deviation > 0;
                    return (
                      <TableRow key={deviation.assetType}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getAssetTypeName(deviation.assetType)}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {formatPercentageValue(deviation.currentAllocation)}
                        </TableCell>
                        <TableCell align="right">
                          {formatPercentageValue(deviation.suggestedAllocation)}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                            {isOver ? (
                              <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                            ) : (
                              <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                            )}
                            <ResponsiveTypography
                              variant="body2"
                              sx={{
                                color: isOver ? 'error.main' : 'success.main',
                                fontWeight: isSignificant ? 600 : 400,
                              }}
                            >
                              {isOver ? '-' : '+'}{formatPercentageValue(Math.abs(deviation.deviation))}
                            </ResponsiveTypography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          {isSignificant ? (
                            <Chip
                              label={t('financialFreedom.planDetails.allocationComparison.needsAdjustment') || 'Cần điều chỉnh'}
                              color="warning"
                              size="small"
                            />
                          ) : (
                            <Chip
                              label={t('financialFreedom.planDetails.allocationComparison.ok') || 'Ổn định'}
                              color="success"
                              size="small"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {comparison.recommendations.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <ResponsiveTypography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              {t('financialFreedom.planDetails.allocationComparison.recommendations') || 'Khuyến nghị điều chỉnh'}
            </ResponsiveTypography>
            <Box component="ul" sx={{ m: 0, pl: 3 }}>
              {comparison.recommendations.map((recommendation, index) => (
                <Box component="li" key={index} sx={{ mb: 1 }}>
                  <ResponsiveTypography variant="body2">
                    {recommendation}
                  </ResponsiveTypography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

