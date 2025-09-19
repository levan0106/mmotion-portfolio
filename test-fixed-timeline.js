const fetch = require('node-fetch');

async function testFixedTimeline() {
  try {
    console.log('🔍 Testing FIXED Allocation Timeline for Portfolio f9cf6de3-36ef-4581-8b29-1aa872ed9658\\n');
    
    const portfolioId = 'f9cf6de3-36ef-4581-8b29-1aa872ed9658';
    
    // Get timeline data
    console.log('📊 Getting allocation timeline data...');
    const timelineResponse = await fetch(`http://localhost:3000/api/v1/portfolios/${portfolioId}/analytics/allocation-timeline?months=12`);
    const timelineData = await timelineResponse.json();
    
    console.log('📈 Timeline Data:');
    timelineData.data.forEach((point, index) => {
      const assetTypes = Object.keys(point).filter(key => key !== 'date');
      if (assetTypes.length > 0) {
        console.log(`${index + 1}. ${point.date}: ${assetTypes.map(type => `${type}: ${point[type]}%`).join(', ')}`);
      } else {
        console.log(`${index + 1}. ${point.date}: No data`);
      }
    });
    
    // Get trades data
    console.log('\\n📊 Getting trades data...');
    const tradesResponse = await fetch(`http://localhost:3000/api/v1/trades?portfolioId=${portfolioId}`);
    const trades = await tradesResponse.json();
    
    console.log('\\n📈 Trades Data:');
    trades.forEach((trade, index) => {
      const tradeDate = new Date(trade.tradeDate);
      const monthKey = `${tradeDate.getFullYear()}-${String(tradeDate.getMonth() + 1).padStart(2, '0')}`;
      console.log(`${index + 1}. ${trade.tradeDate} (${monthKey}): ${trade.side} ${trade.quantity} ${trade.asset?.symbol} (${trade.asset?.type})`);
    });
    
    // Check specific months
    console.log('\\n🔍 Checking specific months:');
    const mayData = timelineData.data.find(point => point.date.startsWith('2025-05'));
    const juneData = timelineData.data.find(point => point.date.startsWith('2025-06'));
    
    console.log('May 2025:', mayData);
    console.log('June 2025:', juneData);
    
    // Check if GOLD percentage changed
    if (mayData && juneData) {
      const mayGold = mayData.GOLD || 0;
      const juneGold = juneData.GOLD || 0;
      console.log(`\\n📊 GOLD percentage change: ${mayGold}% → ${juneGold}%`);
      
      if (mayGold !== juneGold) {
        console.log('✅ SUCCESS: GOLD percentage changed after trade!');
      } else {
        console.log('❌ ISSUE: GOLD percentage did not change after trade');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFixedTimeline();
