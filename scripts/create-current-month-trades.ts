import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { TradingService } from '../src/modules/trading/services/trading.service';
import { TradeSide, TradeType, TradeSource } from '../src/modules/trading/entities/trade.entity';

async function createCurrentMonthTrades() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tradingService = app.get(TradingService);

  const portfolioId = 'f9cf6de3-36ef-4581-8b29-1aa872ed9658';
  
  // Current month trades (December 2024)
  const currentMonthTrades = [
    {
      portfolioId: portfolioId,
      assetId: '0de842f3-eefc-41f1-aaae-04655ce6b4b6', // GOLD
      tradeDate: '2024-12-01',
      side: TradeSide.BUY,
      quantity: 0.5,
      price: 1800000,
      fee: 50000,
      tax: 25000,
      tradeType: TradeType.NORMAL,
      source: TradeSource.MANUAL,
      notes: 'Current month BUY trade for GOLD - Dec 2024',
    },
    {
      portfolioId: portfolioId,
      assetId: '195c429b-66be-4a65-87cc-0929cf35ad3c', // VCB
      tradeDate: '2024-12-05',
      side: TradeSide.BUY,
      quantity: 100,
      price: 92000,
      fee: 10000,
      tax: 5000,
      tradeType: TradeType.NORMAL,
      source: TradeSource.MANUAL,
      notes: 'Current month BUY trade for VCB - Dec 2024',
    },
    {
      portfolioId: portfolioId,
      assetId: '592c32b6-66a3-4bf5-abed-95e95c26f794', // HPG
      tradeDate: '2024-12-10',
      side: TradeSide.SELL,
      quantity: 100,
      price: 52000,
      fee: 5000,
      tax: 2500,
      tradeType: TradeType.NORMAL,
      source: TradeSource.MANUAL,
      notes: 'Current month SELL trade for HPG - Dec 2024',
    },
    {
      portfolioId: portfolioId,
      assetId: '0de842f3-eefc-41f1-aaae-04655ce6b4b6', // GOLD
      tradeDate: '2024-12-15',
      side: TradeSide.SELL,
      quantity: 0.2,
      price: 1850000,
      fee: 20000,
      tax: 10000,
      tradeType: TradeType.NORMAL,
      source: TradeSource.MANUAL,
      notes: 'Current month SELL trade for GOLD - Dec 2024',
    },
  ];

  console.log('Creating current month trades...');
  
  for (const tradeData of currentMonthTrades) {
    try {
      const trade = await tradingService.createTrade(tradeData);
      console.log(`Created trade: ${trade.tradeId} - ${trade.assetId} - ${trade.side} - ${trade.quantity} @ ${trade.price} - ${trade.tradeDate.toISOString().substring(0, 7)}`);
    } catch (error) {
      console.error(`Error creating trade:`, error.message);
    }
  }

  console.log('Current month trades created successfully!');
  await app.close();
}

createCurrentMonthTrades().catch(console.error);
