const https = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/trades?portfolioId=4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const trades = JSON.parse(data);
      console.log(`\n=== TRADING PERFORMANCE CALCULATION ===\n`);
      
      // Calculate like frontend
      const totalTrades = trades?.length || 0;
      const buyTrades = trades?.filter((trade) => trade.side === 'BUY').length || 0;
      const sellTrades = trades?.filter((trade) => trade.side === 'SELL').length || 0;
      const totalVolume = trades?.reduce((sum, trade) => sum + (trade.totalValue || 0), 0) || 0;
      const totalFees = trades?.reduce((sum, trade) => sum + (Number(trade.fee) || 0), 0) || 0;
      const totalTaxes = trades?.reduce((sum, trade) => sum + (Number(trade.tax) || 0), 0) || 0;
      const totalFeesAndTaxes = totalFees + totalTaxes;
      const realizedPL = trades?.reduce((sum, trade) => sum + (trade.realizedPl || 0), 0) || 0;
      
      console.log(`Total Trades: ${totalTrades}`);
      console.log(`BUY Trades: ${buyTrades}`);
      console.log(`SELL Trades: ${sellTrades}`);
      console.log(`Total Volume: ${totalVolume.toLocaleString()} VND`);
      console.log(`Total Fees: ${totalFees.toLocaleString()} VND`);
      console.log(`Total Taxes: ${totalTaxes.toLocaleString()} VND`);
      console.log(`Total Fees & Taxes: ${totalFeesAndTaxes.toLocaleString()} VND`);
      console.log(`Realized P&L: ${realizedPL.toLocaleString()} VND`);
      
      console.log(`\n=== VERIFICATION ===`);
      console.log(`Expected Total Fees & Taxes: 11,000 VND`);
      console.log(`Calculated Total Fees & Taxes: ${totalFeesAndTaxes.toLocaleString()} VND`);
      console.log(`Match: ${totalFeesAndTaxes === 11000 ? '✅ YES' : '❌ NO'}`);
      
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();
