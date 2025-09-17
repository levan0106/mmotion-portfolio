import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Trade } from '../src/modules/trading/entities/trade.entity';

async function checkTradeData() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tradeRepository = app.get(getRepositoryToken(Trade));

  console.log('Checking trade data...');

  // Get some sample trades
  const trades = await tradeRepository.find({
    where: [
      { tradeId: '700cf982-f3aa-4a3e-a179-4a0ee762b53d' },
      { tradeId: 'd455b55c-1c51-4fe7-891d-c18e657bb808' },
      { tradeId: '7d5ad2ae-451f-48d8-8c9d-241beeff0678' },
      { tradeId: '03bde7ad-0b11-4d70-b374-ad8d4a387c8b' },
      { tradeId: '81d405dc-64f3-421a-8051-036dc0d503ba' },
      { tradeId: 'adf3b5e3-f5a8-460d-8e5d-e4e694a6b351' },
      { tradeId: '4b8dce89-d033-42ac-8697-8ca66c0de780' },
      { tradeId: '507f6303-e239-4e8c-8b9c-c328787db797' },
      { tradeId: '32510235-0477-45d7-a82c-db18a9a99c96' }
    ]
  });

  console.log(`Found ${trades.length} trades:`);
  
  for (const trade of trades) {
    console.log(`\nTrade ID: ${trade.tradeId}`);
    console.log(`Side: ${trade.side}`);
    console.log(`Quantity: ${trade.quantity}`);
    console.log(`Price: ${trade.price}`);
    console.log(`Fee: ${trade.fee} (type: ${typeof trade.fee})`);
    console.log(`Tax: ${trade.tax} (type: ${typeof trade.tax})`);
    console.log(`Fee is null: ${trade.fee === null}`);
    console.log(`Fee is undefined: ${trade.fee === undefined}`);
    console.log(`Tax is null: ${trade.tax === null}`);
    console.log(`Tax is undefined: ${trade.tax === undefined}`);
  }

  await app.close();
}

checkTradeData().catch(console.error);
