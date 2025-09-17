import { Trade, TradeSide } from '../entities/trade.entity';
import { TradeDetail } from '../entities/trade-detail.entity';

export interface TradeMatchResult {
  matchedDetails: TradeDetail[];
  remainingQuantity: number;
  totalPnl: number;
}

export class FIFOEngine {
  /**
   * Match trades using FIFO (First In, First Out) algorithm
   * @param sellTrade The sell trade to match
   * @param buyTrades Array of buy trades ordered by tradeDate (oldest first)
   * @returns TradeMatchResult with matched details and remaining quantity
   */
  matchTrades(sellTrade: Trade, buyTrades: Trade[]): TradeMatchResult {
    if (sellTrade.side !== TradeSide.SELL) {
      throw new Error('FIFO matching can only be applied to SELL trades');
    }

    const matchedDetails: TradeDetail[] = [];
    let remainingQuantity = sellTrade.quantity;
    let totalPnl = 0;

    // Sort buy trades by tradeDate (FIFO - oldest first)
    const sortedBuyTrades = buyTrades
      .filter(trade => trade.side === TradeSide.BUY)
      .sort((a, b) => a.tradeDate.getTime() - b.tradeDate.getTime());

    for (const buyTrade of sortedBuyTrades) {
      if (remainingQuantity <= 0) {
        break;
      }

      // Calculate how much we can match from this buy trade
      const matchableQuantity = Math.min(remainingQuantity, buyTrade.quantity);
      
      if (matchableQuantity > 0) {
        // Create trade detail for this match
        const tradeDetail = new TradeDetail();
        tradeDetail.sellTradeId = sellTrade.tradeId;
        tradeDetail.buyTradeId = buyTrade.tradeId;
        tradeDetail.assetId = sellTrade.assetId;
        tradeDetail.matchedQty = matchableQuantity;
        tradeDetail.buyPrice = buyTrade.price;
        tradeDetail.sellPrice = sellTrade.price;
        tradeDetail.feeTax = this.calculateFeeTax(buyTrade, sellTrade, matchableQuantity);
        tradeDetail.pnl = this.calculatePnl(
          buyTrade.price,
          sellTrade.price,
          matchableQuantity,
          tradeDetail.feeTax
        );

        matchedDetails.push(tradeDetail);
        totalPnl += tradeDetail.pnl;
        remainingQuantity -= matchableQuantity;
      }
    }

    return {
      matchedDetails,
      remainingQuantity,
      totalPnl,
    };
  }

  /**
   * Calculate fee and tax for a trade match
   * @param buyTrade The buy trade
   * @param sellTrade The sell trade
   * @param matchedQuantity The quantity being matched
   * @returns Total fee and tax for this match
   */
  private calculateFeeTax(buyTrade: Trade, sellTrade: Trade, matchedQuantity: number): number {
    // Proportional fee and tax based on matched quantity
    const buyFee = parseFloat(buyTrade.fee?.toString() || '0');
    const buyTax = parseFloat(buyTrade.tax?.toString() || '0');
    const sellFee = parseFloat(sellTrade.fee?.toString() || '0');
    const sellTax = parseFloat(sellTrade.tax?.toString() || '0');
    
    const buyFeeTax = (buyFee + buyTax) * (matchedQuantity / buyTrade.quantity);
    const sellFeeTax = (sellFee + sellTax) * (matchedQuantity / sellTrade.quantity);
    
    return buyFeeTax + sellFeeTax;
  }

  /**
   * Calculate P&L for a trade match
   * @param buyPrice The buy price
   * @param sellPrice The sell price
   * @param quantity The matched quantity
   * @param feeTax Total fee and tax
   * @returns Net P&L
   */
  private calculatePnl(buyPrice: number, sellPrice: number, quantity: number, feeTax: number): number {
    const grossPnl = (sellPrice - buyPrice) * quantity;
    return grossPnl - feeTax;
  }

  /**
   * Validate trade matching rules
   * @param sellTrade The sell trade
   * @param buyTrades Array of buy trades
   * @returns Validation result
   */
  validateTradeMatching(sellTrade: Trade, buyTrades: Trade[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if sell trade is valid
    if (sellTrade.side !== TradeSide.SELL) {
      errors.push('FIFO matching can only be applied to SELL trades');
    }

    if (sellTrade.quantity <= 0) {
      errors.push('Sell trade quantity must be positive');
    }

    if (sellTrade.price <= 0) {
      errors.push('Sell trade price must be positive');
    }

    // Check buy trades
    const validBuyTrades = buyTrades.filter(trade => trade.side === TradeSide.BUY);
    
    if (validBuyTrades.length === 0) {
      errors.push('No valid BUY trades found for matching');
    }

    // Check for sufficient quantity
    const totalBuyQuantity = validBuyTrades.reduce((sum, trade) => sum + trade.quantity, 0);
    if (totalBuyQuantity < sellTrade.quantity) {
      errors.push(`Insufficient buy quantity: ${totalBuyQuantity} < ${sellTrade.quantity}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get available buy quantity for matching
   * @param buyTrades Array of buy trades
   * @returns Total available buy quantity
   */
  getAvailableBuyQuantity(buyTrades: Trade[]): number {
    return buyTrades
      .filter(trade => trade.side === TradeSide.BUY)
      .reduce((sum, trade) => sum + trade.quantity, 0);
  }

  /**
   * Get buy trades ordered by FIFO (oldest first)
   * @param buyTrades Array of buy trades
   * @returns Sorted buy trades
   */
  getBuyTradesOrdered(buyTrades: Trade[]): Trade[] {
    return buyTrades
      .filter(trade => trade.side === TradeSide.BUY)
      .sort((a, b) => a.tradeDate.getTime() - b.tradeDate.getTime());
  }
}
