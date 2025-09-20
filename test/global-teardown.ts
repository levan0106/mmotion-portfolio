// Global Teardown for Docker Integration Tests

export default async function globalTeardown() {
  console.log('🧹 Starting global teardown for Docker integration tests...');

  try {
    // Clean up any test data or resources
    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    throw error;
  }
}
