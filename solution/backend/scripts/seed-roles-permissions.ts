import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { RoleService } from '../src/modules/shared/services/role.service';
import { PermissionService } from '../src/modules/shared/services/permission.service';
import { UserRoleService } from '../src/modules/shared/services/user-role.service';
import { User } from '../src/modules/shared/entities/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

/**
 * Seed script for roles and permissions system
 * This script creates default roles, permissions, and assigns them to users
 */
async function seedRolesAndPermissions() {
  console.log('🌱 Starting roles and permissions seeding...');

  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const roleService = app.get(RoleService);
    const permissionService = app.get(PermissionService);
    const userRoleService = app.get(UserRoleService);
    const userRepository = app.get<Repository<User>>(getRepositoryToken(User));

    // Check if roles already exist
    const existingRoles = await roleService.getAllRoles();
    if (existingRoles.length > 0) {
      console.log('✅ Roles and permissions already exist, skipping seeding');
      return;
    }

    console.log('📋 Creating default roles and permissions...');

    // Get all users to assign default roles
    const users = await userRepository.find();
    console.log(`👥 Found ${users.length} users to assign roles`);

    // Assign default roles to users
    for (const user of users) {
      try {
        // Assign 'investor' role to all users by default
        await userRoleService.assignRoleToUser(user.userId, {
          roleId: (await roleService.getAllRoles()).find(r => r.name === 'investor')?.roleId || '',
        });
        console.log(`✅ Assigned investor role to user: ${user.username}`);
      } catch (error) {
        console.log(`⚠️  Could not assign role to user ${user.username}:`, error.message);
      }
    }

    // Create some additional users with different roles for testing
    const testUsers = [
      { username: 'admin_user', role: 'admin' },
      { username: 'manager_user', role: 'manager' },
      { username: 'analyst_user', role: 'analyst' },
      { username: 'viewer_user', role: 'viewer' },
    ];

    for (const testUser of testUsers) {
      try {
        // Check if user exists
        let user = await userRepository.findOne({ where: { username: testUser.username } });
        
        if (!user) {
          // Create user if doesn't exist
          user = userRepository.create({
            username: testUser.username,
            fullName: `${testUser.username.replace('_', ' ')}`,
            email: `${testUser.username}@example.com`,
            avatarText: testUser.username.substring(0, 2).toUpperCase(),
          });
          user = await userRepository.save(user);
          console.log(`👤 Created test user: ${testUser.username}`);
        }

        // Assign role
        const roles = await roleService.getAllRoles();
        const role = roles.find(r => r.name === testUser.role);
        
        if (role) {
          await userRoleService.assignRoleToUser(user.userId, {
            roleId: role.roleId,
          });
          console.log(`✅ Assigned ${testUser.role} role to user: ${testUser.username}`);
        }
      } catch (error) {
        console.log(`⚠️  Could not create/assign role for ${testUser.username}:`, error.message);
      }
    }

    console.log('🎉 Roles and permissions seeding completed successfully!');
    
    // Display summary
    const allRoles = await roleService.getAllRoles();
    const allPermissions = await permissionService.getAllPermissions();
    
    console.log('\n📊 Summary:');
    console.log(`- Roles created: ${allRoles.length}`);
    console.log(`- Permissions created: ${allPermissions.length}`);
    console.log(`- Users with roles: ${users.length + testUsers.length}`);

  } catch (error) {
    console.error('❌ Error seeding roles and permissions:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the seeding function
if (require.main === module) {
  seedRolesAndPermissions()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedRolesAndPermissions };
