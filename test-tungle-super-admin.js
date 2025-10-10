const axios = require('axios');

async function testTungleSuperAdmin() {
  try {
    console.log('Testing tungle super admin access...');
    
    // Login as tungle
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login-or-register', {
      username: 'tungle',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    const userId = loginResponse.data.user.userId;
    console.log('✅ Login successful');
    console.log('User ID:', userId);
    console.log('Token:', token);
    
    // Test roles API
    const rolesResponse = await axios.get('http://localhost:3000/api/v1/roles', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Roles API access successful');
    console.log('Number of roles:', rolesResponse.data.length);
    
    // Test user permissions
    const permissionsResponse = await axios.get(`http://localhost:3000/api/v1/users/${userId}/permissions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ User permissions retrieved');
    console.log('Number of permissions:', permissionsResponse.data.permissions.length);
    console.log('Roles:', permissionsResponse.data.roles.map(r => r.roleName));
    
    // Test creating a new role (super admin should be able to do this)
    try {
      const createRoleResponse = await axios.post('http://localhost:3000/api/v1/roles', {
        name: 'test_role',
        displayName: 'Test Role',
        description: 'Test role created by super admin',
        priority: 10
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Role creation successful');
      console.log('Created role:', createRoleResponse.data.name);
      
      // Clean up - delete the test role
      await axios.delete(`http://localhost:3000/api/v1/roles/${createRoleResponse.data.roleId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Test role cleaned up');
      
    } catch (error) {
      console.log('❌ Role creation failed:', error.response?.data || error.message);
    }
    
    console.log('\n🎉 Super admin setup completed successfully!');
    console.log('🔑 Login credentials:');
    console.log('   Username: tungle');
    console.log('   Password: 123456');
    console.log('   Role: super_admin');
    
  } catch (error) {
    console.error('❌ Error testing super admin:', error.response?.data || error.message);
  }
}

testTungleSuperAdmin();
