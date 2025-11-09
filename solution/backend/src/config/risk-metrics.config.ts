import { config } from 'dotenv';

config();

export const RiskMetricsConfig = {
  // Risk-free rate for Sharpe ratio calculation
  DEFAULT_RISK_FREE_RATE: parseFloat(process.env.RISK_FREE_RATE || '0.05'), // 5% annual risk-free rate
  
  // Trading days per year for annualization
  TRADING_DAYS_PER_YEAR: parseInt(process.env.TRADING_DAYS_PER_YEAR || '252', 10),
  
  // VaR confidence levels
  VAR_CONFIDENCE_LEVELS: {
    VAR_95: 0.95,
    VAR_99: 0.99,
  },
  
  // Default calculation periods (in days)
  DEFAULT_PERIODS: {
    ONE_MONTH: 30,
    THREE_MONTHS: 90,
    SIX_MONTHS: 180,
    ONE_YEAR: 365,
  },
  
  // Minimum data points required for calculation
  MIN_DATA_POINTS: parseInt(process.env.MIN_RISK_DATA_POINTS || '2', 10),
} as const;

export type RiskMetricsConfigType = typeof RiskMetricsConfig;
