import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  // Fab,
  Tabs,
  Tab,
  Paper,
  useTheme,
} from '@mui/material';
import { ResponsiveButton } from '../components/Common';
import {
  Add as AddIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  CameraAlt as SnapshotIcon,
  Assessment as TrackingIcon,
  AccountBalance as PortfolioIcon,
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
import { AutomatedSnapshotManagement } from '../components/AutomatedSnapshot/AutomatedSnapshotManagement';
import SnapshotTrackingDashboard from '../components/SnapshotTracking/SnapshotTrackingDashboard';
import AdminPortfolioList from './AdminPortfolioList';
import { PermissionGuard } from '../components/Common/PermissionGuard';
import { ToastService } from '../services/toast';
import { useRoles } from '../hooks/useRoles';
import { useUsers } from '../hooks/useUsers';
import { Role } from '../services/api.role';
import { User, UserApi } from '../services/api.user';
import { UserRoleApi } from '../services/api.role';
import ResponsiveTypography from '../components/Common/ResponsiveTypography';

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

export const AdminManagement: React.FC = () => {
  return (
    <PermissionGuard 
      role="super_admin"
    >
      <AdminManagementContent />
    </PermissionGuard>
  );
};

const AdminManagementContent: React.FC = () => {
  const theme = useTheme();
  
  // Pagination state for roles
  const [rolePage, setRolePage] = useState(0);
  const [roleRowsPerPage, setRoleRowsPerPage] = useState(10);
  
  // Pagination state for users
  const [userPage, setUserPage] = useState(0);
  const [userRowsPerPage, setUserRowsPerPage] = useState(10);
  
  const { roles, isLoading, error, assignPermissions, isAssigningPermissions, total: totalRoles, deleteRole, isDeleting } = useRoles({
    page: rolePage + 1, // Convert to 1-based for API
    limit: roleRowsPerPage
  });
  const { users, total: totalUsers, isLoading: isLoadingUsers, error: usersError, refetch: refetchUsers } = useUsers({
    page: userPage + 1, // Convert to 1-based for API
    limit: userRowsPerPage
  });
  
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

  // Pagination handlers for roles
  const handleRolePageChange = (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setRolePage(newPage);
  };

  const handleRoleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRoleRowsPerPage(parseInt(event.target.value, 10));
    setRolePage(0);
  };

  // Pagination handlers for users
  const handleUserPageChange = (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setUserPage(newPage);
  };

  const handleUserRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserRowsPerPage(parseInt(event.target.value, 10));
    setUserPage(0);
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
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">
          Error loading roles: {error instanceof Error ? error.message : 'Unknown error'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      
      <Box sx={{ mb: 4 }}>
        <ResponsiveTypography 
          variant="pageHeader" 
          component="h1" 
          sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
            filter: 'none'
          }}
        >
          System Administration
        </ResponsiveTypography>
        <ResponsiveTypography variant="pageSubtitle">
          Manage system roles, users, permissions, and automated processes
        </ResponsiveTypography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ px: 2 }}
        >
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
          <Tab 
            icon={<SnapshotIcon />}
            label="Automated Snapshots"
            id="role-tab-3"
            aria-controls="role-tabpanel-3"
          />
          <Tab 
            icon={<TrackingIcon />}
            label="Snapshot Tracking"
            id="role-tab-4"
            aria-controls="role-tabpanel-4"
          />
          <Tab 
            icon={<PortfolioIcon />}
            label="Portfolios"
            id="role-tab-5"
            aria-controls="role-tabpanel-5"
          />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <ResponsiveTypography variant="cardTitle">
                    System Roles
                  </ResponsiveTypography>
                  <ResponsiveButton
                    variant="contained"
                    icon={<AddIcon />}
                    onClick={handleCreateRole}
                    mobileText="Create"
                    desktopText="Create Role"
                  >
                    Create Role
                  </ResponsiveButton>
                </Box>
                <RoleList
                  onEditRole={handleEditRole}
                  onViewRole={handleViewRole}
                  onDeleteRole={handleDeleteRole}
                  onManagePermissions={handleManagePermissions}
                  onManageUsers={handleManageUsers}
                  page={rolePage}
                  rowsPerPage={roleRowsPerPage}
                  total={totalRoles}
                  onPageChange={handleRolePageChange}
                  onRowsPerPageChange={handleRoleRowsPerPageChange}
                  roles={roles}
                  isLoading={isLoading}
                  error={error}
                  deleteRole={deleteRole}
                  isDeleting={isDeleting}
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
                  <ResponsiveTypography variant="cardTitle">
                    System Users
                  </ResponsiveTypography>
                  <ResponsiveButton
                    variant="contained"
                    icon={<AddIcon />}
                    onClick={handleCreateUser}
                    mobileText="Create"
                    desktopText="Create User"
                  >
                    Create User
                  </ResponsiveButton>
                </Box>
                <UserList
                  onEditUser={handleEditUser}
                  onViewUser={handleViewUser}
                  onDeleteUser={handleDeleteUser}
                  onManageRoles={handleManageUserRoles}
                  page={userPage}
                  rowsPerPage={userRowsPerPage}
                  total={totalUsers}
                  onPageChange={handleUserPageChange}
                  onRowsPerPageChange={handleUserRowsPerPageChange}
                  users={users}
                  isLoading={isLoadingUsers}
                  error={usersError}
                  refetch={refetchUsers}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Settings />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <AutomatedSnapshotManagement />
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <SnapshotTrackingDashboard />
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <AdminPortfolioList />
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
      {/* <Fab
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
      </Fab> */}
    </Box>
  );
};
