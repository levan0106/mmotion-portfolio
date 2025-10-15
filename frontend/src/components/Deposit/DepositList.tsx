import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Avatar,
  Stack,
} from '@mui/material';
import { ResponsiveButton } from '../Common';
import { ResponsiveTypography } from '../Common';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as BankIcon,
  TrendingUp as InterestIcon,
  CheckCircle as SettledIcon,
  Pending as PendingIcon,
  Warning as MaturedIcon,
  Visibility as ViewIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/format';

interface Deposit {
  depositId: string;
  portfolioId: string;
  bankName: string;
  accountNumber?: string;
  principal: number;
  interestRate: number;
  startDate: string;
  endDate: string;
  termMonths?: number;
  status: 'ACTIVE' | 'SETTLED';
  actualInterest?: number;
  notes?: string;
  accruedInterest: number;
  totalValue: number;
  isMatured: boolean;
  canBeEdited: boolean;
  canBeSettled: boolean;
  daysUntilMaturity: number;
  termDescription: string;
  createdAt: string;
  updatedAt: string;
  settledAt?: string;
}

interface DepositListProps {
  deposits: Deposit[];
  loading?: boolean;
  onEdit?: (deposit: Deposit) => void;
  onSettle?: (deposit: Deposit) => void;
  onDelete?: (deposit: Deposit) => void;
  onViewDetails?: (deposit: Deposit) => void;
}

const DepositList: React.FC<DepositListProps> = ({
  deposits,
  loading = false,
  onEdit,
  onSettle,
  onDelete,
  onViewDetails,
}) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [depositToDelete, setDepositToDelete] = useState<Deposit | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, deposit: Deposit) => {
    setAnchorEl(event.currentTarget);
    setSelectedDeposit(deposit);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDeposit(null);
  };

  const handleAction = (action: () => void) => {
    action();
    handleMenuClose();
  };

  const handleDeleteClick = (deposit: Deposit) => {
    setDepositToDelete(deposit);
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    if (depositToDelete && onDelete) {
      onDelete(depositToDelete);
    }
    setDeleteConfirmOpen(false);
    setDepositToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setDepositToDelete(null);
  };

  const getStatusColor = (deposit: Deposit): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    if (deposit.status === 'SETTLED') {
      return 'success';
    }
    
    if (deposit.isMatured) {
      return 'warning';
    }
    
    return 'primary';
  };

  const getStatusIcon = (deposit: Deposit): React.ReactElement => {
    if (deposit.status === 'SETTLED') {
      return <SettledIcon fontSize="small" />;
    }
    
    if (deposit.isMatured) {
      return <MaturedIcon fontSize="small" />;
    }
    
    return <PendingIcon fontSize="small" />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (deposits.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        {t('deposit.noDeposits')}
      </Alert>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('deposit.bank')}</TableCell>
            {/* <TableCell>{t('deposit.accountNumber')}</TableCell> */}
            <TableCell align="right">{t('deposit.principal')}</TableCell>
            <TableCell align="right">{t('deposit.interestRate')}</TableCell>
            <TableCell align="center">{t('deposit.term')}</TableCell>
            <TableCell align="center">{t('deposit.status')}</TableCell>
            <TableCell align="right">{t('deposit.accruedInterest')}</TableCell>
            <TableCell align="right">{t('deposit.totalValue')}</TableCell>
            <TableCell align="center">{t('deposit.actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {deposits.map((deposit) => {
            return (
              <TableRow 
                key={deposit.depositId || 'unknown'}
                hover
                onClick={() => onViewDetails?.(deposit)}
                sx={{ cursor: onViewDetails ? 'pointer' : 'default' }}
              >
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <BankIcon color="primary" fontSize="small" />
                    <ResponsiveTypography variant="body2" fontWeight="medium">
                      {deposit.bankName || 'N/A'}
                    </ResponsiveTypography>
                  </Box>
                </TableCell>
                
                {/* <TableCell>
                  <ResponsiveTypography variant="body2" fontFamily="monospace">
                    {deposit.accountNumber || 'N/A'}
                  </ResponsiveTypography>
                </TableCell> */}
                
                <TableCell align="right">
                  <ResponsiveTypography variant="body2" fontWeight="medium">
                    {formatCurrency(deposit.principal || 0)}
                  </ResponsiveTypography>
                </TableCell>
                
                <TableCell align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                    <InterestIcon fontSize="small" color="primary" />
                    <ResponsiveTypography variant="body2">
                      {deposit.interestRate ? `${deposit.interestRate}%` : 'N/A'}
                    </ResponsiveTypography>
                  </Box>
                </TableCell>
                
                <TableCell align="center">
                  <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                    <ResponsiveTypography variant="body2" fontWeight="medium">
                      {deposit.termDescription || 'N/A'}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="caption" color="text.secondary">
                      {formatDate(deposit.startDate, 'short')} - {formatDate(deposit.endDate, 'short')}
                    </ResponsiveTypography>
                  </Box>
                </TableCell>
                
                <TableCell align="center">
                  <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                    <Chip
                      icon={getStatusIcon(deposit)}
                      label={
                        deposit.status === 'SETTLED' 
                          ? t('deposit.settled') 
                          : deposit.isMatured 
                            ? t('deposit.matured') 
                            : t('deposit.active')
                      }
                      color={getStatusColor(deposit)}
                      size="small"
                      sx={{
                        fontSize: '0.7rem',
                      }}
                    />                   
                  </Box>
                </TableCell>
                
                <TableCell align="right">
                  <ResponsiveTypography variant="body2" color="primary" fontWeight="medium">
                    {formatCurrency(deposit.accruedInterest || 0)}
                  </ResponsiveTypography>
                </TableCell>
                
                <TableCell align="right">
                  <ResponsiveTypography variant="body2" fontWeight="bold" color="success.main">
                    {formatCurrency(deposit.totalValue || 0)}
                  </ResponsiveTypography>
                </TableCell>
                
                <TableCell align="center">
                  <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                    {/* Settle Button */}
                    {deposit.canBeSettled && onSettle && (
                      <ResponsiveButton
                        size="small"
                        variant="contained"
                        color="success"
                        icon={<MoneyIcon />}
                        mobileText={t('deposit.settle')}
                        desktopText={t('deposit.settle')}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSettle(deposit);
                        }}
                        sx={{ 
                          minWidth: 'auto', 
                          px: 0.5, 
                          '&.MuiButtonBase-root': {
                            fontSize: {
                              xs: '0.65rem !important',  // Mobile: nhỏ hơn
                              sm: '0.7rem !important',   // Tablet: trung bình
                              md: '0.75rem !important'   // Desktop: lớn hơn
                            }
                          },
                          '&.MuiButton-root': {
                            fontSize: {
                              xs: '0.65rem !important',  // Mobile: nhỏ hơn
                              sm: '0.7rem !important',   // Tablet: trung bình
                              md: '0.75rem !important'   // Desktop: lớn hơn
                            }
                          }
                        }}
                      >
                        {t('deposit.settle')}
                      </ResponsiveButton>
                    )}
                    
                    {/* More Actions Menu - Always on the right */}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, deposit);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {selectedDeposit && (
          <>
            {onViewDetails && (
              <MenuItem onClick={() => handleAction(() => onViewDetails(selectedDeposit))}>
                <ViewIcon fontSize="small" sx={{ mr: 1 }} />
                {t('deposit.viewDetails')}
              </MenuItem>
            )}
            
            {selectedDeposit.canBeEdited && onEdit && (
              <MenuItem onClick={() => handleAction(() => onEdit(selectedDeposit))}>
                <EditIcon fontSize="small" sx={{ mr: 1 }} />
                {t('deposit.edit')}
              </MenuItem>
            )}
            
            {onDelete && (
              <MenuItem 
                onClick={() => handleAction(() => handleDeleteClick(selectedDeposit))}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                {t('deposit.delete')}
              </MenuItem>
            )}
          </>
        )}
      </Menu>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'error.main', width: 40, height: 40 }}>
              <DeleteIcon />
            </Avatar>
            <Box>
              <ResponsiveTypography variant="h6" fontWeight="bold">
                {t('deposit.confirmDelete')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="body2" color="text.secondary">
                {t('deposit.cannotUndo')}
              </ResponsiveTypography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {depositToDelete && (
            <Card sx={{ mt: 2, border: '1px solid', borderColor: 'error.light' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <BankIcon color="primary" />
                    <Box>
                      <ResponsiveTypography variant="h6" fontWeight="bold">
                        {depositToDelete.bankName || 'N/A'}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="body2" color="text.secondary" fontFamily="monospace">
                        {depositToDelete.accountNumber || 'N/A'}
                      </ResponsiveTypography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <ResponsiveTypography variant="body2" color="text.secondary">
                      {t('deposit.principalAmount')}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="body2" fontWeight="bold">
                      {formatCurrency(depositToDelete.principal || 0)}
                    </ResponsiveTypography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <ResponsiveTypography variant="body2" color="text.secondary">
                      {t('deposit.interestRateLabel')}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="body2" fontWeight="bold">
                      {depositToDelete.interestRate ? `${depositToDelete.interestRate}%` : 'N/A'}
                    </ResponsiveTypography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <ResponsiveTypography variant="body2" color="text.secondary">
                      {t('deposit.termLabel')}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="body2" fontWeight="bold">
                      {depositToDelete.termDescription || 'N/A'}
                    </ResponsiveTypography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <ResponsiveTypography variant="body2" color="text.secondary">
                      {t('deposit.totalValueLabel')}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="body2" fontWeight="bold" color="success.main">
                      {formatCurrency(depositToDelete.totalValue || 0)}
                    </ResponsiveTypography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          )}
          
          <Alert severity="warning" sx={{ mt: 2 }}>
            <ResponsiveTypography variant="body2" fontWeight="bold">
              {t('deposit.deleteWarning')}
            </ResponsiveTypography>
            <ResponsiveTypography variant="body2">
              {t('deposit.deleteWarningText')}
            </ResponsiveTypography>
          </Alert>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <ResponsiveButton
            onClick={handleDeleteCancel}
            variant="outlined"
            size="large"
            icon={<EditIcon />}
            mobileText={t('deposit.cancel')}
            desktopText={t('deposit.cancel')}
          >
            {t('deposit.cancel')}
          </ResponsiveButton>
          <ResponsiveButton
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            size="large"
            icon={<DeleteIcon />}
            mobileText={t('deposit.deletePermanently')}
            desktopText={t('deposit.deletePermanently')}
          >
            {t('deposit.deletePermanently')}
          </ResponsiveButton>
        </DialogActions>
      </Dialog>
    </TableContainer>
  );
};

export default DepositList;
