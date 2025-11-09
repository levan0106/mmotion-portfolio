import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useUserPermissions } from '../../hooks/useUserPermissions';

interface UserPermissionsDisplayProps {
  userId?: string;
  showRoles?: boolean;
  showPermissions?: boolean;
  compact?: boolean;
}

export const UserPermissionsDisplay: React.FC<UserPermissionsDisplayProps> = ({
  userId,
  showRoles = true,
  showPermissions = true,
  compact = false,
}) => {
  const {
    userPermissions,
    userRoles,
    isLoading,
    error,
    refresh,
  } = useUserPermissions(userId);

  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleCategoryToggle = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getStatusColor = (userRole: any) => {
    if (!userRole.isActive) return 'default';
    if (userRole.isExpired) return 'error';
    if (userRole.expiresAt) return 'warning';
    return 'success';
  };

  const getStatusLabel = (userRole: any) => {
    if (!userRole.isActive) return 'Inactive';
    if (userRole.isExpired) return 'Expired';
    if (userRole.expiresAt) return 'Temporary';
    return 'Active';
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Error loading permissions: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  if (!userPermissions && !userRoles) {
    return (
      <Alert severity="info">
        No permission data available
      </Alert>
    );
  }

  const permissionCategories = Object.keys(userPermissions?.permissionsByCategory || {});

  if (compact) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              User Permissions
            </Typography>
            <Box>
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={refresh}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="View Details">
                <IconButton size="small" onClick={() => setDetailsOpen(true)}>
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {showRoles && userRoles && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Roles ({userRoles.length})
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {userRoles.map((userRole: any) => (
                  <Chip
                    key={userRole.userRoleId}
                    label={userRole.roleDisplayName}
                    color={getStatusColor(userRole)}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}

          {showPermissions && userPermissions && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Permissions ({userPermissions.permissions.length})
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {permissionCategories.slice(0, 3).map((category) => (
                  <Chip
                    key={category}
                    label={`${category} (${userPermissions.permissionsByCategory[category].length})`}
                    variant="outlined"
                    size="small"
                  />
                ))}
                {permissionCategories.length > 3 && (
                  <Chip
                    label={`+${permissionCategories.length - 3} more`}
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              User Permissions & Roles
            </Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={refresh}
              size="small"
            >
              Refresh
            </Button>
          </Box>

          {/* Roles Section */}
          {showRoles && userRoles && (
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                Roles ({userRoles.length})
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {userRoles.map((userRole: any) => (
                  <Chip
                    key={userRole.userRoleId}
                    label={`${userRole.roleDisplayName} (${getStatusLabel(userRole)})`}
                    color={getStatusColor(userRole)}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Permissions Section */}
          {showPermissions && userPermissions && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Permissions ({userPermissions.permissions.length})
              </Typography>
              
              {permissionCategories.map((category) => (
                <Accordion
                  key={category}
                  expanded={expandedCategories.includes(category)}
                  onChange={() => handleCategoryToggle(category)}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" gap={1} width="100%">
                      <SecurityIcon />
                      <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                        {category.replace(/_/g, ' ').toUpperCase()}
                      </Typography>
                      <Chip
                        label={userPermissions.permissionsByCategory[category].length}
                        size="small"
                        color="primary"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {userPermissions.permissionsByCategory[category].map((permission: any) => (
                        <Chip
                          key={permission}
                          label={permission}
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon />
            <Typography variant="h6">
              Detailed User Permissions
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* Roles Table */}
            {showRoles && userRoles && (
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  User Roles
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Role</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Assigned</TableCell>
                        <TableCell>Expires</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {userRoles.map((userRole: any) => (
                        <TableRow key={userRole.userRoleId}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {userRole.roleDisplayName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {userRole.roleName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusLabel(userRole)}
                              color={getStatusColor(userRole)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(userRole.assignedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {userRole.expiresAt ? (
                              new Date(userRole.expiresAt).toLocaleDateString()
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Never
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* All Permissions List */}
            {showPermissions && userPermissions && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  All Permissions ({userPermissions.permissions.length})
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {userPermissions.permissions.map((permission: any) => (
                    <Chip
                      key={permission}
                      label={permission}
                      color="primary"
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
