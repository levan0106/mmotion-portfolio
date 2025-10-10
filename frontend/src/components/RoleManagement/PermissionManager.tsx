import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { Role, Permission } from '../../services/api.role';
import { userRolesApi } from '../../services/api.userRoles';

interface PermissionManagerProps {
  open: boolean;
  onClose: () => void;
  role: Role | null;
  onSave: (permissionIds: string[]) => void;
  isLoading?: boolean;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  open,
  onClose,
  role,
  onSave,
  isLoading = false,
}) => {
  const [permissionsByCategory, setPermissionsByCategory] = useState<any[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Fetch permissions when dialog opens
  useEffect(() => {
    const fetchPermissions = async () => {
      if (open) {
        setIsLoadingPermissions(true);
        try {
          const categories = await userRolesApi.getPermissionsByCategory();
          setPermissionsByCategory(categories);
        } catch (error) {
          console.error('Error fetching permissions:', error);
          setPermissionsByCategory([]);
        } finally {
          setIsLoadingPermissions(false);
        }
      }
    };

    fetchPermissions();
  }, [open]);

  useEffect(() => {
    if (role && open) {
      setSelectedPermissions(role.permissions?.map(p => p.permissionId) || []);
    }
  }, [role, open]);

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleCategoryToggle = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSelectAllInCategory = (category: string, select: boolean) => {
    const categoryPermissions = permissionsByCategory?.find((c: any) => c.name === category)?.permissions || [];
    const categoryPermissionIds = categoryPermissions.map((p: any) => p.permissionId);
    
    if (select) {
      setSelectedPermissions(prev => [
        ...prev,
        ...categoryPermissionIds.filter((id: any) => !prev.includes(id))
      ]);
    } else {
      setSelectedPermissions(prev => 
        prev.filter(id => !categoryPermissionIds.includes(id))
      );
    }
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      const allPermissionIds = permissionsByCategory?.flatMap((c: any) =>
        c.permissions.map((p: any) => p.permissionId)
      ) || [];
      setSelectedPermissions(allPermissionIds);
    } else {
      setSelectedPermissions([]);
    }
  };

  const handleSave = () => {
    if (selectedPermissions.length === 0) {
      alert('Please select at least one permission');
      return;
    }
    onSave(selectedPermissions);
  };

  const filteredCategories = permissionsByCategory?.filter((category: any) => {
    if (!searchQuery) return true;
    return category.permissions.some((permission: any) =>
      permission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permission.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permission.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) || [];

  const getCategoryStats = (category: any) => {
    const total = category.permissions.length;
    const selected = category.permissions.filter((p: Permission) => 
      selectedPermissions.includes(p.permissionId)
    ).length;
    return { total, selected };
  };

  const totalPermissions = permissionsByCategory?.reduce((sum: any, category: any) =>
    sum + category.permissions.length, 0
  ) || 0;
  const totalSelected = selectedPermissions.length;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { maxHeight: '80vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <SecurityIcon />
          <Typography variant="h6">
            Manage Permissions - {role?.displayName}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        <Box>
          {/* Search and Controls */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Summary */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {totalSelected} of {totalPermissions} permissions selected
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleSelectAll(true)}
                  disabled={isLoading}
                >
                  Select All
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleSelectAll(false)}
                  disabled={isLoading}
                >
                  Clear All
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Permissions by Category */}
          {isLoadingPermissions ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Box sx={{ maxHeight: '50vh', overflow: 'auto' }}>
              {filteredCategories.map((category: any) => {
                const { total, selected } = getCategoryStats(category);
                const isExpanded = expandedCategories.includes(category.name);
                const isAllSelected = selected === total;
                const isPartiallySelected = selected > 0 && selected < total;

                return (
                  <Accordion
                    key={category.name}
                    expanded={isExpanded}
                    onChange={() => handleCategoryToggle(category.name)}
                    sx={{ 
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      '&:before': {
                        display: 'none',
                      },
                      '&.Mui-expanded': {
                        borderColor: 'primary.main',
                        boxShadow: 1,
                      },
                      '&:hover': {
                        borderColor: 'primary.light',
                        boxShadow: 1,
                      },
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ 
                        py: 0.5,
                        px: 2,
                        borderRadius: 2,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                        '&.Mui-expanded': {
                          backgroundColor: 'primary.50',
                        },
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2} width="100%">
                        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                          {category.displayName}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={`${selected}/${total}`}
                            size="small"
                            color={isAllSelected ? 'primary' : isPartiallySelected ? 'warning' : 'default'}
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                          <Button
                            size="small"
                            variant="text"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAllInCategory(category.name, !isAllSelected);
                            }}
                            disabled={isLoading}
                            sx={{ minWidth: 'auto', px: 1 }}
                          >
                            {isAllSelected ? 'Clear' : 'Select All'}
                          </Button>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ 
                      py: 1,
                      px: 2,
                      backgroundColor: 'grey.50',
                      borderTop: '1px solid',
                      borderColor: 'divider',
                    }}>
                      <FormGroup>
                        {category.permissions.map((permission: any) => (
                          <FormControlLabel
                            key={permission.permissionId}
                            control={
                              <Checkbox
                                size="small"
                                checked={selectedPermissions.includes(permission.permissionId)}
                                onChange={() => handlePermissionToggle(permission.permissionId)}
                                disabled={isLoading}
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {permission.displayName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {permission.name}
                                </Typography>
                                {permission.description && (
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {permission.description}
                                  </Typography>
                                )}
                              </Box>
                            }
                            sx={{ 
                              mb: 0.5,
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              '&:hover': {
                                backgroundColor: 'action.hover',
                              },
                              '&.Mui-checked': {
                                backgroundColor: 'primary.50',
                              },
                            }}
                          />
                        ))}
                      </FormGroup>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          )}

          {filteredCategories.length === 0 && searchQuery && (
            <Alert severity="info">
              No permissions found matching "{searchQuery}"
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button onClick={onClose} disabled={isLoading} size="small">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          size="small"
          disabled={isLoading || selectedPermissions.length === 0}
          startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
        >
          {isLoading ? 'Saving...' : `Save (${selectedPermissions.length})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
