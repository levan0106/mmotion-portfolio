/**
 * Performance Demo Component
 * Demonstrates real performance calculations
 */

import React, { useState, useEffect } from 'react';
import { AssetPerformance } from './AssetPerformance';
import { calculatePerformanceWithMarketData, calculatePerformanceWithTrades } from '../../utils/performance.utils';

export const PerformanceDemo: React.FC = () => {
  const [demoData, setDemoData] = useState({
    initialValue: 1000000,
    currentValue: 1200000,
    symbol: 'GOLD',
    hasTrades: false,
  });

  const [performance, setPerformance] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });

  useEffect(() => {
    const performanceData = {
      initialValue: demoData.initialValue,
      currentValue: demoData.currentValue,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    let calculatedPerformance;
    if (demoData.hasTrades) {
      // Simulate trade data
      const trades = [
        { side: 'BUY', quantity: 10, price: 100000, tradeDate: new Date('2024-01-01') },
        { side: 'SELL', quantity: 5, price: 120000, tradeDate: new Date('2024-01-15') },
      ];
      calculatedPerformance = calculatePerformanceWithTrades(performanceData, trades);
    } else {
      calculatedPerformance = calculatePerformanceWithMarketData(performanceData, demoData.symbol);
    }

    setPerformance(calculatedPerformance);
  }, [demoData]);

  const handleInputChange = (field: string, value: any) => {
    setDemoData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Performance Calculation Demo</h2>
      
      {/* Input Controls */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Initial Value (VND)
          </label>
          <input
            type="number"
            value={demoData.initialValue}
            onChange={(e) => handleInputChange('initialValue', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Value (VND)
          </label>
          <input
            type="number"
            value={demoData.currentValue}
            onChange={(e) => handleInputChange('currentValue', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Symbol
          </label>
          <select
            value={demoData.symbol}
            onChange={(e) => handleInputChange('symbol', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="GOLD">GOLD (Low Volatility)</option>
            <option value="VFF">VFF (High Volatility)</option>
            <option value="VESAF">VESAF (Medium Volatility)</option>
            <option value="SSISCA">SSISCA (Average Volatility)</option>
            <option value="HPG">HPG (Very High Volatility)</option>
            <option value="VCB">VCB (Low Volatility)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Calculation Method
          </label>
          <select
            value={demoData.hasTrades ? 'trades' : 'market'}
            onChange={(e) => handleInputChange('hasTrades', e.target.value === 'trades')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="market">Market Data Simulation</option>
            <option value="trades">Trade History Based</option>
          </select>
        </div>
      </div>

      {/* Performance Display */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Calculated Performance</h3>
        <AssetPerformance 
          performance={performance} 
          showLabels={true}
          compact={false}
        />
      </div>

      {/* Performance Details */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Performance Details</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Total Return:</strong> {((demoData.currentValue - demoData.initialValue) / demoData.initialValue * 100).toFixed(2)}%</p>
          <p><strong>Value Change:</strong> {(demoData.currentValue - demoData.initialValue).toLocaleString()} VND</p>
          <p><strong>Symbol:</strong> {demoData.symbol}</p>
          <p><strong>Method:</strong> {demoData.hasTrades ? 'Trade History Based' : 'Market Data Simulation'}</p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDemo;
