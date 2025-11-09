# Role & Permission System Usage Examples

## Overview
This document provides practical examples of how to use the role and permission system in the Portfolio Management System.

## Basic Usage Examples

### 1. Protecting Controller Methods with Permissions

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PermissionGuard } from '../shared/guards/permission.guard';
import { RequirePermissions } from '../shared/decorators/permissions.decorator';

@Controller('api/v1/portfolios')
@UseGuards(PermissionGuard)
export class PortfolioController {
  
  @Get()
  @RequirePermissions(['portfolios.read'])
  async getAllPortfolios() {
    // Only users with 'portfolios.read' permission can access
  }

  @Post()
  @RequirePermissions(['portfolios.create'])
  async createPortfolio() {
    // Only users with 'portfolios.create' permission can access
  }

  @Put(':id')
  @RequirePermissions(['portfolios.update'])
  async updatePortfolio() {
    // Only users with 'portfolios.update' permission can access
  }

  @Delete(':id')
  @RequirePermissions(['portfolios.delete'])
  async deletePortfolio() {
    // Only users with 'portfolios.delete' permission can access
  }
}
```

### 2. Protecting with Multiple Permissions

```typescript
@Controller('api/v1/trades')
@UseGuards(PermissionGuard)
export class TradeController {
  
  @Post()
  @RequirePermissions(['trades.create', 'trades.approve'])
  async createTrade() {
    // User needs BOTH 'trades.create' AND 'trades.approve' permissions
  }

  @Get('sensitive')
  @RequirePermissions(['trades.read', 'financial.audit'])
  async getSensitiveTrades() {
    // User needs BOTH permissions for sensitive data
  }
}
```

### 3. Using Role-based Protection

```typescript
import { RoleGuard } from '../shared/guards/role.guard';
import { RequireRoles } from '../shared/decorators/permissions.decorator';

@Controller('api/v1/admin')
@UseGuards(RoleGuard)
export class AdminController {
  
  @Get('users')
  @RequireRoles(['admin', 'super_admin'])
  async getAllUsers() {
    // Only admin and super_admin roles can access
  }

  @Post('system-settings')
  @RequireRoles(['super_admin'])
  async updateSystemSettings() {
    // Only super_admin role can access
  }
}
```

### 4. Combining Guards

```typescript
@Controller('api/v1/financial')
@UseGuards(PermissionGuard, RoleGuard)
export class FinancialController {
  
  @Get('reports')
  @RequirePermissions(['financial.read'])
  @RequireRoles(['analyst', 'manager', 'admin'])
  async getFinancialReports() {
    // User needs permission AND appropriate role
  }
}
```

## Service-level Permission Checking

### 1. Checking Permissions in Services

```typescript
import { Injectable } from '@nestjs/common';
import { UserRoleService } from '../shared/services/user-role.service';

@Injectable()
export class PortfolioService {
  constructor(private userRoleService: UserRoleService) {}

  async getPortfolio(userId: string, portfolioId: string) {
    // Check if user has permission to view this portfolio
    const hasPermission = await this.userRoleService.userHasPermission(
      userId, 
      'portfolios.read'
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Continue with business logic
  }

  async createPortfolio(userId: string, portfolioData: any) {
    // Check multiple permissions
    const hasAllPermissions = await this.userRoleService.userHasAllPermissions(
      userId,
      ['portfolios.create', 'portfolios.manage_users']
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Continue with business logic
  }
}
```

### 2. Conditional Logic Based on Permissions

```typescript
@Injectable()
export class TradeService {
  constructor(private userRoleService: UserRoleService) {}

  async executeTrade(userId: string, tradeData: any) {
    // Check if user can execute trades
    const canExecute = await this.userRoleService.userHasPermission(
      userId,
      'trades.create'
    );

    if (!canExecute) {
      throw new ForbiddenException('Cannot execute trades');
    }

    // Check if trade requires approval
    const requiresApproval = tradeData.amount > 1000000; // 1M threshold
    
    if (requiresApproval) {
      const canApprove = await this.userRoleService.userHasPermission(
        userId,
        'trades.approve'
      );

      if (!canApprove) {
        // Create pending trade for approval
        return this.createPendingTrade(tradeData);
      }
    }

    // Execute trade immediately
    return this.executeTradeImmediately(tradeData);
  }
}
```

## Frontend Integration Examples

### 1. Permission-based UI Rendering

```typescript
// React component example
import { useUserPermissions } from '../hooks/useUserPermissions';

export const PortfolioActions = ({ portfolioId }) => {
  const { hasPermission } = useUserPermissions();

  return (
    <div>
      {hasPermission('portfolios.update') && (
        <Button onClick={() => editPortfolio(portfolioId)}>
          Edit Portfolio
        </Button>
      )}
      
      {hasPermission('portfolios.delete') && (
        <Button 
          color="error" 
          onClick={() => deletePortfolio(portfolioId)}
        >
          Delete Portfolio
        </Button>
      )}
      
      {hasPermission('trades.create') && (
        <Button onClick={() => createTrade(portfolioId)}>
          New Trade
        </Button>
      )}
    </div>
  );
};
```

### 2. Role-based Navigation

```typescript
// Navigation component
export const Navigation = () => {
  const { hasRole } = useUserRoles();

  return (
    <nav>
      <Link to="/portfolios">Portfolios</Link>
      <Link to="/trades">Trades</Link>
      
      {hasRole('admin') && (
        <Link to="/admin">Admin Panel</Link>
      )}
      
      {hasRole('analyst') && (
        <Link to="/reports">Reports</Link>
      )}
      
      {hasRole('super_admin') && (
        <Link to="/system">System Settings</Link>
      )}
    </nav>
  );
};
```

## API Usage Examples

### 1. Creating Roles and Permissions

```bash
# Create a new role
curl -X POST http://localhost:3000/api/v1/roles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "portfolio_manager",
    "displayName": "Portfolio Manager",
    "description": "Manages portfolios and trading operations",
    "permissionIds": ["portfolios.create", "portfolios.read", "portfolios.update", "trades.create"]
  }'

# Assign role to user
curl -X POST http://localhost:3000/api/v1/users/{userId}/roles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": "role-uuid",
    "expiresAt": "2024-12-31T23:59:59Z"
  }'
```

### 2. Checking User Permissions

```bash
# Get user permissions
curl -X GET http://localhost:3000/api/v1/users/{userId}/permissions \
  -H "Authorization: Bearer <token>"

# Check specific permission
curl -X GET http://localhost:3000/api/v1/users/{userId}/permissions/check \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"permission": "portfolios.create"}'
```

## Database Queries Examples

### 1. Finding Users with Specific Roles

```sql
-- Find all users with 'admin' role
SELECT u.username, u.full_name, r.name as role_name
FROM users u
JOIN user_roles ur ON u.user_id = ur.user_id
JOIN roles r ON ur.role_id = r.role_id
WHERE r.name = 'admin' AND ur.is_active = true;

-- Find users with expired roles
SELECT u.username, ur.expires_at
FROM users u
JOIN user_roles ur ON u.user_id = ur.user_id
WHERE ur.expires_at < NOW() AND ur.is_active = true;
```

### 2. Permission Analysis

```sql
-- Find all permissions for a specific role
SELECT p.name, p.display_name, p.category
FROM roles r
JOIN role_permissions rp ON r.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.permission_id
WHERE r.name = 'investor';

-- Find roles that have a specific permission
SELECT r.name, r.display_name
FROM roles r
JOIN role_permissions rp ON r.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.permission_id
WHERE p.name = 'trades.create';
```

## Best Practices

### 1. Permission Naming Convention

```typescript
// Use consistent naming: resource.action
const PERMISSIONS = {
  // User management
  'users.create': 'Create Users',
  'users.read': 'View Users',
  'users.update': 'Update Users',
  'users.delete': 'Delete Users',
  
  // Portfolio management
  'portfolios.create': 'Create Portfolios',
  'portfolios.read': 'View Portfolios',
  'portfolios.update': 'Update Portfolios',
  'portfolios.delete': 'Delete Portfolios',
  
  // Trading operations
  'trades.create': 'Execute Trades',
  'trades.read': 'View Trades',
  'trades.update': 'Update Trades',
  'trades.delete': 'Cancel Trades',
  'trades.approve': 'Approve Trades',
};
```

### 2. Role Hierarchy

```typescript
// Define role hierarchy for inheritance
const ROLE_HIERARCHY = {
  'super_admin': ['admin', 'manager', 'analyst', 'investor', 'viewer'],
  'admin': ['manager', 'analyst', 'investor', 'viewer'],
  'manager': ['analyst', 'investor', 'viewer'],
  'analyst': ['viewer'],
  'investor': ['viewer'],
  'viewer': [],
};
```

### 3. Security Considerations

```typescript
// Always validate permissions on sensitive operations
@Post('sensitive-operation')
@RequirePermissions(['system.settings'])
async sensitiveOperation() {
  // Additional validation
  const user = this.getCurrentUser();
  
  // Check if user is active
  if (!user.isActive) {
    throw new ForbiddenException('User account is inactive');
  }
  
  // Check if user has recent activity (security check)
  const lastActivity = await this.getUserLastActivity(user.userId);
  if (this.isStaleActivity(lastActivity)) {
    throw new ForbiddenException('Session expired');
  }
  
  // Proceed with operation
}
```

## Testing Examples

### 1. Unit Testing Permission Guards

```typescript
describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let userRoleService: UserRoleService;

  beforeEach(() => {
    userRoleService = {
      userHasAllPermissions: jest.fn(),
    } as any;
    
    guard = new PermissionGuard(new Reflector(), userRoleService);
  });

  it('should allow access when user has required permissions', async () => {
    userRoleService.userHasAllPermissions.mockResolvedValue(true);
    
    const context = createMockExecutionContext(['portfolios.read']);
    const result = await guard.canActivate(context);
    
    expect(result).toBe(true);
  });

  it('should deny access when user lacks required permissions', async () => {
    userRoleService.userHasAllPermissions.mockResolvedValue(false);
    
    const context = createMockExecutionContext(['portfolios.read']);
    
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
```

### 2. Integration Testing

```typescript
describe('Role Management API', () => {
  it('should create role with permissions', async () => {
    const roleData = {
      name: 'test_role',
      displayName: 'Test Role',
      permissionIds: ['portfolios.read', 'trades.create']
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(roleData)
      .expect(201);

    expect(response.body.name).toBe('test_role');
    expect(response.body.permissions).toHaveLength(2);
  });
});
```

This comprehensive role and permission system provides:

- **Security**: Proper access control for all operations
- **Flexibility**: Easy role and permission management
- **Scalability**: Support for complex permission hierarchies
- **Audit**: Complete tracking of role assignments
- **User Experience**: Intuitive permission-based UI

The system is production-ready and follows security best practices for financial applications.
