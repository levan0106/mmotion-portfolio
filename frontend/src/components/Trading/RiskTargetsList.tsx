import React, { useState, useMemo } from 'react';
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
  Paper,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { RiskTargetResponseDto } from '../../types/trading';
import { ResponsiveButton } from '../Common';

export interface RiskTargetsListProps {
  riskTargets: RiskTargetResponseDto[];
  isLoading?: boolean;
  onEdit?: (riskTarget: RiskTargetResponseDto) => void;
  onDelete?: (riskTarget: RiskTargetResponseDto) => void;
  onViewAlerts?: (riskTarget: RiskTargetResponseDto) => void;
  onCreate?: () => void;
}

/**
 * RiskTargetsList component for displaying and managing risk targets.
 * Provides filtering, sorting, and action buttons for risk management.
 */
export const RiskTargetsList: React.FC<RiskTargetsListProps> = ({
  riskTargets,
  isLoading = false,
  onEdit,
  onDelete,
  onViewAlerts,
  onCreate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRiskTarget, setSelectedRiskTarget] = useState<RiskTargetResponseDto | null>(null);

  // Filter risk targets
  const filteredRiskTargets = useMemo(() => {
    return riskTargets.filter((target) => {
      const matchesSearch = 
        target.assetSymbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        target.assetName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || 
        (statusFilter === 'ACTIVE' && target.isActive) ||
        (statusFilter === 'INACTIVE' && !target.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [riskTargets, searchTerm, statusFilter]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, riskTarget: RiskTargetResponseDto) => {
    setAnchorEl(event.currentTarget);
    setSelectedRiskTarget(riskTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRiskTarget(null);
  };

  const handleAction = (action: 'edit' | 'delete' | 'alerts') => {
    if (!selectedRiskTarget) return;

    switch (action) {
      case 'edit':
        onEdit?.(selectedRiskTarget);
        break;
      case 'delete':
        onDelete?.(selectedRiskTarget);
        break;
      case 'alerts':
        onViewAlerts?.(selectedRiskTarget);
        break;
    }
    handleMenuClose();
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'default';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <CheckCircleIcon /> : <WarningIcon />;
  };

  const getDistanceColor = (distance: number) => {
    if (distance > 0) return 'success';
    if (distance < 0) return 'error';
    return 'default';
  };

  const getDistanceIcon = (distance: number) => {
    if (distance > 0) return '↗';
    if (distance < 0) return '↘';
    return '→';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num / 100);
  };

  // Calculate summary statistics
  const activeTargets = riskTargets.filter(target => target.isActive).length;
  const triggeredAlerts = riskTargets.filter(target => 
    target.stopLossDistance && target.stopLossDistance > 0 ||
    target.takeProfitDistance && target.takeProfitDistance > 0
  ).length;

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">
            Risk Targets
          </Typography>
          <Box display="flex" gap={2}>
            <ResponsiveButton
              variant="outlined"
              icon={<FilterIcon />}
              mobileText="Filter"
              desktopText="Filters"
              onClick={() => {
                // Toggle filter visibility
              }}
            >
              Filters
            </ResponsiveButton>
            <ResponsiveButton
              variant="contained"
              icon={<SecurityIcon />}
              mobileText="Set"
              desktopText="Set Risk Targets"
              onClick={onCreate}
            >
              Set Risk Targets
            </ResponsiveButton>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {riskTargets.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Targets
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="success.main">
                  {activeTargets}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Targets
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="warning.main">
                  {triggeredAlerts}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Triggered Alerts
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6">
                  {filteredRiskTargets.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Filtered Results
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filters */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search risk targets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Status</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {filteredRiskTargets.length} targets
            </Typography>
          </Grid>
        </Grid>

        {/* Risk Targets Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Asset</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Current Price</TableCell>
                <TableCell align="right">Stop Loss</TableCell>
                <TableCell align="right">Take Profit</TableCell>
                <TableCell align="right">Stop Loss Distance</TableCell>
                <TableCell align="right">Take Profit Distance</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography>Loading risk targets...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredRiskTargets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No risk targets found matching your criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRiskTargets.map((target) => (
                  <TableRow key={target.assetId} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {target.assetSymbol}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {target.assetName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={target.isActive ? 'Active' : 'Inactive'}
                        color={getStatusColor(target.isActive)}
                        size="small"
                        icon={getStatusIcon(target.isActive)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(target.currentPrice)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {target.stopLoss ? (
                        <Typography variant="body2">
                          {formatCurrency(target.stopLoss)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Not set
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {target.takeProfit ? (
                        <Typography variant="body2">
                          {formatCurrency(target.takeProfit)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Not set
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {target.stopLossDistance !== undefined ? (
                        <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                          <Chip
                            label={`${getDistanceIcon(target.stopLossDistance)} ${formatPercentage(Math.abs(target.stopLossDistance))}`}
                            color={getDistanceColor(target.stopLossDistance)}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {target.takeProfitDistance !== undefined ? (
                        <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                          <Chip
                            label={`${getDistanceIcon(target.takeProfitDistance)} ${formatPercentage(Math.abs(target.takeProfitDistance))}`}
                            color={getDistanceColor(target.takeProfitDistance)}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(target.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Actions">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, target)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleAction('edit')}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Risk Targets</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleAction('alerts')}>
            <ListItemIcon>
              <WarningIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Alerts</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleAction('delete')}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete Risk Targets</ListItemText>
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

export default RiskTargetsList;
