import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Fab,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { RoleList } from '../components/RoleManagement/RoleList';
import { RoleForm } from '../components/RoleManagement/RoleForm';
import { RoleDetails } from '../components/RoleManagement/RoleDetails';
import { PermissionManager } from '../components/RoleManagement/PermissionManager';
import { UserRoleManager } from '../components/RoleManagement/UserRoleManager';
import { UserRoleAssignment } from '../components/RoleManagement/UserRoleAssignment';
import { UserList } from '../components/RoleManagement/UserList';
import { UserDetails } from '../components/RoleManagement/UserDetails';
import { UserForm } from '../components/RoleManagement/UserForm';
import { Settings } from '../components/RoleManagement/Settings';
import { PermissionGuard } from '../components/Common/PermissionGuard';
import { ToastService } from '../services/toast';
import { useRoles } from '../hooks/useRoles';
import { Role } from '../services/api.role';
import { User, UserApi } from '../services/api.user';
import { UserRoleApi } from '../services/api.role';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`role-tabpanel-${index}`}
      aria-labelledby={`role-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const RoleManagement: React.FC = () => {
  return (
    <PermissionGuard 
      role="super_admin"
    >
      <RoleManagementContent />
    </PermissionGuard>
  );
};

const RoleManagementContent: React.FC = () => {
  const { roles, isLoading, error, assignPermissions, isAssigningPermissions } = useRoles();
  // const { users, isLoading: isLoadingUsers, error: usersError } = useUsers();
  const [tabValue, setTabValue] = useState(0);
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [roleDetailsOpen, setRoleDetailsOpen] = useState(false);
  const [permissionManagerOpen, setPermissionManagerOpen] = useState(false);
  const [userRoleManagerOpen, setUserRoleManagerOpen] = useState(false);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [userRoleAssignmentOpen, setUserRoleAssignmentOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateRole = () => {
    setSelectedRole(null);
    setFormMode('create');
    setRoleFormOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setFormMode('edit');
    setRoleFormOpen(true);
  };

  const handleViewRole = (role: Role) => {
    setSelectedRole(role);
    setRoleDetailsOpen(true);
  };

  const handleDeleteRole = (_role: Role) => {
    // Handle role deletion
  };

  const handleManagePermissions = (role: Role) => {
    setSelectedRole(role);
    setPermissionManagerOpen(true);
  };

  const handleManageUsers = (role: Role) => {
    setSelectedRole(role);
    setUserRoleManagerOpen(true);
  };

  const handleRoleFormClose = () => {
    setRoleFormOpen(false);
    setSelectedRole(null);
  };

  const handlePermissionManagerClose = () => {
    setPermissionManagerOpen(false);
    setSelectedRole(null);
  };

  const handleUserRoleManagerClose = () => {
    setUserRoleManagerOpen(false);
    setSelectedRole(null);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setFormMode('create');
    setUserFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormMode('edit');
    setUserFormOpen(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setUserDetailsOpen(true);
  };

  const handleDeleteUser = async (user: User) => {
    try {
      // Call API to delete user
      await UserApi.deleteUser(user.userId);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const handleManageUserRoles = (user: User) => {
    setSelectedUser(user);
    setUserRoleAssignmentOpen(true);
  };

  const handleUserFormClose = () => {
    setUserFormOpen(false);
    setSelectedUser(null);
  };

  const handleUserDetailsClose = () => {
    setUserDetailsOpen(false);
    setSelectedUser(null);
  };

  const handleUserRoleAssignmentClose = () => {
    setUserRoleAssignmentOpen(false);
    setSelectedUser(null);
  };

  const handleUserSubmit = async (userData: Partial<User>) => {
    try {
      if (formMode === 'create') {
        // Create new user
        const newUser = await UserApi.createUser(userData);
        ToastService.success(`User "${userData.email}" created successfully!`);
        
        // Auto assign default role if enabled
        // Get default role from settings (this would need to be implemented)
        const defaultRoleName = 'viewer'; // This should come from settings
        const defaultRole = roles?.find(role => role.name === defaultRoleName);
        
        if (defaultRole && newUser.userId) {
          try {
            await UserRoleApi.assignRoleToUser(newUser.userId, { roleId: defaultRole.roleId });
            ToastService.info(`User automatically assigned "${defaultRole.displayName}" role`);
          } catch (roleError) {
            console.error('Error assigning default role:', roleError);
            ToastService.warning('User created but failed to assign default role');
          }
        }
      } else {
        // Update existing user
        if (selectedUser?.userId) {
          await UserApi.updateUser(selectedUser.userId, userData);
          ToastService.success(`User "${userData.email}" updated successfully!`);
        }
      }
      
      setUserFormOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error handling user submit:', error);
      ToastService.error('Failed to save user');
    }
  };

  const handlePermissionSave = (permissionIds: string[]) => {
    if (!selectedRole) return;

    // Call API to assign permissions to role
    assignPermissions({ roleId: selectedRole.roleId, permissionIds });
    
    // Close dialog after successful API call
    // The mutation will handle success/error states
    setPermissionManagerOpen(false);
    setSelectedRole(null);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Error loading roles: {error instanceof Error ? error.message : 'Unknown error'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Role & Permission Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage user roles and permissions for the system
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab
            icon={<SecurityIcon />}
            label="Roles"
            id="role-tab-0"
            aria-controls="role-tabpanel-0"
          />
          <Tab
            icon={<PersonIcon />}
            label="Users"
            id="role-tab-1"
            aria-controls="role-tabpanel-1"
          />
          <Tab
            icon={<SettingsIcon />}
            label="Settings"
            id="role-tab-2"
            aria-controls="role-tabpanel-2"
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    System Roles
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateRole}
                  >
                    Create Role
                  </Button>
                </Box>
                <RoleList
                  onEditRole={handleEditRole}
                  onViewRole={handleViewRole}
                  onDeleteRole={handleDeleteRole}
                  onManagePermissions={handleManagePermissions}
                  onManageUsers={handleManageUsers}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    System Users
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateUser}
                  >
                    Create User
                  </Button>
                </Box>
                <UserList
                  onEditUser={handleEditUser}
                  onViewUser={handleViewUser}
                  onDeleteUser={handleDeleteUser}
                  onManageRoles={handleManageUserRoles}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Settings />
      </TabPanel>

      {/* Role Form Dialog */}
      <RoleForm
        open={roleFormOpen}
        onClose={handleRoleFormClose}
        role={selectedRole}
        mode={formMode}
      />

      {/* Permission Manager Dialog */}
      <PermissionManager
        open={permissionManagerOpen}
        onClose={handlePermissionManagerClose}
        role={selectedRole}
        onSave={handlePermissionSave}
        isLoading={isAssigningPermissions}
      />

      {/* Role Details Dialog */}
      <RoleDetails
        open={roleDetailsOpen}
        onClose={() => setRoleDetailsOpen(false)}
        role={selectedRole}
        onEdit={handleEditRole}
        onManagePermissions={handleManagePermissions}
        onManageUsers={handleManageUsers}
      />

      {/* User Role Manager Dialog */}
      <UserRoleManager
        open={userRoleManagerOpen}
        onClose={handleUserRoleManagerClose}
        role={selectedRole}
      />

      {/* User Form Dialog */}
      <UserForm
        open={userFormOpen}
        onClose={handleUserFormClose}
        user={selectedUser}
        mode={formMode}
        onSubmit={handleUserSubmit}
        isLoading={false}
        error={null}
      />

      {/* User Details Dialog */}
      <UserDetails
        open={userDetailsOpen}
        onClose={handleUserDetailsClose}
        user={selectedUser}
        onEdit={handleEditUser}
        onManageRoles={handleManageUserRoles}
      />

      {/* User Role Assignment Dialog */}
      <UserRoleAssignment
        open={userRoleAssignmentOpen}
        onClose={handleUserRoleAssignmentClose}
        user={selectedUser}
      />

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add role"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={handleCreateRole}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
};
