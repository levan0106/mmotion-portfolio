import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
// import { useRoles } from '../../hooks/useRoles'; // Removed - using props instead
import { Role } from '../../services/api.role';
import { ResponsiveButton, ActionButton } from '../Common';

interface RoleListProps {
  onEditRole?: (role: Role) => void;
  onViewRole?: (role: Role) => void;
  onDeleteRole?: (role: Role) => void;
  onManagePermissions?: (role: Role) => void;
  onManageUsers?: (role: Role) => void;
  page?: number;
  rowsPerPage?: number;
  total?: number;
  onPageChange?: (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  roles?: Role[];
  isLoading?: boolean;
  error?: any;
  deleteRole?: (roleId: string) => void;
  isDeleting?: boolean;
}

export const RoleList: React.FC<RoleListProps> = ({
  onEditRole,
  onViewRole,
  onManagePermissions,
  onManageUsers,
  page = 0,
  rowsPerPage = 10,
  total = 0,
  onPageChange,
  onRowsPerPageChange,
  roles = [],
  isLoading = false,
  error = null,
  deleteRole = () => {},
  isDeleting = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, role: Role) => {
    setAnchorEl(event.currentTarget);
    setSelectedRole(role);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRole(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (selectedRole) {
      try {
        await deleteRole(selectedRole.roleId);
        setDeleteDialogOpen(false);
        setSelectedRole(null);
      } catch (error) {
        console.error('Error deleting role:', error);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedRole(null);
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 90) return 'error';
    if (priority >= 70) return 'warning';
    if (priority >= 50) return 'info';
    return 'default';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 90) return 'Critical';
    if (priority >= 70) return 'High';
    if (priority >= 50) return 'Medium';
    return 'Low';
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Error loading roles: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" component="h2">
              Roles Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {roles?.length || 0} roles
            </Typography>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Display Name</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles?.map((role: any) => (
                  <TableRow 
                    key={role.roleId} 
                    hover 
                    onClick={() => onViewRole?.(role)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <SecurityIcon color="primary" />
                        <Typography variant="body2" fontWeight="medium">
                          {role.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {role.displayName}
                      </Typography>
                      {role.description && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {role.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getPriorityLabel(role.priority)}
                        color={getPriorityColor(role.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={role.isSystemRole ? 'System' : 'Custom'}
                        color={role.isSystemRole ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {role.permissions?.length || 0} permissions
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(role.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, role);
                        }}
                        disabled={isDeleting}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={total || roles?.length || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={onPageChange || (() => {})}
            onRowsPerPageChange={onRowsPerPageChange || (() => {})}
          />
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => { onViewRole?.(selectedRole!); handleMenuClose(); }}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => { onEditRole?.(selectedRole!); handleMenuClose(); }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Role
        </MenuItem>
        <MenuItem onClick={() => { onManagePermissions?.(selectedRole!); handleMenuClose(); }}>
          <SecurityIcon fontSize="small" sx={{ mr: 1 }} />
          Manage Permissions
        </MenuItem>
        <MenuItem onClick={() => { onManageUsers?.(selectedRole!); handleMenuClose(); }}>
          <PersonIcon fontSize="small" sx={{ mr: 1 }} />
          Manage Users
        </MenuItem>
        {selectedRole && !selectedRole.isSystemRole && (
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete Role
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Role</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the role "{selectedRole?.displayName}"?
            This action cannot be undone.
          </Typography>
          {selectedRole && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This will remove the role from all users who currently have it assigned.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <ResponsiveButton 
            onClick={handleDeleteCancel}
            variant="outlined"
            forceTextOnly={true}
            mobileText="Cancel"
            desktopText="Cancel"
          >
            Cancel
          </ResponsiveButton>
          <ActionButton
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
            icon={isDeleting ? <CircularProgress size={20} /> : undefined}
            forceTextOnly={true}
            mobileText={isDeleting ? 'Deleting...' : 'Delete'}
            desktopText={isDeleting ? 'Deleting...' : 'Delete'}
          >
            {isDeleting ? <CircularProgress size={20} /> : 'Delete'}
          </ActionButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
