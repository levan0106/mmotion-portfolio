import { Injectable } from '@nestjs/common';

export interface TaxFeeOption {
  type: 'percentage' | 'fixed';
  value: number;
}

export interface AssetValueCalculationOptions {
  tax?: TaxFeeOption | number; // Support both new format and legacy number
  fee?: TaxFeeOption | number;
  discount?: TaxFeeOption | number;
  commission?: TaxFeeOption | number;
  otherDeductions?: TaxFeeOption | number;
}

export interface AssetPosition {
  side?: string | 'BUY' | 'SELL';
  quantity: number;
  price: number;
  avgCost?: number;
  tax?: TaxFeeOption | number;
  fee?: TaxFeeOption | number;
  discount?: TaxFeeOption | number;
  commission?: TaxFeeOption | number;
  otherDeductions?: TaxFeeOption | number;
}

/**
 * Service for calculating asset values with various adjustments.
 * Centralizes all currentValue calculation logic for consistency and easy modification.
 */
@Injectable()
export class AssetValueCalculatorService {
  
  /**
   * Calculate tax/fee amount based on type and value
   * @param baseValue - Base value to calculate from
   * @param option - Tax/fee option (percentage or fixed)
   * @returns Calculated amount
   */
  private calculateTaxFeeAmount(baseValue: number, option: TaxFeeOption | number | undefined): number {
    if (!option) return 0;
    
    // Handle legacy number format
    if (typeof option === 'number') {
      return option;
    }
    
    // Handle new TaxFeeOption format
    if (option.type === 'percentage') {
      return baseValue * (option.value / 100);
    } else {
      return option.value;
    }
  }

  /**
   * Create a percentage-based tax/fee option
   * @param percentage - Percentage value (e.g., 10 for 10%)
   * @returns TaxFeeOption
   */
  static createPercentageOption(percentage: number): TaxFeeOption {
    return {
      type: 'percentage',
      value: percentage
    };
  }

  /**
   * Create a fixed-value tax/fee option
   * @param value - Fixed value
   * @returns TaxFeeOption
   */
  static createFixedOption(value: number): TaxFeeOption {
    return {
      type: 'fixed',
      value: value
    };
  }

  /**
   * Create calculation options with percentage-based tax and fee
   * @param taxPercentage - Tax percentage
   * @param feePercentage - Fee percentage
   * @param otherOptions - Other options
   * @returns AssetValueCalculationOptions
   */
  static createPercentageOptions(
    taxPercentage?: number,
    feePercentage?: number,
    otherOptions?: Partial<AssetValueCalculationOptions>
  ): AssetValueCalculationOptions {
    return {
      tax: taxPercentage ? this.createPercentageOption(taxPercentage) : undefined,
      fee: feePercentage ? this.createPercentageOption(feePercentage) : undefined,
      ...otherOptions
    };
  }

  /**
   * Create calculation options with fixed-value tax and fee
   * @param taxValue - Fixed tax value
   * @param feeValue - Fixed fee value
   * @param otherOptions - Other options
   * @returns AssetValueCalculationOptions
   */
  static createFixedOptions(
    taxValue?: number,
    feeValue?: number,
    otherOptions?: Partial<AssetValueCalculationOptions>
  ): AssetValueCalculationOptions {
    return {
      tax: taxValue ? this.createFixedOption(taxValue) : undefined,
      fee: feeValue ? this.createFixedOption(feeValue) : undefined,
      ...otherOptions
    };
  }

  /**
   * Calculate current value of an asset
   * @param quantity - Current quantity
   * @param currentPrice - Current price per unit
   * @param options - Additional calculation options
   * @returns Current value
   */
  calculateCurrentValue(
    quantity: number, 
    currentPrice: number, 
    options?: AssetValueCalculationOptions
  ): number {
    if (!quantity || !currentPrice || quantity <= 0 || currentPrice <= 0) {
      return 0;
    }

    // Base calculation: quantity * price
    let currentValue = quantity * currentPrice;

    // Apply additional calculations if provided
    if (options) {
      // Calculate tax amount
      const taxAmount = this.calculateTaxFeeAmount(currentValue, options.tax);
      currentValue -= taxAmount;

      // Calculate fee amount
      const feeAmount = this.calculateTaxFeeAmount(currentValue, options.fee);
      currentValue -= feeAmount;

      // Calculate commission amount
      const commissionAmount = this.calculateTaxFeeAmount(currentValue, options.commission);
      currentValue -= commissionAmount;

      // Calculate other deductions amount
      const otherDeductionsAmount = this.calculateTaxFeeAmount(currentValue, options.otherDeductions);
      currentValue -= otherDeductionsAmount;

      // Apply discount (always percentage-based)
      const discountAmount = this.calculateTaxFeeAmount(currentValue, options.discount);
      currentValue -= discountAmount;
    }

    return Math.max(0, currentValue); // Ensure non-negative
  }

  /**
   * Calculate current value with detailed breakdown
   * @param quantity - Current quantity
   * @param currentPrice - Current price per unit
   * @param options - Additional calculation options
   * @returns Detailed calculation breakdown
   */
  calculateCurrentValueWithBreakdown(
    quantity: number, 
    currentPrice: number, 
    options?: AssetValueCalculationOptions
  ): {
    baseValue: number;
    taxAmount: number;
    feeAmount: number;
    commissionAmount: number;
    otherDeductionsAmount: number;
    discountAmount: number;
    totalDeductions: number;
    finalValue: number;
  } {
    if (!quantity || !currentPrice || quantity <= 0 || currentPrice <= 0) {
      return {
        baseValue: 0,
        taxAmount: 0,
        feeAmount: 0,
        commissionAmount: 0,
        otherDeductionsAmount: 0,
        discountAmount: 0,
        totalDeductions: 0,
        finalValue: 0
      };
    }

    const baseValue = quantity * currentPrice;
    
    if (!options) {
      return {
        baseValue,
        taxAmount: 0,
        feeAmount: 0,
        commissionAmount: 0,
        otherDeductionsAmount: 0,
        discountAmount: 0,
        totalDeductions: 0,
        finalValue: baseValue
      };
    }

    // Calculate each deduction
    const taxAmount = this.calculateTaxFeeAmount(baseValue, options.tax);
    const feeAmount = this.calculateTaxFeeAmount(baseValue, options.fee);
    const commissionAmount = this.calculateTaxFeeAmount(baseValue, options.commission);
    const otherDeductionsAmount = this.calculateTaxFeeAmount(baseValue, options.otherDeductions);
    const discountAmount = this.calculateTaxFeeAmount(baseValue, options.discount);

    const totalDeductions = taxAmount + feeAmount + commissionAmount + otherDeductionsAmount + discountAmount;
    const finalValue = Math.max(0, baseValue - totalDeductions);

    return {
      baseValue,
      taxAmount,
      feeAmount,
      commissionAmount,
      otherDeductionsAmount,
      discountAmount,
      totalDeductions,
      finalValue
    };
  }

  /**
   * Calculate current value for multiple assets
   * @param assets - Array of assets with quantity and price
   * @returns Total current value
   */
  calculateTotalCurrentValue(assets: AssetPosition[]): number {
    return assets.reduce((total, asset) => {
      return total + this.calculateCurrentValue(
        asset.quantity,
        asset.price,
        {
          tax: asset.tax,
          fee: asset.fee,
          discount: asset.discount,
          commission: asset.commission,
          otherDeductions: asset.otherDeductions,
        }
      );
    }, 0);
  }

  /**
   * Calculate unrealized P&L for an asset
   * @param quantity - Current quantity
   * @param currentPrice - Current price per unit
   * @param avgCost - Average cost per unit
   * @param options - Additional calculation options
   * @returns Unrealized P&L
   */
  calculateUnrealizedPL( // cách tính này không đúng, cần cải thiện, cần tính toán lại
    quantity: number,
    currentPrice: number,
    avgCost: number,
    options?: AssetValueCalculationOptions
  ): number {
    if (!quantity || quantity <= 0) {
      return 0;
    }

    const currentValue = this.calculateCurrentValue(quantity, currentPrice, options);
    const costBasis = quantity * avgCost; 
    
    return currentValue - costBasis;
  }

  /**
   * Calculate unrealized P&L for multiple assets
   * @param assets - Array of assets with quantity, price, and cost
   * @returns Total unrealized P&L
   */
  calculateTotalUnrealizedPL(assets: AssetPosition[]): number {
    return assets.reduce((total, asset) => {
      // Calculate unrealized P&L directly: (current price - avg cost) * quantity
      // avgcost already calculated using fifo algorithm
      const unrealizedPl = (asset.price - asset.avgCost) * asset.quantity;
      return total + unrealizedPl;
    }, 0);
  }

  /**
   * Calculate return percentage for an asset
   * @param quantity - Current quantity
   * @param currentPrice - Current price per unit
   * @param avgCost - Average cost per unit
   * @param options - Additional calculation options
   * @returns Return percentage
   */
  calculateReturnPercentage(
    quantity: number,
    currentPrice: number,
    avgCost: number,
    options?: AssetValueCalculationOptions
  ): number {
    if (!quantity || !avgCost || quantity <= 0 || avgCost <= 0) {
      return 0;
    }

    const currentValue = this.calculateCurrentValue(quantity, currentPrice, options);
    const costBasis = quantity * avgCost;
    
    if (costBasis === 0) return 0;
    
    return ((currentValue - costBasis) / costBasis) * 100;
  }

  
  /**
   * Calculate position for a specific asset using FIFO algorithm
   * @param assetId - Asset ID
   * @param trades - Trades for this asset
   * @param currentPrice - Current price of the asset
   * @returns Promise<AssetPosition>
   */
  calculateAssetPositionFIFO(
    trades: AssetPosition[],
    currentPrice: number,
  ): {
    quantity: number;
    avgCost: number;
    currentValue: number;
    unrealizedPl: number;
    realizedPl: number;
    totalPnl: number;
    currentPrice: number;
  } {

    let realizedPnl = 0;
    const buyTrades: Array<{
      quantity: number;
      price: number;
      fee:number;
      tax:number;
      remainingQuantity: number;
    }> = [];
  
    for (const trade of trades) {

      const quantity = parseFloat(trade.quantity.toString());
      const price = parseFloat(trade.price.toString());
      const fee = parseFloat(trade.fee?.toString() || '0');
      const tax = parseFloat(trade.tax?.toString() || '0');
  
      if (trade.side === 'BUY') {
        // chỉ lưu cost gốc, không cộng fee/tax BUY
        buyTrades.push({
          quantity,
          price,
          fee,
          tax,
          remainingQuantity: quantity,
        });
      } else if (trade.side === 'SELL') {
        let remainingToSell = Math.abs(quantity);
  
        for (const buyTrade of buyTrades) {
          if (remainingToSell <= 0) break;
          if (buyTrade.remainingQuantity <= 0) continue;
  
          const sellFromThisTrade = Math.min(remainingToSell, buyTrade.remainingQuantity);
  
          const cost = sellFromThisTrade * buyTrade.price;
          const proceeds = sellFromThisTrade * price;
  
          // chỉ trừ fee + tax SELL
          realizedPnl += proceeds - cost - (fee + tax) * (sellFromThisTrade / Math.abs(quantity));
  
          buyTrade.remainingQuantity -= sellFromThisTrade;
          remainingToSell -= sellFromThisTrade;
        }
      }
    }
  
    // Unrealized PnL
    let netQuantity = 0;
    let totalCostBasis = 0;
    for (const buyTrade of buyTrades) {
      if (buyTrade.remainingQuantity > 0) {
        netQuantity += buyTrade.remainingQuantity;
        const proportion = buyTrade.remainingQuantity / buyTrade.quantity;
        totalCostBasis += (buyTrade.remainingQuantity * buyTrade.price) + (buyTrade.fee * proportion) + (buyTrade.tax * proportion);
      }
    }
  
    const marketValue = netQuantity * currentPrice;
    const unrealizedPnl = marketValue - totalCostBasis;
    const totalPnl = realizedPnl + unrealizedPnl;
  
    return {
      quantity: netQuantity,
      avgCost: netQuantity > 0 ? totalCostBasis / netQuantity : 0,
      currentValue: marketValue,
      unrealizedPl: unrealizedPnl,
      realizedPl: realizedPnl,
      totalPnl,
      currentPrice,
    };
  }
  
}
