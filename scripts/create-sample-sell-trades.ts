import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { TradingService } from '../src/modules/trading/services/trading.service';
import { TradeSide, TradeType, TradeSource } from '../src/modules/trading/entities/trade.entity';

async function createSampleSellTrades() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tradingService = app.get(TradingService);

  const portfolioId = 'f9cf6de3-36ef-4581-8b29-1aa872ed9658';
  
  // Sample SELL trades with realistic P&L
  const sampleSellTrades = [
    {
      portfolioId: portfolioId,
      assetId: '0de842f3-eefc-41f1-aaae-04655ce6b4b6', // GOLD
      tradeDate: '2024-01-15',
      side: TradeSide.SELL,
      quantity: 0.5,
      price: 1600000, // 1.6M VND per ounce (higher than buy price for profit)
      fee: 50000,
      tax: 25000,
      tradeType: TradeType.NORMAL,
      source: TradeSource.MANUAL,
      notes: 'Sample SELL trade for GOLD - Profit',
    },
    {
      portfolioId: portfolioId,
      assetId: '195c429b-66be-4a65-87cc-0929cf35ad3c', // VCB
      tradeDate: '2024-02-20',
      side: TradeSide.SELL,
      quantity: 100,
      price: 95000, // 95K VND per share (higher than buy price for profit)
      fee: 10000,
      tax: 5000,
      tradeType: TradeType.NORMAL,
      source: TradeSource.MANUAL,
      notes: 'Sample SELL trade for VCB - Profit',
    },
    {
      portfolioId: portfolioId,
      assetId: '592c32b6-66a3-4bf5-abed-95e95c26f794', // HPG
      tradeDate: '2024-03-10',
      side: TradeSide.SELL,
      quantity: 200,
      price: 48000, // 48K VND per share (lower than buy price for loss)
      fee: 8000,
      tax: 4000,
      tradeType: TradeType.NORMAL,
      source: TradeSource.MANUAL,
      notes: 'Sample SELL trade for HPG - Loss',
    },
    {
      portfolioId: portfolioId,
      assetId: '0de842f3-eefc-41f1-aaae-04655ce6b4b6', // GOLD
      tradeDate: '2024-04-05',
      side: TradeSide.SELL,
      quantity: 0.3,
      price: 1550000, // 1.55M VND per ounce (slight profit)
      fee: 30000,
      tax: 15000,
      tradeType: TradeType.NORMAL,
      source: TradeSource.MANUAL,
      notes: 'Sample SELL trade for GOLD - Small Profit',
    },
    {
      portfolioId: portfolioId,
      assetId: '195c429b-66be-4a65-87cc-0929cf35ad3c', // VCB
      tradeDate: '2024-05-12',
      side: TradeSide.SELL,
      quantity: 50,
      price: 85000, // 85K VND per share (lower than buy price for loss)
      fee: 5000,
      tax: 2500,
      tradeType: TradeType.NORMAL,
      source: TradeSource.MANUAL,
      notes: 'Sample SELL trade for VCB - Loss',
    },
  ];

  console.log('Creating sample SELL trades...');
  
  for (const tradeData of sampleSellTrades) {
    try {
      const trade = await tradingService.createTrade(tradeData);
      console.log(`Created SELL trade: ${trade.tradeId} - ${trade.assetId} - ${trade.quantity} @ ${trade.price}`);
    } catch (error) {
      console.error(`Error creating trade:`, error.message);
    }
  }

  console.log('Sample SELL trades created successfully!');
  await app.close();
}

createSampleSellTrades().catch(console.error);
