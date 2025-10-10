const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function testUserRolesAPI() {
  console.log('🧪 Testing User Roles API...\n');

  try {
    // Test 1: Get current user roles
    console.log('1️⃣ Testing GET /api/v1/users/me/roles');
    try {
      const response = await axios.get(`${API_BASE}/api/v1/users/me/roles`);
      console.log('✅ Success:', response.status);
      console.log('📊 Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Get permissions by category
    console.log('2️⃣ Testing GET /api/v1/roles/permissions/categories');
    try {
      const response = await axios.get(`${API_BASE}/api/v1/roles/permissions/categories`);
      console.log('✅ Success:', response.status);
      console.log('📊 Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Get all roles
    console.log('3️⃣ Testing GET /api/v1/roles');
    try {
      const response = await axios.get(`${API_BASE}/api/v1/roles`);
      console.log('✅ Success:', response.status);
      console.log('📊 Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testUserRolesAPI();
