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
      console.log(`\n=== FEES & TAXES ANALYSIS ===\n`);
      
      let totalFees = 0;
      let totalTaxes = 0;
      let totalFeesAndTaxes = 0;
      
      trades.forEach((trade, index) => {
        const fee = typeof trade.fee === 'string' ? parseFloat(trade.fee) : trade.fee;
        const tax = typeof trade.tax === 'string' ? parseFloat(trade.tax) : trade.tax;
        const feesAndTaxes = fee + tax;
        
        totalFees += fee || 0;
        totalTaxes += tax || 0;
        totalFeesAndTaxes += feesAndTaxes || 0;
        
        console.log(`Trade ${index + 1} (${trade.side}):`);
        console.log(`  Fee: ${fee} (type: ${typeof trade.fee})`);
        console.log(`  Tax: ${tax} (type: ${typeof trade.tax})`);
        console.log(`  Fees + Tax: ${feesAndTaxes}`);
        console.log('');
      });
      
      console.log(`=== TOTALS ===`);
      console.log(`Total Fees: ${totalFees}`);
      console.log(`Total Taxes: ${totalTaxes}`);
      console.log(`Total Fees & Taxes: ${totalFeesAndTaxes}`);
      
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();
