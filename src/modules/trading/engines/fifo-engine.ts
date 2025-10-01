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
  // matchTrades(sellTrade: Trade, buyTrades: Trade[]): TradeMatchResult {
  //   if (sellTrade.side !== TradeSide.SELL) {
  //     throw new Error("FIFO matching chỉ áp dụng cho SELL trades");
  //   }
  
  //   const matchedDetails: TradeDetail[] = [];
  //   let remainingQuantity = sellTrade.quantity;
  //   let totalPnl = 0;
  
  //   // FIFO: sắp xếp buy theo ngày (bao gồm cả bonus BUY)
  //   const sortedBuyTrades = buyTrades
  //     .filter((trade) => trade.side === TradeSide.BUY)
  //     .sort((a, b) => a.tradeDate.getTime() - b.tradeDate.getTime());
  
  //   for (const buyTrade of sortedBuyTrades) {
  //     if (remainingQuantity <= 0) break;
  
  //     // Tính số lượng còn lại chưa match cho BUY này
  //     const matchedQty =
  //       buyTrade.buyDetails?.reduce((sum, d) => sum + d.matchedQty, 0) ?? 0;
  //     const availableQty = buyTrade.quantity - matchedQty;
  //     if (availableQty <= 0) continue;
  
  //     // Match số lượng có thể từ lot này
  //     const matchableQuantity = Math.min(remainingQuantity, availableQty);
  
  //     if (matchableQuantity > 0) {
  //       const tradeDetail = new TradeDetail();
  //       tradeDetail.sellTradeId = sellTrade.tradeId;
  //       tradeDetail.buyTradeId = buyTrade.tradeId;
  //       tradeDetail.assetId = sellTrade.assetId;
  //       tradeDetail.matchedQty = matchableQuantity;
  //       tradeDetail.buyPrice = buyTrade.price;
  //       tradeDetail.sellPrice = sellTrade.price;
  //       tradeDetail.feeTax = this.calculateFeeTax(
  //         buyTrade,
  //         sellTrade,
  //         matchableQuantity,
  //       );
  //       tradeDetail.pnl = this.calculatePnl(
  //         buyTrade.price,
  //         sellTrade.price,
  //         matchableQuantity,
  //         tradeDetail.feeTax,
  //       );
  
  //       matchedDetails.push(tradeDetail);
  //       totalPnl += tradeDetail.pnl;
  //       remainingQuantity -= matchableQuantity;
  //     }
  //   }
  
  //   return {
  //     matchedDetails,
  //     remainingQuantity,
  //     totalPnl,
  //   };
  // }

  matchTrades(sellTrade: Trade, buyTrades: Trade[]): TradeMatchResult {
    if (sellTrade.side !== TradeSide.SELL) {
      throw new Error("FIFO matching can only be applied to SELL trades");
    }
  
    const matchedDetails: TradeDetail[] = [];
    let remainingQuantity = sellTrade.quantity;
    let totalPnl = 0;
  
    // --- STEP 1: Gom bonus về cost basis ---
    // Tính tổng vốn gốc (chỉ tính các lot giá > 0) và tổng quantity (bao gồm bonus @0)
    const totalCost = buyTrades
      .filter(b => b.price > 0)
      .reduce((sum, b) => sum + Number(b.price) * Number(b.quantity), 0);
  
    const totalQty = buyTrades.reduce((sum, b) => sum + Number(b.quantity), 0);
  
    console.log('[Debug] matchTrades cost basis totalCost', totalCost, 'totalQty', totalQty, 'date', sellTrade.tradeDate);
    if (totalQty > 0) {
      const adjustedPrice = totalCost / totalQty;

      // Cập nhật lại tất cả buyTrades thành cùng một price bình quân
      for (const b of buyTrades) {
        console.log('[Debug] matchTrades b.price before', b.price, 'date', b.tradeDate);
        b.price = adjustedPrice;
        console.log('[Debug] matchTrades b.price after', b.price, 'date', b.tradeDate);
      }
    }
  
    // --- STEP 2: FIFO như cũ ---
    const sortedBuyTrades = buyTrades
      .filter(trade => trade.side === TradeSide.BUY)
      .sort((a, b) => a.tradeDate.getTime() - b.tradeDate.getTime());
  
    for (const buyTrade of sortedBuyTrades) {
      if (remainingQuantity <= 0) break;
  
      const availableQty =
        buyTrade.quantity -
        (buyTrade.buyDetails?.reduce((sum, d) => sum + Number(d.matchedQty), 0) || 0);
  
      if (availableQty <= 0) continue;
  
      const matchableQuantity = Math.min(remainingQuantity, availableQty);
  
      if (matchableQuantity > 0) {
        const tradeDetail = new TradeDetail();
        tradeDetail.sellTradeId = sellTrade.tradeId;
        tradeDetail.buyTradeId = buyTrade.tradeId;
        tradeDetail.assetId = sellTrade.assetId;
        tradeDetail.matchedQty = matchableQuantity;
        tradeDetail.buyPrice = buyTrade.price;
        tradeDetail.sellPrice = sellTrade.price;
        tradeDetail.feeTax = this.calculateFeeTax(
          buyTrade,
          sellTrade,
          matchableQuantity,
        );
        tradeDetail.pnl = this.calculatePnl(
          buyTrade.price,
          sellTrade.price,
          matchableQuantity,
          tradeDetail.feeTax,
        );
        matchedDetails.push(tradeDetail);
        totalPnl += tradeDetail.pnl;
        remainingQuantity -= matchableQuantity;

        console.log('[Debug] matchTrades ', buyTrade.tradeId, 'remainingQuantity', remainingQuantity, 'matchedQuantity', matchableQuantity, 
        'sellPrice', sellTrade.price, 'buyPrice', buyTrade.price, 'trade pnl', tradeDetail.pnl, 'totalPnl', totalPnl, 'date', buyTrade.tradeDate);
        
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

    if (sellTrade.price < 0) {
      errors.push('Sell trade price must be non-negative');
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
