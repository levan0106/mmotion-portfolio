import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Avatar,
  Checkbox,
  Chip,
  CircularProgress,
  InputAdornment,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Role } from '../../services/api.role';
import { useUsers } from '../../hooks/useUsers';

interface User {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface AssignUserDialogProps {
  open: boolean;
  onClose: () => void;
  role: Role | null;
  onAssignUsers: (userIds: string[], expiresAt?: string) => void;
  isLoading?: boolean;
}

export const AssignUserDialog: React.FC<AssignUserDialogProps> = ({
  open,
  onClose,
  role,
  onAssignUsers,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Use real API hook
  const { searchUsers } = useUsers();

  // Load available users when dialog opens
  useEffect(() => {
    if (open && role) {
      loadAvailableUsers();
    }
  }, [open, role]);

  const loadAvailableUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await searchUsers(searchQuery || '', { isActive: true });
      setAvailableUsers(response.users);
    } catch (error) {
      console.error('Error loading available users:', error);
      setAvailableUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Search users when query changes
  useEffect(() => {
    if (open && role) {
      const timeoutId = setTimeout(() => {
        loadAvailableUsers();
      }, 300); // Debounce search

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, open, role]);

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const filteredUserIds = filteredUsers.map(user => user?.userId);
    setSelectedUsers(filteredUserIds);
  };

  const handleDeselectAll = () => {
    setSelectedUsers([]);
  };

  const handleAssign = () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }
    
    const expirationDate = expiresAt ? new Date(expiresAt).toISOString() : undefined;
    onAssignUsers(selectedUsers, expirationDate);
    onClose();
  };

  const filteredUsers = availableUsers.filter(user => {
    if (!user) return false;
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      user?.email.toLowerCase().includes(searchLower) ||
      user.displayName?.toLowerCase().includes(searchLower) ||
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower)
    );
  });

  const getInitials = (user: User) => {
    // Try to get initials from firstName and lastName
    if (user?.firstName && user?.lastName && user?.firstName?.trim() && user?.lastName?.trim()) {
      return `${user?.firstName[0]}${user?.lastName[0]}`.toUpperCase();
    }
    
    // Try to get initials from displayName
    if (user?.displayName && user?.displayName.trim()) {
      const nameParts = user?.displayName.trim().split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      }
      return user?.displayName[0].toUpperCase();
    }
    
    // Fallback to email
    if (user?.email && user?.email.trim()) {
      return user?.email[0].toUpperCase();
    }
    
    // Final fallback
    return 'U';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon color="primary" />
            <Typography variant="h6">
              Assign Users to {role?.displayName}
            </Typography>
          </Box>
          <Chip
            label={`${selectedUsers.length} selected`}
            color="primary"
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {/* Left Column - Search and Filters */}
          <Grid item xs={12} md={4}>
            <Box>
              {/* Search */}
              <TextField
                label="Search users"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
                size="small"
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                placeholder="Search by name or email..."
              />

              {/* Bulk Actions */}
              <Box display="flex" gap={1} mb={2}>
                <Button size="small" onClick={handleSelectAll} variant="outlined">
                  Select All
                </Button>
                <Button size="small" onClick={handleDeselectAll} variant="outlined">
                  Clear All
                </Button>
              </Box>

              {/* Expiration Date */}
              <TextField
                label="Expiration Date (Optional)"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{
                  shrink: true,
                }}
                helperText="Leave empty for no expiration"
              />
            </Box>
          </Grid>

          {/* Right Column - Users List */}
          <Grid item xs={12} md={8}>
            <Box sx={{ height: 500, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              {isLoadingUsers ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ height: '100%', overflow: 'auto' }}>
                  {filteredUsers.length === 0 ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%" p={4}>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        No users found<br />
                        Try adjusting your search criteria
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ p: 1 }}>
                      {/* Header Row */}
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          p: 1, 
                          borderBottom: 1, 
                          borderColor: 'divider',
                          backgroundColor: 'grey.50',
                          fontWeight: 600,
                          fontSize: '0.875rem'
                        }}
                      >
                        <Box sx={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                          <Checkbox
                            checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                            indeterminate={selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length}
                            onChange={selectedUsers.length === filteredUsers.length ? handleDeselectAll : handleSelectAll}
                            size="small"
                          />
                        </Box>
                        <Box sx={{ width: 40, display: 'flex', justifyContent: 'center' }}>Avatar</Box>
                        <Box sx={{ flex: 1, minWidth: 0, px: 1 }}>Name</Box>
                        <Box sx={{ flex: 1, minWidth: 0, px: 1 }}>Email</Box>
                        <Box sx={{ width: 80, px: 1 }}>Status</Box>
                        <Box sx={{ width: 100, px: 1 }}>Last Login</Box>
                      </Box>
                      
                      {/* Data Rows */}
                      {filteredUsers.map((user) => (
                        <Box
                          key={user.userId}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 1,
                            borderBottom: 1,
                            borderColor: 'divider',
                            cursor: 'pointer',
                            backgroundColor: selectedUsers.includes(user.userId) ? 'primary.50' : 'transparent',
                            '&:hover': {
                              backgroundColor: selectedUsers.includes(user.userId) ? 'primary.100' : 'action.hover',
                            },
                            transition: 'all 0.2s',
                          }}
                          onClick={() => handleUserToggle(user.userId)}
                        >
                          <Box sx={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                            <Checkbox
                              checked={selectedUsers.includes(user.userId)}
                              onChange={() => handleUserToggle(user.userId)}
                              size="small"
                            />
                          </Box>
                          <Box sx={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                            <Avatar sx={{ width: 28, height: 28 }}>
                              {getInitials(user)}
                            </Avatar>
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0, px: 1 }}>
                            <Typography 
                              variant="body2" 
                              fontWeight={selectedUsers.includes(user.userId) ? 600 : 400}
                              noWrap
                            >
                              {user?.displayName || user?.email}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0, px: 1 }}>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {user?.email}
                            </Typography>
                          </Box>
                          <Box sx={{ width: 80, px: 1 }}>
                            <Chip
                              label={user?.isActive ? 'Active' : 'Inactive'}
                              color={user?.isActive ? 'success' : 'default'}
                              size="small"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                          <Box sx={{ width: 100, px: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {user?.lastLoginAt ? formatDate(user?.lastLoginAt) : 'Never'}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleAssign}
          disabled={isLoading || selectedUsers.length === 0}
          startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
        >
          {isLoading ? 'Assigning...' : `Assign ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
