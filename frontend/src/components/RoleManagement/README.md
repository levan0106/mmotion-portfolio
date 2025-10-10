# Frontend Role & Permission System

## Overview
This directory contains the frontend implementation of the role and permission system for the Portfolio Management System. It provides a complete UI for managing user roles, permissions, and access control.

## Components

### Core Components

#### 1. **RoleList** (`RoleList.tsx`)
- Displays all system roles in a table format
- Shows role details, permissions count, and status
- Provides actions for editing, deleting, and managing roles
- Features:
  - Role priority indicators
  - System vs custom role distinction
  - Permission count display
  - Action menu with role operations

#### 2. **RoleForm** (`RoleForm.tsx`)
- Modal form for creating and editing roles
- Features:
  - Role name and display name input
  - Description field
  - Priority slider (0-100)
  - System role toggle
  - Permission assignment interface
  - Form validation

#### 3. **PermissionManager** (`PermissionManager.tsx`)
- Interface for managing role permissions
- Features:
  - Permission search functionality
  - Category-based organization
  - Bulk permission selection
  - Visual permission assignment

#### 4. **UserRoleAssignment** (`UserRoleAssignment.tsx`)
- Component for assigning roles to users
- Features:
  - Role selection dropdown
  - Expiration date setting
  - Metadata support
  - Role status management
  - User role editing

### Utility Components

#### 5. **PermissionGate** (`../Common/PermissionGate.tsx`)
- Conditional rendering based on permissions
- Usage:
  ```tsx
  <PermissionGate permission="portfolios.create">
    <Button>Create Portfolio</Button>
  </PermissionGate>
  ```

#### 6. **RoleGate** (`../Common/PermissionGate.tsx`)
- Conditional rendering based on roles
- Usage:
  ```tsx
  <RoleGate role="admin">
    <Button>Admin Panel</Button>
  </RoleGate>
  ```

#### 7. **UserPermissionsDisplay** (`../Common/UserPermissionsDisplay.tsx`)
- Shows user's current permissions and roles
- Features:
  - Compact and detailed views
  - Permission categorization
  - Role status indicators
  - Refresh functionality

## Hooks

### 1. **useUserPermissions**
```tsx
const {
  userPermissions,
  userRoles,
  hasPermission,
  hasRole,
  isLoading
} = useUserPermissions(userId);
```

### 2. **useRoles**
```tsx
const {
  roles,
  createRole,
  updateRole,
  deleteRole,
  isLoading
} = useRoles();
```

### 3. **usePermissions**
```tsx
const {
  permissions,
  permissionsByCategory,
  searchPermissions,
  isLoading
} = usePermissions();
```

### 4. **useRoleManagement**
```tsx
const {
  assignRole,
  removeRole,
  updateUserRole,
  isAssigning
} = useRoleManagement();
```

## Services

### 1. **RoleService**
- API calls for role management
- Methods: `getRoles()`, `createRole()`, `updateRole()`, `deleteRole()`

### 2. **PermissionService**
- API calls for permission management
- Methods: `getPermissions()`, `searchPermissions()`, `getPermissionsByCategory()`

### 3. **UserRoleService**
- API calls for user role management
- Methods: `assignRoleToUser()`, `getUserRoles()`, `getUserPermissions()`

## Pages

### 1. **RoleManagement** (`../pages/RoleManagement.tsx`)
- Main page for role and permission management
- Features:
  - Tabbed interface (Roles, Users, Settings)
  - Role list with actions
  - Permission management
  - User role assignment

## Usage Examples

### Basic Permission Checking
```tsx
import { PermissionGate } from '../Common/PermissionGate';

function PortfolioActions() {
  return (
    <div>
      <PermissionGate permission="portfolios.read">
        <Button>View Portfolios</Button>
      </PermissionGate>
      
      <PermissionGate permission="portfolios.create">
        <Button>Create Portfolio</Button>
      </PermissionGate>
      
      <PermissionGate permission="portfolios.delete">
        <Button color="error">Delete Portfolio</Button>
      </PermissionGate>
    </div>
  );
}
```

### Multiple Permission Requirements
```tsx
// Require ALL permissions (AND logic)
<PermissionGate 
  permissions={['portfolios.read', 'financial.read']}
  requireAll={true}
>
  <Button>Advanced Analysis</Button>
</PermissionGate>

// Require ANY permission (OR logic)
<PermissionGate 
  permissions={['trades.create', 'trades.approve']}
  requireAll={false}
>
  <Button>Trading Operations</Button>
</PermissionGate>
```

### Role-based Access
```tsx
import { RoleGate } from '../Common/PermissionGate';

function AdminPanel() {
  return (
    <RoleGate role="admin">
      <Button>Admin Settings</Button>
    </RoleGate>
  );
}
```

### Fallback Content
```tsx
<PermissionGate 
  permission="system.settings"
  fallback={
    <Alert severity="warning">
      You don't have permission to access system settings
    </Alert>
  }
>
  <Button>System Settings</Button>
</PermissionGate>
```

### Direct Permission Checks
```tsx
import { useUserPermissions } from '../../hooks/useUserPermissions';

function MyComponent() {
  const { hasPermission, hasRole } = useUserPermissions();
  
  return (
    <div>
      {hasPermission('portfolios.create') && (
        <Button>Create Portfolio</Button>
      )}
      
      {hasRole('admin') && (
        <Button>Admin Panel</Button>
      )}
    </div>
  );
}
```

## Navigation

The role management page is accessible via:
- **URL**: `/role-management`
- **Navigation**: Sidebar menu item "Role Management"
- **Icon**: Security icon
- **Badge**: "NEW"

## Features

### 1. **Role Management**
- Create, edit, and delete roles
- Set role priority and description
- Assign permissions to roles
- System vs custom role distinction

### 2. **Permission Management**
- View all system permissions
- Search and filter permissions
- Category-based organization
- Permission assignment interface

### 3. **User Role Assignment**
- Assign roles to users
- Set role expiration dates
- Add metadata to role assignments
- Manage role status (active/inactive)

### 4. **Permission-based UI**
- Conditional rendering based on permissions
- Role-based access control
- Fallback content for unauthorized users
- Direct permission checking

### 5. **User Experience**
- Responsive design
- Loading states
- Error handling
- Success notifications
- Intuitive interface

## Security Considerations

### 1. **Client-side Protection**
- Permission gates prevent unauthorized UI rendering
- Role gates control access to admin functions
- Fallback content for unauthorized users

### 2. **Server-side Validation**
- All API calls are protected by backend guards
- Permission validation on every request
- Role hierarchy enforcement

### 3. **Data Security**
- Sensitive operations require specific permissions
- Role assignments are audited
- Permission changes are tracked

## Best Practices

### 1. **Permission Naming**
- Use consistent naming: `resource.action`
- Examples: `portfolios.create`, `users.delete`, `system.settings`

### 2. **Component Organization**
- Group related permissions together
- Use clear, descriptive permission names
- Provide helpful fallback messages

### 3. **Performance**
- Use React Query for caching
- Implement loading states
- Optimize permission checks

### 4. **User Experience**
- Show clear error messages
- Provide helpful fallback content
- Use consistent UI patterns

## Testing

### 1. **Unit Tests**
- Test permission gates
- Test role gates
- Test hook functionality

### 2. **Integration Tests**
- Test API integration
- Test user workflows
- Test permission changes

### 3. **E2E Tests**
- Test complete user journeys
- Test role assignment workflows
- Test permission-based navigation

## Future Enhancements

### 1. **Advanced Features**
- Role templates
- Bulk role assignments
- Permission inheritance
- Time-based permissions

### 2. **UI Improvements**
- Drag-and-drop permission assignment
- Visual permission hierarchy
- Advanced search and filtering
- Permission analytics

### 3. **Integration**
- SSO integration
- External role providers
- API key management
- Webhook notifications

This frontend role and permission system provides a complete, production-ready solution for managing user access control in the Portfolio Management System.
