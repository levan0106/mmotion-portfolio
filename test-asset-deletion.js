// Test script to verify asset deletion flow
const axios = require('axios');

async function testAssetDeletion() {
  try {
    console.log('Testing Asset Deletion Flow...\n');
    
    // 1. Get all assets
    console.log('1. Getting all assets...');
    const assetsResponse = await axios.get('http://localhost:3000/api/v1/assets');
    const assets = assetsResponse.data.data;
    console.log(`Found ${assets.length} assets`);
    
    // 2. Find an asset with trades
    console.log('\n2. Looking for assets with trades...');
    let assetWithTrades = null;
    
    for (const asset of assets) {
      try {
        const tradeCountResponse = await axios.get(`http://localhost:3000/api/v1/assets/${asset.id}/trades/count`);
        const tradeInfo = tradeCountResponse.data;
        console.log(`Asset: ${asset.name} (${asset.symbol}) - Trades: ${tradeInfo.count}, Can Delete: ${tradeInfo.canDelete}`);
        
        if (tradeInfo.count > 0 && !assetWithTrades) {
          assetWithTrades = asset;
        }
      } catch (error) {
        console.log(`Error checking trades for ${asset.name}: ${error.message}`);
      }
    }
    
    if (assetWithTrades) {
      console.log(`\n3. Found asset with trades: ${assetWithTrades.name} (${assetWithTrades.symbol})`);
      console.log('This asset should show trade count warning when deleted in frontend.');
    } else {
      console.log('\n3. No assets with trades found. All assets can be deleted normally.');
    }
    
    // 3. Test regular delete endpoint
    console.log('\n4. Testing regular delete endpoint...');
    if (assetWithTrades) {
      try {
        const deleteResponse = await axios.delete(`http://localhost:3000/api/v1/assets/${assetWithTrades.id}`);
        console.log('Regular delete response:', deleteResponse.data);
      } catch (error) {
        console.log('Regular delete error (expected):', error.response?.data || error.message);
      }
    }
    
    console.log('\n✅ Test completed! Check the frontend at http://localhost:5173');
    console.log('Try deleting an asset to see the trade count warning dialog.');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAssetDeletion();
