const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function testWithAuth() {
  console.log('🔐 Testing with Authentication...\n');

  try {
    // First, try to login to get a token
    console.log('1️⃣ Attempting login...');
    let token = null;
    
    try {
      const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login-or-register`, {
        username: 'admin@example.com',
        password: 'admin123'
      });
      
      token = loginResponse.data.token;
      console.log('✅ Login successful, token received');
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data || error.message);
      console.log('📝 Trying without authentication...\n');
    }

    // Test endpoints with token if available
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Test 1: Get current user roles
    console.log('2️⃣ Testing GET /api/v1/users/me/roles');
    try {
      const response = await axios.get(`${API_BASE}/api/v1/users/me/roles`, { headers });
      console.log('✅ Success:', response.status);
      console.log('📊 Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Get permissions by category
    console.log('3️⃣ Testing GET /api/v1/roles/permissions/categories');
    try {
      const response = await axios.get(`${API_BASE}/api/v1/roles/permissions/categories`, { headers });
      console.log('✅ Success:', response.status);
      console.log('📊 Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Get all roles
    console.log('4️⃣ Testing GET /api/v1/roles');
    try {
      const response = await axios.get(`${API_BASE}/api/v1/roles`, { headers });
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
testWithAuth();
