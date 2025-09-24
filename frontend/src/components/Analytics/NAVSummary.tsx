import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  InfoOutlined,
  AccountBalance
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/format';

interface NAVSummaryProps {
  navValue: number;
  totalValue: number;
  baseCurrency: string;
  isFund?: boolean;
  totalOutstandingUnits?: number;
  navPerUnit?: number;
  isCompactMode?: boolean;
  getUltraSpacing?: (normal: number, compact: number) => number;
}

const NAVSummary: React.FC<NAVSummaryProps> = ({
  navValue,
  baseCurrency,
  isFund = false,
  totalOutstandingUnits = 1,
  navPerUnit: propNavPerUnit,
  isCompactMode = false,
  getUltraSpacing = (normal) => normal
}) => {
  // Calculate NAV per unit
  const navPerUnit = propNavPerUnit || (totalOutstandingUnits > 0 ? navValue / totalOutstandingUnits : navValue);
  
  // Calculate growth/decline indicators
  const isGrowing = navValue > 0;
  const growthIndicator = isGrowing ? 'Tăng trưởng' : 'Suy giảm';
  const growthColor = isGrowing ? 'success' : 'error';
  const GrowthIcon = isGrowing ? TrendingUp : TrendingDown;

  return (
    <Card sx={{ 
      mb: getUltraSpacing(3, 1),
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      border: '1px solid #dee2e6',
      borderRadius: 2
    }}>
      <CardContent sx={{ p: getUltraSpacing(2, 1.5) }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: getUltraSpacing(2, 1)
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalance color="primary" sx={{ fontSize: 24 }} />
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: 'text.primary',
              fontSize: isCompactMode ? '1rem' : '1.25rem'
            }}>
              NAV Summary
            </Typography>
          </Box>
          
          <Chip
            icon={<GrowthIcon />}
            label={growthIndicator}
            color={growthColor}
            size="small"
            sx={{ 
              fontWeight: 600,
              fontSize: isCompactMode ? '0.7rem' : '0.75rem'
            }}
          />
        </Box>

        {/* NAV Information Grid */}
        <Grid container spacing={getUltraSpacing(2, 1)}>
          {/* NAV Total */}
          <Grid item xs={12} md={isFund ? 6 : 12}>
            <Box sx={{
              p: getUltraSpacing(1.5, 1),
              backgroundColor: 'white',
              borderRadius: 1.5,
              border: '1px solid #e9ecef',
              textAlign: 'center'
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ 
                fontSize: isCompactMode ? '0.7rem' : '0.75rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}>
                NAV Tổng
              </Typography>
              <Typography variant="h5" sx={{ 
                fontWeight: 700,
                color: 'primary.main',
                fontSize: isCompactMode ? '1.1rem' : '1.5rem',
                mt: 0.5
              }}>
                {formatCurrency(navValue, baseCurrency)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ 
                fontSize: isCompactMode ? '0.65rem' : '0.7rem',
                fontStyle: 'italic'
              }}>
                Đánh giá quỹ {growthIndicator.toLowerCase()}
              </Typography>
            </Box>
          </Grid>

          {/* NAV per Unit (only for funds) */}
          {isFund && (
            <Grid item xs={12} md={6}>
            <Box sx={{
              p: getUltraSpacing(1.5, 1),
              backgroundColor: 'white',
              borderRadius: 1.5,
              border: '1px solid #e9ecef',
              textAlign: 'center',
              position: 'relative'
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ 
                fontSize: isCompactMode ? '0.7rem' : '0.75rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}>
                NAV/Unit
              </Typography>
              <Typography variant="h5" sx={{ 
                fontWeight: 700,
                color: 'secondary.main',
                fontSize: isCompactMode ? '1.1rem' : '1.5rem',
                mt: 0.5
              }}>
                {formatCurrency(navPerUnit, baseCurrency)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ 
                fontSize: isCompactMode ? '0.65rem' : '0.7rem',
                fontStyle: 'italic'
              }}>
                Lợi ích mỗi NĐT
              </Typography>
              
              {/* Info Tooltip for NAV/Unit */}
              <Tooltip 
                title="NAV/Unit = NAV Tổng ÷ Số đơn vị quỹ đang lưu hành. Thể hiện lợi ích của mỗi nhà đầu tư."
                arrow
                placement="top"
              >
                <IconButton 
                  size="small" 
                  sx={{ 
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    p: 0.5
                  }}
                >
                  <InfoOutlined sx={{ fontSize: 14, color: 'text.secondary' }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
          )}
        </Grid>

        {/* Additional Information */}
        <Box sx={{ 
          mt: getUltraSpacing(1.5, 1),
          p: getUltraSpacing(1, 0.8),
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          borderRadius: 1,
          border: '1px solid rgba(0, 0, 0, 0.05)'
        }}>
          <Typography variant="caption" color="text.secondary" sx={{ 
            fontSize: isCompactMode ? '0.65rem' : '0.7rem',
            display: 'block',
            textAlign: 'center'
          }}>
            💡 <strong>NAV Tổng</strong> = Tiền mặt + Giá trị tài sản | <strong>NAV/Unit</strong> = NAV Tổng ÷ Số đơn vị quỹ
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NAVSummary;
