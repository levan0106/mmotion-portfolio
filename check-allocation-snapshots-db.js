/**
 * Debug script to check allocation snapshots in database
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

async function checkAllocationSnapshotsDB() {
  try {
    console.log('🔍 Checking allocation snapshots in database...\n');

    const portfolioId = 'f9cf6de3-36ef-4581-8b29-1aa872ed9658';

    // Check if there are any allocation snapshots
    console.log('📊 Checking for allocation snapshots:');
    console.log('─'.repeat(60));

    try {
      // Try to get snapshots with allocation data
      const response = await axios.get(`${API_BASE}/portfolio-snapshots/timeline/${portfolioId}`);
      console.log('✅ Portfolio snapshots timeline:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Data: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      console.log(`❌ Portfolio snapshots timeline error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // Check if there are any asset snapshots
    console.log('\n📊 Checking for asset snapshots:');
    console.log('─'.repeat(60));

    try {
      const response = await axios.get(`${API_BASE}/snapshots/timeline?portfolioId=${portfolioId}`);
      console.log('✅ Asset snapshots timeline:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Data: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      console.log(`❌ Asset snapshots timeline error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // Check current portfolio positions
    console.log('\n📊 Checking current portfolio positions:');
    console.log('─'.repeat(60));

    try {
      const response = await axios.get(`${API_BASE}/portfolios/${portfolioId}/positions`);
      console.log('✅ Current positions:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Positions: ${response.data.positions?.length || 0}`);
      console.log(`   Summary: ${JSON.stringify(response.data.summary, null, 2)}`);
    } catch (error) {
      console.log(`❌ Current positions error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // Check if we can create a snapshot with allocation data
    console.log('\n📊 Testing snapshot creation with allocation:');
    console.log('─'.repeat(60));

    try {
      const response = await axios.post(`${API_BASE}/portfolio-snapshots/from-asset-snapshots`, {
        portfolioId: portfolioId,
        snapshotDate: new Date().toISOString().split('T')[0]
      });
      console.log('✅ Snapshot creation:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Data: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      console.log(`❌ Snapshot creation error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
checkAllocationSnapshotsDB();
