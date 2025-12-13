/**
 * Balance Sheet Flow Chart Component
 * Displays financial blocks
 * Shows: Income, Expenses, Savings, Assets, Liabilities, and Emergency Fund
 */

import React, { useRef, useEffect, useState } from 'react';
import { Box, Paper, useTheme, useMediaQuery } from '@mui/material';
import { formatCurrency } from '../../utils/format';
import { useTranslation } from 'react-i18next';
import { SummaryMetrics, IncomeExpenseBreakdown, PersonalFinancialAnalysis } from '../../types/personalFinancialAnalysis.types';

interface BalanceSheetChartProps {
  summaryMetrics: SummaryMetrics;
  incomeExpenseBreakdown: IncomeExpenseBreakdown;
  analysis?: PersonalFinancialAnalysis;
  baseCurrency?: string;
  height?: number;
}

interface Block {
  id: string;
  label: string;
  value: number;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isParent?: boolean;
  children?: SubBlock[];
  isHorizontal?: boolean; // If true, children are arranged horizontally (width-based), otherwise vertically (height-based)
  isProgressBar?: boolean; // If true, render as progress bar
  targetValue?: number; // Target value for progress bar calculation
}

interface SubBlock {
  id: string;
  label: string;
  value: number;
  color: string;
  percentage: number; // Percentage of parent block
}


export const BalanceSheetChart: React.FC<BalanceSheetChartProps> = ({
  summaryMetrics,
  incomeExpenseBreakdown,
  baseCurrency = 'VND',
  height = 600,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(isMobile ? 360 : 600);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        // Set minimum width to prevent too small charts
        const minWidth = isMobile ? 300 : 400;
        setContainerWidth(Math.max(minWidth, width));
      }
    };

    // Initial width
    updateWidth();

    // Create ResizeObserver to watch for container size changes
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Fallback: also listen to window resize
    window.addEventListener('resize', updateWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, [isMobile]);

  // Calculate asset breakdown
  const investmentAssets = summaryMetrics.totalBusinessAssets + summaryMetrics.totalFinancialAssets + summaryMetrics.totalRealEstateAssets;
  const consumerAssets = summaryMetrics.totalConsumerAssets;
  const totalAssets = summaryMetrics.totalAssets;
  const netAssets = summaryMetrics.totalAssets - summaryMetrics.totalDebt;

  // Calculate total expenses including debt payments (monthly)
  const totalMonthlyExpensesWithDebt = incomeExpenseBreakdown.totalMonthlyExpenses + incomeExpenseBreakdown.monthlyTotalDebtPayment;
  
  // Handle negative savings (when expenses exceed income)
  const remainingMonthlySavings = incomeExpenseBreakdown.remainingMonthlySavings;
  const isNegativeSavings = remainingMonthlySavings < 0;
  
  // Simple logic: Expenses and Savings always sum to 100% of income
  const totalMonthlyIncome = incomeExpenseBreakdown.totalMonthlyIncome;
  const totalExpensesAndSavings = totalMonthlyIncome; // Always equals income
  
  // Calculate percentages based on income (always sum to 100%)
  const savingsPercentage = totalMonthlyIncome > 0 
    ? (Math.abs(remainingMonthlySavings) / totalMonthlyIncome) * 100 
    : 0;
  const expensesPercentage = 100 - savingsPercentage; // Expenses = 100% - Savings
  
  const expensesAndSavingsSubBlocks: SubBlock[] = [
    {
      id: 'expenses',
      label: t('personalFinancialAnalysis.charts.balanceSheet.expenses'),
      value: totalMonthlyExpensesWithDebt,
      color: theme.palette.error.main,
      percentage: expensesPercentage,
    },
    {
      id: 'savings',
      label: isNegativeSavings 
        ? t('personalFinancialAnalysis.charts.balanceSheet.deficit') 
        : t('personalFinancialAnalysis.charts.balanceSheet.savings'),
      value: Math.abs(remainingMonthlySavings),
      color: isNegativeSavings ? theme.palette.warning.main : theme.palette.info.main,
      percentage: savingsPercentage,
    },
  ].filter((item) => item.value > 0);

  // Calculate sub-blocks for Assets parent block (Investment Assets and Consumer Assets)
  const assetsSubBlocks: SubBlock[] = [
    {
      id: 'investmentAssets',
      label: t('personalFinancialAnalysis.charts.balanceSheet.investmentAssets'),
      value: investmentAssets,
      color: theme.palette.secondary.main,
      percentage: totalAssets > 0 ? (investmentAssets / totalAssets) * 100 : 0,
    },
    {
      id: 'consumerAssets',
      label: t('personalFinancialAnalysis.charts.balanceSheet.consumerAssets'),
      value: consumerAssets,
      color: theme.palette.primary.main,
      percentage: totalAssets > 0 ? (consumerAssets / totalAssets) * 100 : 0,
    },
  ].filter((item) => item.value > 0);


  // Calculate sub-blocks for Liabilities and Net Assets parent block (Debt and Net Assets)
  // When netAssets is negative, we need to show it to indicate insolvency
  const isNegativeNetAssets = netAssets < 0;
  const totalLiabilitiesAndNetAssets = summaryMetrics.totalDebt + netAssets;
  
  // For percentage calculation, use absolute values to ensure proper visualization
  // The total for percentage should be the sum of absolute values when netAssets is negative
  const totalForPercentage = isNegativeNetAssets 
    ? summaryMetrics.totalDebt + Math.abs(netAssets)
    : totalLiabilitiesAndNetAssets;
  
  const liabilitiesAndNetAssetsSubBlocks: SubBlock[] = [
    {
      id: 'debt',
      label: t('personalFinancialAnalysis.charts.balanceSheet.liabilities'),
      value: summaryMetrics.totalDebt,
      color: theme.palette.warning.main,
      percentage: totalForPercentage > 0 ? (summaryMetrics.totalDebt / totalForPercentage) * 100 : 0,
    },
    {
      id: 'netAssets',
      label: isNegativeNetAssets 
        ? t('personalFinancialAnalysis.charts.balanceSheet.negativeNetAssets', 'Tài sản thuần (Âm)')
        : t('personalFinancialAnalysis.charts.balanceSheet.netAssets'),
      value: Math.abs(netAssets), // Store absolute value for sizing, but we'll display the actual value
      color: isNegativeNetAssets ? theme.palette.error.main : theme.palette.success.main,
      percentage: totalForPercentage > 0 ? (Math.abs(netAssets) / totalForPercentage) * 100 : 0,
    },
  ].filter((item) => {
    // Only filter out zero values, keep negative netAssets to show insolvency
    if (item.id === 'netAssets' && netAssets < 0) {
      return true; // Always show negative netAssets
    }
    return item.value > 0; // Filter out zero values for other items
  });

  // Define blocks with positions
  const minBlockHeight = 50; // Minimum height for a block
  const maxBlockHeight = 200; // Maximum height for parent blocks with children
  const verticalSpacing = isMobile ? 30 : 50;
  const firstRowSpacing = isMobile ? 15 : 25; // Reduced spacing between Income and Expenses blocks
  const horizontalSpacing = isMobile ? 10 : 15;
  const startY = 40;
  const fullWidth = containerWidth;
  const halfWidth = (containerWidth - horizontalSpacing) / 2;

  // Calculate parent block heights based on children
  const calculateParentHeight = (subBlocks: SubBlock[]): number => {
    if (subBlocks.length === 0) return minBlockHeight;
    const totalPercentage = subBlocks.reduce((sum, sub) => sum + sub.percentage, 0);
    if (totalPercentage === 0) return minBlockHeight;
    // Scale height based on total percentage (normalized to 100%)
    const normalizedHeight = Math.max(minBlockHeight, Math.min(maxBlockHeight, (totalPercentage / 100) * maxBlockHeight));
    return normalizedHeight;
  };

  const assetsHeight = calculateParentHeight(assetsSubBlocks);
  const liabilitiesAndNetAssetsHeight = calculateParentHeight(liabilitiesAndNetAssetsSubBlocks);

  // Find the maximum height in row 3 (Assets and Liabilities & Net Assets)
  const row3MaxHeight = Math.max(assetsHeight, liabilitiesAndNetAssetsHeight);

  const blocks: Block[] = [
    // Top: Income (100%)
    {
      id: 'income',
      label: t('personalFinancialAnalysis.charts.balanceSheet.income'),
      value: totalMonthlyIncome,
      color: theme.palette.success.main,
      x: 0,
      y: startY,
      width: fullWidth,
      height: minBlockHeight,
    },
    // Second row: Expenses and Savings (100% width, children with proportional widths)
    {
      id: 'expensesAndSavings',
      label: t('personalFinancialAnalysis.charts.balanceSheet.expensesAndSavings'),
      value: totalExpensesAndSavings,
      color: theme.palette.info.main,
      x: 0,
      y: startY + minBlockHeight + firstRowSpacing,
      width: fullWidth,
      height: minBlockHeight,
      isParent: true,
      children: expensesAndSavingsSubBlocks,
      isHorizontal: true, // Indicates children are arranged horizontally
    },
    // Third row: Liabilities & Net Assets (50% left) and Assets (50% right)
    {
      id: 'liabilitiesAndNetAssets',
      label: t('personalFinancialAnalysis.charts.balanceSheet.liabilitiesAndNetAssets'),
      value: totalLiabilitiesAndNetAssets,
      color: theme.palette.warning.main,
      x: 0,
      y: startY + minBlockHeight + firstRowSpacing + minBlockHeight + verticalSpacing,
      width: halfWidth,
      height: row3MaxHeight,
      isParent: true,
      children: liabilitiesAndNetAssetsSubBlocks,
    },
    {
      id: 'assets',
      label: t('personalFinancialAnalysis.charts.balanceSheet.assets'),
      value: totalAssets,
      color: theme.palette.primary.main,
      x: halfWidth + horizontalSpacing,
      y: startY + minBlockHeight + firstRowSpacing + minBlockHeight + verticalSpacing,
      width: halfWidth,
      height: row3MaxHeight,
      isParent: true,
      children: assetsSubBlocks,
    },
    // Bottom: Emergency Fund (100%) - Progress bar style
    {
      id: 'emergencyFund',
      label: t('personalFinancialAnalysis.charts.balanceSheet.emergencyFund'),
      value: summaryMetrics.emergencyFund,
      color: theme.palette.secondary.main,
      x: 0,
      y: startY + minBlockHeight + firstRowSpacing + minBlockHeight + verticalSpacing + row3MaxHeight + verticalSpacing,
      width: fullWidth,
      height: minBlockHeight + 15,
      isProgressBar: true, // Indicates this block should be rendered as progress bar
      targetValue: summaryMetrics.emergencyFundRecommended, // Target value for progress calculation
    },
  ];

  const svgWidth = containerWidth;
  // Calculate total height based on blocks
  const totalHeight = startY + minBlockHeight + firstRowSpacing + minBlockHeight + verticalSpacing + row3MaxHeight + verticalSpacing + minBlockHeight + 20;
  const svgHeight = Math.max(height, totalHeight);

  return (
    <Box>
      {/* <ResponsiveTypography variant="h6" sx={{ mb: 2 }}>
        {t('personalFinancialAnalysis.charts.balanceSheet.title')}
      </ResponsiveTypography> */}
      <Paper sx={{ p: 2, overflow: 'auto' }}>
        <Box 
          ref={containerRef}
          sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            width: '100%',
            minWidth: isMobile ? 200 : 300,
          }}
        >
          <svg width={svgWidth} height={svgHeight} style={{ overflow: 'visible' }}>
            {/* Draw blocks */}
            {blocks.map((block) => {
              if (block.isParent && block.children && block.children.length > 0) {
                // Draw parent block with children
                const childSpacing = 2; // Spacing between child blocks
                const availableWidth = block.width - 10; // Reserve space for padding
                // For horizontal layout (expensesAndSavings), use full block height for children
                // For vertical layout, reserve space for parent label
                const availableHeight = block.isHorizontal ? block.height : block.height - 50;

                return (
                  <g key={block.id}>
                    {/* Parent block border - only show for vertical layout */}
                    {!block.isHorizontal && (
                      <rect
                        x={block.x}
                        y={block.y}
                        width={block.width}
                        height={block.height}
                        fill="none"
                        rx={8}
                        stroke={block.color}
                        strokeWidth={2}
                        strokeDasharray="5,5"
                        opacity={0.5}
                      />
                    )}
                    {/* Parent block label - only show for vertical layout */}
                    {!block.isHorizontal && (
                      <>
                        <text
                          x={block.x + block.width / 2}
                          y={block.y + 15}
                          textAnchor="middle"
                          fill={block.color}
                          fontSize={isMobile ? 10 : 12}
                          fontWeight={600}
                        >
                          {block.label}
                        </text>
                        {/* Parent block total value */}
                        <text
                          x={block.x + block.width / 2}
                          y={block.y + 30}
                          textAnchor="middle"
                          fill={block.color}
                          fontSize={isMobile ? 9 : 11}
                          fontWeight={500}
                        >
                          {formatCurrency(block.value, baseCurrency)}
                        </text>
                      </>
                    )}
                    {/* Draw child blocks - horizontal or vertical based on isHorizontal */}
                    {block.isHorizontal ? (
                      // Horizontal layout: children arranged side by side with proportional widths
                      (() => {
                        let currentX = block.x + 5;
                        return block.children.map((child) => {
                          const childWidth = (child.percentage / 100) * availableWidth;
                          const childX = currentX;
                          currentX += childWidth + childSpacing;

                          return (
                            <g key={child.id}>
                              {/* Child block - full height of parent */}
                              <rect
                                x={childX}
                                y={block.y}
                                width={childWidth}
                                height={block.height}
                                fill={child.color}
                                rx={4}
                                opacity={0.8}
                                stroke={theme.palette.divider}
                                strokeWidth={1}
                              />
                              {/* Child label */}
                              <text
                                x={childX + childWidth / 2}
                                y={block.y + block.height / 2 - 5}
                                textAnchor="middle"
                                fill="white"
                                fontSize={isMobile ? 9 : 10}
                                fontWeight={600}
                              >
                                {child.label}
                              </text>
                              {/* Child value */}
                              <text
                                x={childX + childWidth / 2}
                                y={block.y + block.height / 2 + 10}
                                textAnchor="middle"
                                fill="white"
                                fontSize={isMobile ? 8 : 9}
                                fontWeight={500}
                              >
                                {formatCurrency(child.value, baseCurrency)}
                              </text>
                              {/* Child percentage */}
                              <text
                                x={childX + childWidth / 2}
                                y={block.y + block.height / 2 + 20}
                                textAnchor="middle"
                                fill="white"
                                fontSize={isMobile ? 7 : 8}
                                fontWeight={400}
                                opacity={0.9}
                              >
                                {child.percentage.toFixed(1)}%
                              </text>
                            </g>
                          );
                        });
                      })()
                    ) : (
                      // Vertical layout: children stacked with proportional heights
                      (() => {
                        let currentY = block.y + 40;
                        return block.children.map((child) => {
                          const childHeight = (child.percentage / 100) * availableHeight;
                          const childY = currentY;
                          currentY += childHeight + childSpacing;

                          return (
                            <g key={child.id}>
                              {/* Child block */}
                              <rect
                                x={block.x + 5}
                                y={childY}
                                width={block.width - 10}
                                height={childHeight}
                                fill={child.color}
                                rx={4}
                                opacity={0.8}
                                stroke={theme.palette.divider}
                                strokeWidth={1}
                              />
                              {/* Child label - only show if height is sufficient */}
                              {childHeight >= 30 && (
                                <>
                                  <text
                                    x={block.x + block.width / 2}
                                    y={childY + childHeight / 2 - 5}
                                    textAnchor="middle"
                                    fill="white"
                                    fontSize={isMobile ? 9 : 10}
                                    fontWeight={600}
                                  >
                                    {child.label}
                                  </text>
                              {/* Child value - show negative sign for negative netAssets */}
                              <text
                                x={block.x + block.width / 2}
                                y={childY + childHeight / 2 + 10}
                                textAnchor="middle"
                                fill="white"
                                fontSize={isMobile ? 8 : 9}
                                fontWeight={500}
                              >
                                {child.id === 'netAssets' && isNegativeNetAssets
                                  ? `-${formatCurrency(child.value, baseCurrency)}`
                                  : formatCurrency(child.value, baseCurrency)}
                              </text>
                                  {/* Child percentage */}
                                  {childHeight >= 40 && (
                                    <text
                                      x={block.x + block.width / 2}
                                      y={childY + childHeight / 2 + 20}
                                      textAnchor="middle"
                                      fill="white"
                                      fontSize={isMobile ? 7 : 8}
                                      fontWeight={400}
                                      opacity={0.9}
                                    >
                                      {child.percentage.toFixed(1)}%
                                    </text>
                                  )}
                                </>
                              )}
                            </g>
                          );
                        });
                      })()
                    )}
                  </g>
                );
              } else if (block.isProgressBar) {
                // Draw progress bar block
                const progressPercentage = block.targetValue && block.targetValue > 0
                  ? Math.min(100, (block.value / block.targetValue) * 100)
                  : 0;
                const progressWidth = (progressPercentage / 100) * block.width;
                const isComplete = progressPercentage >= 100;

                return (
                  <g key={block.id}>
                    {/* Background rectangle */}
                    <rect
                      x={block.x}
                      y={block.y}
                      width={block.width}
                      height={block.height}
                      fill={theme.palette.grey[200]}
                      rx={8}
                      stroke={theme.palette.divider}
                      strokeWidth={1}
                    />
                    {/* Progress bar */}
                    <rect
                      x={block.x}
                      y={block.y}
                      width={progressWidth}
                      height={block.height}
                      fill={isComplete ? theme.palette.success.main : block.color}
                      rx={8}
                      opacity={0.9}
                    />
                    {/* Block label */}
                    <text
                      x={block.x + block.width / 2}
                      y={block.y + 20}
                      textAnchor="middle"
                      fill={theme.palette.text.primary}
                      fontSize={isMobile ? 11 : 13}
                      fontWeight={600}
                    >
                      {block.label}
                    </text>
                    {/* Block value and target */}
                    <text
                      x={block.x + block.width / 2}
                      y={block.y + 40}
                      textAnchor="middle"
                      fill={theme.palette.text.primary}
                      fontSize={isMobile ? 10 : 12}
                      fontWeight={500}
                    >
                      {formatCurrency(block.value, baseCurrency)} / {formatCurrency(block.targetValue || 0, baseCurrency)}
                    </text>
                    {/* Progress percentage */}
                    {block.targetValue && block.targetValue > 0 && (
                      <text
                        x={block.x + block.width / 2}
                        y={block.y + 55}
                        textAnchor="middle"
                        fill={ progressPercentage > 50 ? theme.palette.success.contrastText : theme.palette.text.primary}
                        fontSize={isMobile ? 9 : 11}
                        fontWeight={400}
                      >
                        {progressPercentage.toFixed(1)}%
                      </text>
                    )}
                  </g>
                );
              } else {
                // Draw simple block (no children)
                return (
                  <g key={block.id}>
                    {/* Block rectangle */}
                    <rect
                      x={block.x}
                      y={block.y}
                      width={block.width}
                      height={block.height}
                      fill={block.color}
                      rx={8}
                      opacity={0.9}
                      stroke={theme.palette.divider}
                      strokeWidth={1}
                    />
                    {/* Block label */}
                    <text
                      x={block.x + block.width / 2}
                      y={block.y + 20}
                      textAnchor="middle"
                      fill="white"
                      fontSize={isMobile ? 11 : 13}
                      fontWeight={600}
                    >
                      {block.label}
                    </text>
                    {/* Block value */}
                    <text
                      x={block.x + block.width / 2}
                      y={block.y + 40}
                      textAnchor="middle"
                      fill="white"
                      fontSize={isMobile ? 10 : 12}
                      fontWeight={500}
                    >
                      {formatCurrency(block.value, baseCurrency)}
                    </text>
                  </g>
                );
              }
            })}
          </svg>
        </Box>
      </Paper>
    </Box>
  );
};





