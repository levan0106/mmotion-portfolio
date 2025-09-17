import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { TradeDetailRepository } from '../src/modules/trading/repositories/trade-detail.repository';

async function fixTradeDetailsPnl() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tradeDetailRepo = app.get(TradeDetailRepository);

  console.log('Fixing trade details P&L...');
  
  // Get all trade details
  const tradeDetails = await tradeDetailRepo.find({
    relations: ['sellTrade', 'buyTrade'],
  });

  console.log(`Found ${tradeDetails.length} trade details to fix`);
  
  for (const detail of tradeDetails) {
    // Calculate fee and tax properly
    const buyFee = parseFloat(detail.buyTrade.fee?.toString() || '0');
    const buyTax = parseFloat(detail.buyTrade.tax?.toString() || '0');
    const sellFee = parseFloat(detail.sellTrade.fee?.toString() || '0');
    const sellTax = parseFloat(detail.sellTrade.tax?.toString() || '0');
    
    const buyFeeTax = (buyFee + buyTax) * (detail.matchedQty / detail.buyTrade.quantity);
    const sellFeeTax = (sellFee + sellTax) * (detail.matchedQty / detail.sellTrade.quantity);
    const totalFeeTax = buyFeeTax + sellFeeTax;
    
    // Calculate P&L
    const grossPnl = (detail.sellPrice - detail.buyPrice) * detail.matchedQty;
    const netPnl = grossPnl - totalFeeTax;
    
    console.log(`\nFixing Trade Detail ID: ${detail.detailId}`);
    console.log(`Asset: ${detail.assetId}`);
    console.log(`Matched Qty: ${detail.matchedQty}`);
    console.log(`Buy Price: ${detail.buyPrice}`);
    console.log(`Sell Price: ${detail.sellPrice}`);
    console.log(`Old Fee Tax: ${detail.feeTax}`);
    console.log(`New Fee Tax: ${totalFeeTax}`);
    console.log(`Old P&L: ${detail.pnl}`);
    console.log(`New P&L: ${netPnl}`);
    
    // Update the trade detail
    await tradeDetailRepo.update(detail.detailId, {
      feeTax: totalFeeTax,
      pnl: netPnl,
    });
  }

  console.log('\nTrade details P&L fixed successfully!');
  await app.close();
}

fixTradeDetailsPnl().catch(console.error);
