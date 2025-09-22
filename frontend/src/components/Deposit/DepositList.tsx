import React, { useState } from 'react';
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
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Avatar,
  Stack,
} from '@mui/material';
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
        Chưa có tiền gửi nào. Hãy tạo tiền gửi đầu tiên!
      </Alert>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Ngân hàng</TableCell>
            <TableCell>Số tài khoản</TableCell>
            <TableCell align="right">Số tiền gốc</TableCell>
            <TableCell align="right">Lãi suất</TableCell>
            <TableCell align="center">Kỳ hạn</TableCell>
            <TableCell align="center">Trạng thái</TableCell>
            <TableCell align="right">Lãi tích lũy</TableCell>
            <TableCell align="right">Tổng giá trị</TableCell>
            <TableCell align="center">Thao tác</TableCell>
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
                    <Typography variant="body2" fontWeight="medium">
                      {deposit.bankName || 'N/A'}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {deposit.accountNumber || 'N/A'}
                  </Typography>
                </TableCell>
                
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(deposit.principal || 0)}
                  </Typography>
                </TableCell>
                
                <TableCell align="right">
                  <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                    <InterestIcon fontSize="small" color="primary" />
                    <Typography variant="body2">
                      {deposit.interestRate ? `${deposit.interestRate}%` : 'N/A'}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell align="center">
                  <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                    <Typography variant="body2" fontWeight="medium">
                      {deposit.termDescription || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(deposit.startDate, 'short')} - {formatDate(deposit.endDate, 'short')}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell align="center">
                  <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                    <Chip
                      icon={getStatusIcon(deposit)}
                      label={
                        deposit.status === 'SETTLED' 
                          ? 'Đã tất toán' 
                          : deposit.isMatured 
                            ? 'Đã đến hạn' 
                            : 'Đang hoạt động'
                      }
                      color={getStatusColor(deposit)}
                      size="small"
                    />                   
                  </Box>
                </TableCell>
                
                <TableCell align="right">
                  <Typography variant="body2" color="primary" fontWeight="medium">
                    {formatCurrency(deposit.accruedInterest || 0)}
                  </Typography>
                </TableCell>
                
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {formatCurrency(deposit.totalValue || 0)}
                  </Typography>
                </TableCell>
                
                <TableCell align="center">
                  <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                    {/* Settle Button */}
                    {deposit.canBeSettled && onSettle && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<MoneyIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSettle(deposit);
                        }}
                        sx={{ minWidth: 'auto', px: 1 }}
                      >
                        Tất toán
                      </Button>
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
                Xem chi tiết
              </MenuItem>
            )}
            
            {selectedDeposit.canBeEdited && onEdit && (
              <MenuItem onClick={() => handleAction(() => onEdit(selectedDeposit))}>
                <EditIcon fontSize="small" sx={{ mr: 1 }} />
                Chỉnh sửa
              </MenuItem>
            )}
            
            {onDelete && (
              <MenuItem 
                onClick={() => handleAction(() => handleDeleteClick(selectedDeposit))}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                Xóa
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
              <Typography variant="h6" fontWeight="bold">
                Xác nhận xóa tiền gửi
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hành động này không thể hoàn tác
              </Typography>
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
                      <Typography variant="h6" fontWeight="bold">
                        {depositToDelete.bankName || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                        {depositToDelete.accountNumber || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Số tiền gốc:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(depositToDelete.principal || 0)}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Lãi suất:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {depositToDelete.interestRate ? `${depositToDelete.interestRate}%` : 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Kỳ hạn:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {depositToDelete.termDescription || 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Tổng giá trị:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      {formatCurrency(depositToDelete.totalValue || 0)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          )}
          
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              Cảnh báo:
            </Typography>
            <Typography variant="body2">
              Bạn sắp xóa vĩnh viễn tiền gửi này. Tất cả dữ liệu liên quan sẽ bị mất và không thể khôi phục.
            </Typography>
          </Alert>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleDeleteCancel}
            variant="outlined"
            size="large"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            size="large"
            startIcon={<DeleteIcon />}
          >
            Xóa vĩnh viễn
          </Button>
        </DialogActions>
      </Dialog>
    </TableContainer>
  );
};

export default DepositList;
