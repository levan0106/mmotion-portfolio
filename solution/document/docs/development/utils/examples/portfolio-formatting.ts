/**
 * Portfolio Formatting Examples
 * 
 * This file demonstrates how to use formatting utilities in portfolio-related components.
 * All examples follow the best practices defined in FORMATTING_UTILS.md
 */

import { formatCurrency, formatDate, formatPercentage, formatNumber } from '@/utils/format';

// Example 1: Portfolio Card Component
export const PortfolioCard = ({ portfolio }) => {
  return (
    <div className="portfolio-card">
      <h3>{portfolio.name}</h3>
      
      {/* Portfolio Value */}
      <div className="value">
        <span className="label">Current Value:</span>
        <span className="amount">
          {formatCurrency(portfolio.currentValue, 'VND')}
        </span>
      </div>
      
      {/* Portfolio Change */}
      <div className={`change ${portfolio.change >= 0 ? 'positive' : 'negative'}`}>
        <span className="label">Change:</span>
        <span className="amount">
          {formatCurrency(portfolio.change, 'VND')}
        </span>
        <span className="percentage">
          ({formatPercentage(portfolio.changePercent)})
        </span>
      </div>
      
      {/* Portfolio Performance */}
      <div className="performance">
        <span className="label">YTD Performance:</span>
        <span className="percentage">
          {formatPercentage(portfolio.ytdPerformance)}
        </span>
      </div>
      
      {/* Last Updated */}
      <div className="last-updated">
        <span className="label">Last Updated:</span>
        <span className="date">
          {formatDate(portfolio.lastUpdated, 'short')}
        </span>
      </div>
    </div>
  );
};

// Example 2: Portfolio List Component
export const PortfolioList = ({ portfolios }) => {
  return (
    <div className="portfolio-list">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Value</th>
            <th>Change</th>
            <th>Performance</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {portfolios.map(portfolio => (
            <tr key={portfolio.id}>
              <td>{portfolio.name}</td>
              <td>{formatCurrency(portfolio.currentValue, 'VND')}</td>
              <td className={portfolio.change >= 0 ? 'positive' : 'negative'}>
                {formatCurrency(portfolio.change, 'VND')} 
                ({formatPercentage(portfolio.changePercent)})
              </td>
              <td>{formatPercentage(portfolio.ytdPerformance)}</td>
              <td>{formatDate(portfolio.createdAt, 'short')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Example 3: Portfolio Summary Component
export const PortfolioSummary = ({ summary }) => {
  return (
    <div className="portfolio-summary">
      <div className="summary-grid">
        {/* Total Value */}
        <div className="summary-item">
          <span className="label">Total Value</span>
          <span className="value">
            {formatCurrency(summary.totalValue, 'VND')}
          </span>
        </div>
        
        {/* Total Investment */}
        <div className="summary-item">
          <span className="label">Total Investment</span>
          <span className="value">
            {formatCurrency(summary.totalInvestment, 'VND')}
          </span>
        </div>
        
        {/* Total P&L */}
        <div className="summary-item">
          <span className="label">Total P&L</span>
          <span className={`value ${summary.totalPl >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(summary.totalPl, 'VND')}
          </span>
        </div>
        
        {/* Total P&L Percentage */}
        <div className="summary-item">
          <span className="label">Total P&L %</span>
          <span className={`value ${summary.totalPlPercent >= 0 ? 'positive' : 'negative'}`}>
            {formatPercentage(summary.totalPlPercent)}
          </span>
        </div>
        
        {/* Number of Assets */}
        <div className="summary-item">
          <span className="label">Assets</span>
          <span className="value">
            {formatNumber(summary.assetCount, 0)}
          </span>
        </div>
        
        {/* Number of Trades */}
        <div className="summary-item">
          <span className="label">Trades</span>
          <span className="value">
            {formatNumber(summary.tradeCount, 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

// Example 4: Portfolio Performance Chart Component
export const PortfolioPerformanceChart = ({ performanceData }) => {
  return (
    <div className="performance-chart">
      <h3>Portfolio Performance</h3>
      <div className="chart-container">
        {/* Chart implementation would go here */}
        <div className="chart-data">
          {performanceData.map((point, index) => (
            <div key={index} className="chart-point">
              <span className="date">
                {formatDate(point.date, 'short')}
              </span>
              <span className="value">
                {formatCurrency(point.value, 'VND')}
              </span>
              <span className={`change ${point.change >= 0 ? 'positive' : 'negative'}`}>
                {formatPercentage(point.changePercent)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Example 5: Portfolio Asset Allocation Component
export const PortfolioAssetAllocation = ({ allocations }) => {
  return (
    <div className="asset-allocation">
      <h3>Asset Allocation</h3>
      <div className="allocation-list">
        {allocations.map(allocation => (
          <div key={allocation.assetId} className="allocation-item">
            <div className="asset-info">
              <span className="asset-name">{allocation.assetName}</span>
              <span className="asset-symbol">{allocation.symbol}</span>
            </div>
            <div className="allocation-details">
              <span className="value">
                {formatCurrency(allocation.value, 'VND')}
              </span>
              <span className="percentage">
                {formatPercentage(allocation.percentage)}
              </span>
              <span className="quantity">
                {formatNumber(allocation.quantity, 0)} shares
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Example 6: Portfolio Risk Metrics Component
export const PortfolioRiskMetrics = ({ riskMetrics }) => {
  return (
    <div className="risk-metrics">
      <h3>Risk Metrics</h3>
      <div className="metrics-grid">
        <div className="metric-item">
          <span className="label">Sharpe Ratio</span>
          <span className="value">
            {formatNumber(riskMetrics.sharpeRatio, 2)}
          </span>
        </div>
        
        <div className="metric-item">
          <span className="label">Volatility</span>
          <span className="value">
            {formatPercentage(riskMetrics.volatility)}
          </span>
        </div>
        
        <div className="metric-item">
          <span className="label">VaR (95%)</span>
          <span className="value">
            {formatCurrency(riskMetrics.var95, 'VND')}
          </span>
        </div>
        
        <div className="metric-item">
          <span className="label">Max Drawdown</span>
          <span className="value">
            {formatPercentage(riskMetrics.maxDrawdown)}
          </span>
        </div>
      </div>
    </div>
  );
};

// Example 7: Portfolio Transaction History Component
export const PortfolioTransactionHistory = ({ transactions }) => {
  return (
    <div className="transaction-history">
      <h3>Transaction History</h3>
      <div className="transaction-list">
        {transactions.map(transaction => (
          <div key={transaction.id} className="transaction-item">
            <div className="transaction-info">
              <span className="type">{transaction.type}</span>
              <span className="symbol">{transaction.symbol}</span>
              <span className="quantity">
                {formatNumber(transaction.quantity, 0)} shares
              </span>
            </div>
            <div className="transaction-details">
              <span className="price">
                {formatCurrency(transaction.price, 'VND')}
              </span>
              <span className="total">
                {formatCurrency(transaction.total, 'VND')}
              </span>
              <span className="date">
                {formatDate(transaction.date, 'short')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Example 8: Portfolio Form Component
export const PortfolioForm = ({ formData, setFormData, onSubmit }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="portfolio-form">
      <div className="form-group">
        <label htmlFor="name">Portfolio Name</label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Enter portfolio name"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Enter portfolio description"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="initialValue">Initial Value</label>
        <input
          type="number"
          id="initialValue"
          value={formData.initialValue}
          onChange={(e) => setFormData({...formData, initialValue: parseFloat(e.target.value)})}
          placeholder="Enter initial value"
        />
        <span className="formatted-value">
          {formatCurrency(formData.initialValue || 0, 'VND')}
        </span>
      </div>
      
      <div className="form-actions">
        <button type="submit" className="btn-primary">
          Create Portfolio
        </button>
        <button type="button" className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
};

// Example 9: Portfolio Dashboard Component
export const PortfolioDashboard = ({ portfolio }) => {
  return (
    <div className="portfolio-dashboard">
      <div className="dashboard-header">
        <h1>{portfolio.name}</h1>
        <div className="dashboard-meta">
          <span className="created-date">
            Created: {formatDate(portfolio.createdAt, 'long')}
          </span>
          <span className="last-updated">
            Updated: {formatDate(portfolio.lastUpdated, 'short')}
          </span>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-row">
          <PortfolioSummary summary={portfolio.summary} />
          <PortfolioRiskMetrics riskMetrics={portfolio.riskMetrics} />
        </div>
        
        <div className="dashboard-row">
          <PortfolioPerformanceChart performanceData={portfolio.performanceData} />
          <PortfolioAssetAllocation allocations={portfolio.allocations} />
        </div>
        
        <div className="dashboard-row">
          <PortfolioTransactionHistory transactions={portfolio.transactions} />
        </div>
      </div>
    </div>
  );
};

// Example 10: Portfolio Comparison Component
export const PortfolioComparison = ({ portfolios }) => {
  return (
    <div className="portfolio-comparison">
      <h3>Portfolio Comparison</h3>
      <div className="comparison-table">
        <table>
          <thead>
            <tr>
              <th>Portfolio</th>
              <th>Value</th>
              <th>Change</th>
              <th>Performance</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {portfolios.map(portfolio => (
              <tr key={portfolio.id}>
                <td>{portfolio.name}</td>
                <td>{formatCurrency(portfolio.currentValue, 'VND')}</td>
                <td className={portfolio.change >= 0 ? 'positive' : 'negative'}>
                  {formatCurrency(portfolio.change, 'VND')}
                </td>
                <td>{formatPercentage(portfolio.performance)}</td>
                <td>{formatNumber(portfolio.risk, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
