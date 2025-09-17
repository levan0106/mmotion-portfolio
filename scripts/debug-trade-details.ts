import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { TradeDetailRepository } from '../src/modules/trading/repositories/trade-detail.repository';

async function debugTradeDetails() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tradeDetailRepo = app.get(TradeDetailRepository);

  console.log('Debugging trade details...');
  
  // Get all trade details
  const tradeDetails = await tradeDetailRepo.find({
    relations: ['sellTrade', 'buyTrade', 'asset'],
  });

  console.log(`Found ${tradeDetails.length} trade details:`);
  
  for (const detail of tradeDetails) {
    console.log(`\nTrade Detail ID: ${detail.detailId}`);
    console.log(`Asset: ${detail.asset?.symbol} (${detail.asset?.name})`);
    console.log(`Matched Qty: ${detail.matchedQty}`);
    console.log(`Buy Price: ${detail.buyPrice}`);
    console.log(`Sell Price: ${detail.sellPrice}`);
    console.log(`Fee Tax: ${detail.feeTax}`);
    console.log(`P&L: ${detail.pnl}`);
    
    // Calculate P&L manually
    const grossPnl = (detail.sellPrice - detail.buyPrice) * detail.matchedQty;
    const netPnl = grossPnl - detail.feeTax;
    console.log(`Manual Gross P&L: ${grossPnl}`);
    console.log(`Manual Net P&L: ${netPnl}`);
    
    console.log(`Sell Trade: ${detail.sellTrade?.tradeId} - ${detail.sellTrade?.side} - ${detail.sellTrade?.quantity} @ ${detail.sellTrade?.price}`);
    console.log(`Buy Trade: ${detail.buyTrade?.tradeId} - ${detail.buyTrade?.side} - ${detail.buyTrade?.quantity} @ ${detail.buyTrade?.price}`);
  }

  await app.close();
}

debugTradeDetails().catch(console.error);
