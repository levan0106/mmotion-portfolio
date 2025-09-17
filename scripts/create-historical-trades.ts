import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { TradingService } from '../src/modules/trading/services/trading.service';
import { TradeSide, TradeType, TradeSource } from '../src/modules/trading/entities/trade.entity';

async function createHistoricalTrades() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tradingService = app.get(TradingService);

  const portfolioId = 'f9cf6de3-36ef-4581-8b29-1aa872ed9658';
  
  // Historical trades for different months to create monthly performance data
  const historicalTrades = [
    // January 2024
    {
      portfolioId: portfolioId,
      assetId: '0de842f3-eefc-41f1-aaae-04655ce6b4b6', // GOLD
      tradeDate: '2024-01-05',
      side: TradeSide.BUY,
      quantity: 1.0,
      price: 1500000,
      fee: 100000,
      tax: 50000,
      tradeType: TradeType.NORMAL,
      source: TradeSource.MANUAL,
      notes: 'Historical BUY trade for GOLD - Jan 2024',
    },
    {
      portfolioId: portfolioId,
      assetId: '195c429b-66be-4a65-87cc-0929cf35ad3c', // VCB
      tradeDate: '2024-01-10',
      side: TradeSide.BUY,
      quantity: 200,
      price: 90000,
      fee: 20000,
      tax: 10000,
      tradeType: TradeType.NORMAL,
      source: TradeSource.MANUAL,
      notes: 'Historical BUY trade for VCB - Jan 2024',
    },
    
    // February 2024
    {
      portfolioId: portfolioId,
      assetId: '592c32b6-66a3-4bf5-abed-95e95c26f794', // HPG
      tradeDate: '2024-02-01',
      side: TradeSide.BUY,
      quantity: 500,
      price: 50000,
      fee: 25000,
      tax: 12500,
      tradeType: TradeType.NORMAL,
      source: TradeSource.MANUAL,
      notes: 'Historical BUY trade for HPG - Feb 2024',
    },
    {
      portfolioId: portfolioId,
      assetId: '0de842f3-eefc-41f1-aaae-04655ce6b4b6', // GOLD
      tradeDate: '2024-02-15',
      side: TradeSide.SELL,
      quantity: 0.5,
      price: 1600000,
      fee: 50000,
      tax: 25000,
      tradeType: TradeType.NORMAL,
      source: TradeSource.MANUAL,
      notes: 'Historical SELL trade for GOLD - Feb 2024',
    },
    
    // March 2024
    {
      portfolioId: portfolioId,
      assetId: '195c429b-66be-4a65-87cc-0929cf35ad3c', // VCB
      tradeDate: '2024-03-01',
      side: TradeSide.SELL,
      quantity: 100,
      price: 95000,
      fee: 10000,
      tax: 5000,
      tradeType: TradeType.NORMAL,
      source: TradeSource.MANUAL,
      notes: 'Historical SELL trade for VCB - Mar 2024',
    },
    {
      portfolioId: portfolioId,
      assetId: '592c32b6-66a3-4bf5-abed-95e95c26f794', // HPG
      tradeDate: '2024-03-15',
      side: TradeSide.SELL,
      quantity: 200,
      price: 48000,
      fee: 8000,
      tax: 4000,
      tradeType: TradeType.NORMAL,
      source: TradeSource.MANUAL,
      notes: 'Historical SELL trade for HPG - Mar 2024',
    },
    
    // April 2024
    {
      portfolioId: portfolioId,
      assetId: '0de842f3-eefc-41f1-aaae-04655ce6b4b6', // GOLD
      tradeDate: '2024-04-01',
      side: TradeSide.BUY,
      quantity: 0.8,
      price: 1520000,
      fee: 80000,
      tax: 40000,
      tradeType: TradeType.NORMAL,
      source: TradeSource.MANUAL,
      notes: 'Historical BUY trade for GOLD - Apr 2024',
    },
    {
      portfolioId: portfolioId,
      assetId: '195c429b-66be-4a65-87cc-0929cf35ad3c', // VCB
      tradeDate: '2024-04-10',
      side: TradeSide.BUY,
      quantity: 150,
      price: 88000,
      fee: 15000,
      tax: 7500,
      tradeType: TradeType.NORMAL,
      source: TradeSource.MANUAL,
      notes: 'Historical BUY trade for VCB - Apr 2024',
    },
    
    // May 2024
    {
      portfolioId: portfolioId,
      assetId: '0de842f3-eefc-41f1-aaae-04655ce6b4b6', // GOLD
      tradeDate: '2024-05-01',
      side: TradeSide.SELL,
      quantity: 0.3,
      price: 1550000,
      fee: 30000,
      tax: 15000,
      tradeType: TradeType.NORMAL,
      source: TradeSource.MANUAL,
      notes: 'Historical SELL trade for GOLD - May 2024',
    },
    {
      portfolioId: portfolioId,
      assetId: '195c429b-66be-4a65-87cc-0929cf35ad3c', // VCB
      tradeDate: '2024-05-15',
      side: TradeSide.SELL,
      quantity: 50,
      price: 85000,
      fee: 5000,
      tax: 2500,
      tradeType: TradeType.NORMAL,
      source: TradeSource.MANUAL,
      notes: 'Historical SELL trade for VCB - May 2024',
    },
  ];

  console.log('Creating historical trades...');
  
  for (const tradeData of historicalTrades) {
    try {
      const trade = await tradingService.createTrade(tradeData);
      console.log(`Created trade: ${trade.tradeId} - ${trade.assetId} - ${trade.side} - ${trade.quantity} @ ${trade.price} - ${trade.tradeDate.toISOString().substring(0, 7)}`);
    } catch (error) {
      console.error(`Error creating trade:`, error.message);
    }
  }

  console.log('Historical trades created successfully!');
  await app.close();
}

createHistoricalTrades().catch(console.error);
