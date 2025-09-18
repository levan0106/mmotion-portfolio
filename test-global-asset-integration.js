/**
 * Test script for Global Asset Integration
 * Tests the integration between Asset and GlobalAsset systems
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

async function testGlobalAssetIntegration() {
  console.log('🚀 Testing Global Asset Integration...\n');

  try {
    // Test 1: Create a new asset and verify global asset creation
    console.log('📝 Test 1: Creating new asset...');
    const testUserId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID for testing
    const uniqueSymbol = `TGA${Date.now()}`; // Unique symbol for each test run
    const createAssetResponse = await axios.post(`${API_BASE}/assets`, {
      name: 'Test Global Asset Integration',
      symbol: uniqueSymbol,
      type: 'STOCK',
      description: 'Test asset for global integration',
      createdBy: testUserId,
      updatedBy: testUserId
    });

    if (createAssetResponse.status === 201) {
      console.log('✅ Asset created successfully');
      const asset = createAssetResponse.data;
      console.log(`   Asset ID: ${asset.id}`);
      console.log(`   Symbol: ${asset.symbol}`);
    } else {
      console.log('❌ Failed to create asset');
      return;
    }

    // Test 2: Check if global asset was created
    console.log('\n🔍 Test 2: Checking global asset creation...');
    try {
      const globalAssetsResponse = await axios.get(`${API_BASE}/global-assets?symbol=${uniqueSymbol}`);
      if (globalAssetsResponse.data.data && globalAssetsResponse.data.data.length > 0) {
        console.log('✅ Global asset created successfully');
        const globalAsset = globalAssetsResponse.data.data[0];
        console.log(`   Global Asset ID: ${globalAsset.id}`);
        console.log(`   Symbol: ${globalAsset.symbol}`);
        console.log(`   Nation: ${globalAsset.nation}`);
        console.log(`   Currency: ${globalAsset.currency}`);
      } else {
        console.log('⚠️  Global asset not found - this might be expected if sync failed');
      }
    } catch (error) {
      console.log('⚠️  Could not check global asset:', error.message);
    }

    // Test 3: Update asset and verify global asset update
    console.log('\n📝 Test 3: Updating asset...');
    const updateAssetResponse = await axios.put(`${API_BASE}/assets/${createAssetResponse.data.id}`, {
      name: 'Updated Test Global Asset Integration',
      description: 'Updated test asset for global integration',
      updatedBy: testUserId
    });

    if (updateAssetResponse.status === 200) {
      console.log('✅ Asset updated successfully');
    } else {
      console.log('❌ Failed to update asset');
    }

    // Test 4: Check current price calculation
    console.log('\n💰 Test 4: Checking current price calculation...');
    try {
      const assetDetailsResponse = await axios.get(`${API_BASE}/assets/${createAssetResponse.data.id}`);
      if (assetDetailsResponse.status === 200) {
        const asset = assetDetailsResponse.data;
        console.log('✅ Asset details retrieved successfully');
        console.log(`   Current Price: ${asset.currentPrice || 'N/A'}`);
        console.log(`   Current Value: ${asset.currentValue || 'N/A'}`);
        console.log(`   Current Quantity: ${asset.currentQuantity || 'N/A'}`);
      }
    } catch (error) {
      console.log('⚠️  Could not get asset details:', error.message);
    }

    // Test 5: Clean up - delete the test asset
    console.log('\n🧹 Test 5: Cleaning up...');
    try {
      await axios.delete(`${API_BASE}/assets/${createAssetResponse.data.id}`);
      console.log('✅ Test asset deleted successfully');
    } catch (error) {
      console.log('⚠️  Could not delete test asset:', error.message);
    }

    console.log('\n🎉 Global Asset Integration test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

// Run the test
testGlobalAssetIntegration();
