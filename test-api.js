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
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const trades = JSON.parse(data);
      console.log(`\nTotal trades: ${trades.length}`);
      
      // Calculate realized P&L
      const totalRealizedPL = trades.reduce((sum, trade) => {
        const realizedPl = typeof trade.realizedPl === 'string' ? parseFloat(trade.realizedPl) : trade.realizedPl;
        console.log(`Trade ${trade.tradeId} (${trade.side}): realizedPl = ${realizedPl} (type: ${typeof trade.realizedPl})`);
        return sum + (realizedPl || 0);
      }, 0);
      
      console.log(`\nTotal Realized P&L: ${totalRealizedPL}`);
      
      // Show BUY vs SELL trades
      const buyTrades = trades.filter(t => t.side === 'BUY');
      const sellTrades = trades.filter(t => t.side === 'SELL');
      console.log(`\nBUY trades: ${buyTrades.length}`);
      console.log(`SELL trades: ${sellTrades.length}`);
      
    } catch (error) {
      console.error('Error parsing JSON:', error);
      console.log('Raw data:', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();