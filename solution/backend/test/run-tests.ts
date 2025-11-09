#!/usr/bin/env ts-node

import { TestDatabaseSetup } from './test-db-setup';
import { TestUtils } from './test-utils';
import { testConfig } from './test-env';

/**
 * Test Runner for CR-006 Asset Snapshot System
 * 
 * This script runs all integration tests for the snapshot system
 * in a Docker environment.
 */

async function runTests(): Promise<void> {
  const testDbSetup = new TestDatabaseSetup();
  let testUtils: TestUtils | null = null;

  try {
    console.log('🚀 Starting CR-006 Asset Snapshot System Integration Tests');
    console.log('================================================');

    // Initialize test database
    await testDbSetup.initialize();
    testUtils = new TestUtils(testDbSetup.getDataSource());

    console.log('✅ Test environment initialized');
    console.log('');

    // Run test suites
    await runSnapshotIntegrationTests(testUtils);
    await runSnapshotPerformanceTests(testUtils);
    await runSnapshotErrorHandlingTests(testUtils);

    console.log('');
    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    if (testDbSetup.isConnected()) {
      await testDbSetup.cleanup();
    }
  }
}

async function runSnapshotIntegrationTests(testUtils: TestUtils): Promise<void> {
  console.log('🧪 Running Snapshot Integration Tests...');
  
  try {
    // Test 1: Create snapshot
    console.log('  ✓ Testing snapshot creation...');
    const snapshot = await testUtils.createTestSnapshot();
    console.log(`    Created snapshot: ${snapshot.id}`);

    // Test 2: Retrieve snapshot
    console.log('  ✓ Testing snapshot retrieval...');
    const retrievedSnapshot = await testUtils.getSnapshotById(snapshot.id);
    if (!retrievedSnapshot) {
      throw new Error('Failed to retrieve created snapshot');
    }
    console.log(`    Retrieved snapshot: ${retrievedSnapshot.id}`);

    // Test 3: Update snapshot
    console.log('  ✓ Testing snapshot update...');
    const updatedSnapshot = await testUtils.createTestSnapshot({
      id: snapshot.id,
      currentQuantity: 200,
    });
    console.log(`    Updated snapshot quantity: ${updatedSnapshot.currentQuantity}`);

    // Test 4: Delete snapshot
    console.log('  ✓ Testing snapshot deletion...');
    await testUtils.clearAllSnapshots();
    const count = await testUtils.countSnapshots();
    if (count !== 0) {
      throw new Error('Failed to delete all snapshots');
    }
    console.log('    All snapshots deleted successfully');

    console.log('  ✅ Snapshot Integration Tests passed');

  } catch (error) {
    console.error('  ❌ Snapshot Integration Tests failed:', error);
    throw error;
  }
}

async function runSnapshotPerformanceTests(testUtils: TestUtils): Promise<void> {
  console.log('⚡ Running Snapshot Performance Tests...');
  
  try {
    // Test 1: Bulk creation performance
    console.log('  ✓ Testing bulk snapshot creation...');
    const startTime = Date.now();
    const snapshots = await testUtils.createTestSnapshots(100);
    const creationTime = Date.now() - startTime;
    console.log(`    Created 100 snapshots in ${creationTime}ms`);

    // Test 2: Query performance
    console.log('  ✓ Testing query performance...');
    const queryStartTime = Date.now();
    const portfolioSnapshots = await testUtils.getSnapshotsByPortfolio(testConfig.testData.portfolioId);
    const queryTime = Date.now() - queryStartTime;
    console.log(`    Queried ${portfolioSnapshots.length} snapshots in ${queryTime}ms`);

    // Test 3: Count performance
    console.log('  ✓ Testing count performance...');
    const countStartTime = Date.now();
    const totalCount = await testUtils.countSnapshots();
    const countTime = Date.now() - countStartTime;
    console.log(`    Counted ${totalCount} snapshots in ${countTime}ms`);

    // Performance assertions
    if (creationTime > 5000) {
      throw new Error(`Bulk creation too slow: ${creationTime}ms`);
    }
    if (queryTime > 1000) {
      throw new Error(`Query too slow: ${queryTime}ms`);
    }
    if (countTime > 500) {
      throw new Error(`Count too slow: ${countTime}ms`);
    }

    console.log('  ✅ Snapshot Performance Tests passed');

  } catch (error) {
    console.error('  ❌ Snapshot Performance Tests failed:', error);
    throw error;
  }
}

async function runSnapshotErrorHandlingTests(testUtils: TestUtils): Promise<void> {
  console.log('🛡️ Running Snapshot Error Handling Tests...');
  
  try {
    // Test 1: Invalid data handling
    console.log('  ✓ Testing invalid data handling...');
    try {
      await testUtils.createTestSnapshot({
        currentQuantity: -100, // Invalid negative quantity
      });
      throw new Error('Should have failed with invalid data');
    } catch (error) {
      console.log('    Correctly rejected invalid data');
    }

    // Test 2: Missing required fields
    console.log('  ✓ Testing missing required fields...');
    try {
      await testUtils.createTestSnapshot({
        portfolioId: '', // Empty portfolio ID
      });
      throw new Error('Should have failed with missing required field');
    } catch (error) {
      console.log('    Correctly rejected missing required field');
    }

    // Test 3: Duplicate ID handling
    console.log('  ✓ Testing duplicate ID handling...');
    const snapshot1 = await testUtils.createTestSnapshot({
      id: 'duplicate-test-id',
    });
    
    try {
      await testUtils.createTestSnapshot({
        id: 'duplicate-test-id', // Same ID
      });
      throw new Error('Should have failed with duplicate ID');
    } catch (error) {
      console.log('    Correctly handled duplicate ID');
    }

    console.log('  ✅ Snapshot Error Handling Tests passed');

  } catch (error) {
    console.error('  ❌ Snapshot Error Handling Tests failed:', error);
    throw error;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests };
