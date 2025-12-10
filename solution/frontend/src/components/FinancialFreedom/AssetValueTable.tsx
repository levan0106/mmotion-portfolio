import React from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { formatCurrency, formatPercentageValue } from '../../utils/format';
import { useTranslation } from 'react-i18next';
import {
  CalculationInputs,
  CalculationResult,
  CalculatedVariableType,
  PaymentType,
  PaymentFrequency,
} from '../../types/financialFreedom.types';
import { calculateFutureValue, calculatePresentValue } from '../../utils/financialFreedomCalculation';

function getPeriodsPerYear(frequency: PaymentFrequency): number {
  switch (frequency) {
    case PaymentFrequency.MONTHLY:
      return 12;
    case PaymentFrequency.QUARTERLY:
      return 4;
    case PaymentFrequency.YEARLY:
      return 1;
    default:
      return 12;
  }
}

export interface YearlyProjectionRow {
  year: number;
  beginningValue: number;
  returnRate: number;
  investmentReturn: number;
  periodicPayment: number;
  totalCapital: number; // Vốn góp = Vốn ban đầu + thanh toán định kỳ cộng dồn
  endingValue: number;
  endingValueAfterInflation: number;
}

interface AssetValueTableProps {
  inputs: CalculationInputs;
  result: CalculationResult;
  baseCurrency?: string;
}

export const AssetValueTable: React.FC<AssetValueTableProps> = ({
  inputs,
  result,
  baseCurrency = 'VND',
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Calculate yearly projections with detailed breakdown
  const calculateYearlyBreakdown = (): YearlyProjectionRow[] => {
    const rows: YearlyProjectionRow[] = [];
    
    let initialInvestment = inputs.initialInvestment || 0;
    if (result.calculatedVariable.type === CalculatedVariableType.INITIAL_INVESTMENT) {
      initialInvestment = result.calculatedVariable.value;
    }
    
    // Get periodic payment with correct sign - MUST match calculateFinancialFreedom logic
    // Chỉ lấy giá trị từ inputs, không lấy từ calculatedVariable vì bảng hiển thị giá trị người dùng nhập
    let periodicPayment: number;
    console.log('inputs.periodicPayment', inputs.periodicPayment);
    console.log('inputs.paymentType', inputs.paymentType);
    console.log('inputs.paymentFrequency', inputs.paymentFrequency);
    console.log('inputs.expectedReturnRate', inputs.expectedReturnRate);
    console.log('inputs.investmentYears', inputs.investmentYears);
    console.log('inputs.inflationRate', inputs.inflationRate);
    console.log('inputs.initialInvestment', inputs.initialInvestment);
    console.log('result.calculatedVariable.type', result.calculatedVariable.type);
    console.log('result.calculatedVariable.value', result.calculatedVariable.value);
    if (inputs.periodicPayment !== undefined && inputs.periodicPayment !== null && inputs.periodicPayment !== 0) {
      periodicPayment = inputs.periodicPayment;
      if (inputs.paymentType === PaymentType.WITHDRAWAL && periodicPayment > 0) {
        periodicPayment = -periodicPayment;
      } else if (inputs.paymentType === PaymentType.CONTRIBUTION && periodicPayment < 0) {
        periodicPayment = Math.abs(periodicPayment);
      }
    } else {
      // Nếu người dùng không nhập periodicPayment, hiển thị 0 trong bảng
      // (không lấy từ calculatedVariable vì đó là giá trị tính toán, không phải giá trị người dùng nhập)
      periodicPayment = 0;
    }
    
    // Get return rate
    let returnRate: number;
    if (result.calculatedVariable.type === CalculatedVariableType.RETURN_RATE) {
      returnRate = result.calculatedVariable.value;
    } else {
      returnRate = inputs.expectedReturnRate || 12; // Default 12%
    }
    
    // Get investment years
    let investmentYears: number;
    if (result.calculatedVariable.type === CalculatedVariableType.YEARS) {
      investmentYears = result.calculatedVariable.value;
    } else {
      investmentYears = inputs.investmentYears || 10;
    }
    
    // Get periods per year - MUST match calculateFinancialFreedom logic
    // Quan trọng: Chỉ sử dụng paymentFrequency nếu người dùng thực sự nhập periodicPayment
    // Nếu periodicPayment để trống (undefined/null), không sử dụng paymentFrequency
    let periodsPerYear: number;
    let returnRatePerPeriod: number;
    
    // Kiểm tra dựa trên inputs.periodicPayment (giá trị người dùng nhập), không phải periodicPayment đã xử lý
    const hasUserEnteredPeriodicPayment = inputs.periodicPayment !== undefined && 
                                         inputs.periodicPayment !== null && 
                                         inputs.periodicPayment !== 0;
    
    if (!hasUserEnteredPeriodicPayment) {
      // Không có periodicPayment từ người dùng → tính theo năm
      periodsPerYear = 1;
      returnRatePerPeriod = returnRate / 100;
    } else {
      // Có periodicPayment từ người dùng → sử dụng paymentFrequency
      periodsPerYear = getPeriodsPerYear(inputs.paymentFrequency);
      returnRatePerPeriod = returnRate / 100 / periodsPerYear;
    }
    
    const inflationRate = inputs.inflationRate || 4.5;
    
    for (let year = 0; year <= investmentYears; year++) {
      const periods = year * periodsPerYear;
      
      // Calculate beginning value (value at start of year)
      const beginningValue = year === 0 
        ? initialInvestment 
        : calculateFutureValue(initialInvestment, periodicPayment, returnRatePerPeriod, (year - 1) * periodsPerYear);
      
      // Calculate ending value (value at end of year)
      const endingValue = calculateFutureValue(initialInvestment, periodicPayment, returnRatePerPeriod, periods);
      
      // Calculate investment return for this year
      // Investment return = (ending value - beginning value) - periodic payments made during the year
      // This represents the return earned on the beginning value plus returns on periodic payments
      // Year 0 has no periodic payments (it's the starting year)
      // Use absolute value for contributions calculation (contributions are always positive)
      const periodicPaymentAbsolute = Math.abs(periodicPayment);
      const periodicPaymentsForYear = year === 0 ? 0 : periodicPaymentAbsolute * periodsPerYear;
      
      // More accurate calculation: investment return is the growth from beginning value and periodic payments
      // endingValue = beginningValue * (1+r)^n + PMT * [((1+r)^n - 1)/r]
      // investmentReturn = endingValue - beginningValue - periodicPaymentsForYear
      // Note: Use original periodicPayment (with sign) for return calculation, but absolute value for contributions
      let investmentReturn: number;
      if (returnRatePerPeriod === 0) {
        investmentReturn = 0; // No return if rate is 0
      } else {
        // Calculate the return: ending value minus beginning value minus periodic payments (with sign)
        // Use periodicPayment (with sign) because withdrawals reduce the return
        const periodicPaymentsForReturn = year === 0 ? 0 : periodicPayment * periodsPerYear;
        investmentReturn = endingValue - beginningValue - periodicPaymentsForReturn;
      }
      
      // Calculate ending value after inflation
      const endingValueAfterInflation = calculatePresentValue(endingValue, inflationRate, year);
      
      // Calculate total capital (cumulative: initial investment + periodic payments)
      // Vốn góp = Vốn ban đầu + (thanh toán định kỳ * số kỳ đã qua)
      // Use absolute value because contributions are always positive (even for withdrawals, we show total contributed)
      const totalCapital = initialInvestment + (periodicPaymentAbsolute * periods);
      
      rows.push({
        year,
        beginningValue,
        returnRate,
        investmentReturn: Math.max(0, investmentReturn), // Ensure non-negative for display
        periodicPayment: periodicPaymentsForYear,
        totalCapital,
        endingValue,
        endingValueAfterInflation,
      });
    }
    
    return rows;
  };

  const rows = calculateYearlyBreakdown();

  return (
    <Box>
      <ResponsiveTypography variant="h6" sx={{ mb: 2 }}>
        {t('financialFreedom.chart.assetValueOverTime')}
      </ResponsiveTypography>
      <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
        <Table stickyHeader size={isMobile ? 'small' : 'medium'} sx={{ '& .MuiTableCell-root': { fontSize: isMobile ? '0.75rem!important' : '0.875rem!important' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, backgroundColor: theme.palette.grey[100], fontSize: isMobile ? '0.75rem!important' : '0.875rem!important' }}>
                {t('financialFreedom.table.year')}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: theme.palette.grey[100], fontSize: isMobile ? '0.75rem!important' : '0.875rem!important' }}>
                {t('financialFreedom.table.beginningValue')}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: theme.palette.grey[100], fontSize: isMobile ? '0.75rem!important' : '0.875rem!important' }}>
                {t('financialFreedom.table.returnRate')}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: theme.palette.grey[100], fontSize: isMobile ? '0.75rem!important' : '0.875rem!important' }}>
                {t('financialFreedom.table.investmentReturn')}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: theme.palette.grey[100], fontSize: isMobile ? '0.75rem!important' : '0.875rem!important' }}>
                {t('financialFreedom.table.periodicPayment')}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: theme.palette.grey[100], fontSize: isMobile ? '0.75rem!important' : '0.875rem!important' }}>
                {t('financialFreedom.table.totalCapital')}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: theme.palette.grey[100], fontSize: isMobile ? '0.75rem!important' : '0.875rem!important' }}>
                {t('financialFreedom.table.endingValue')}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: theme.palette.grey[100], fontSize: isMobile ? '0.75rem!important' : '0.875rem!important' }}>
                {t('financialFreedom.table.endingValueAfterInflation')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.year} hover>
                <TableCell>{row.year}</TableCell>
                <TableCell align="right">
                  {formatCurrency(row.beginningValue, baseCurrency)}
                </TableCell>
                <TableCell align="right">
                  {formatPercentageValue(row.returnRate, 2)}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(row.investmentReturn, baseCurrency)}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(row.periodicPayment, baseCurrency)}
                </TableCell>
                <TableCell align="right">
                  
                    {formatCurrency(row.totalCapital, baseCurrency)}
                  
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={600}>
                    {formatCurrency(row.endingValue, baseCurrency)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="primary.main" fontWeight={600}>
                    {formatCurrency(row.endingValueAfterInflation, baseCurrency)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

