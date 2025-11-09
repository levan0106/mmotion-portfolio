import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Search as SearchIcon,
  AccountBalance as PortfolioIcon,
  Person as PersonIcon,
  MonetizationOn as CurrencyIcon,
  TrendingUp as ValueIcon,
  CalendarToday as DateIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useAdminPortfolios } from '../hooks/useAdminPortfolios';
import { PermissionGuard } from '../components/Common/PermissionGuard';
import ResponsiveTypography from '../components/Common/ResponsiveTypography';
import { ResponsiveButton, ActionButton } from '../components/Common';
import { formatCurrency } from '../utils/format';
import { apiService } from '../services/api';

const AdminPortfolioList: React.FC = () => {
  return (
    <PermissionGuard role="super_admin">
      <AdminPortfolioListContent />
    </PermissionGuard>
  );
};

const AdminPortfolioListContent: React.FC = () => {
  const { t } = useTranslation();
  const { data: portfolios, isLoading, error, refetch } = useAdminPortfolios();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [portfolioToDelete, setPortfolioToDelete] = useState<any>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<any>(null);

  // Filter portfolios based on search term
  const filteredPortfolios = portfolios?.filter(portfolio =>
    portfolio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    portfolio.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDeletePortfolio = async () => {
    if (!portfolioToDelete) return;
    
    try {
      await apiService.deletePortfolioAdmin(portfolioToDelete.portfolioId);
      setDeleteDialogOpen(false);
      setPortfolioToDelete(null);
      refetch();
    } catch (error) {
      console.error('Error deleting portfolio:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, portfolio: any) => {
    setMenuAnchor(event.currentTarget);
    setSelectedPortfolio(portfolio);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedPortfolio(null);
  };

  const handleDeleteClick = () => {
    setPortfolioToDelete(selectedPortfolio);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
          sx={{ py: 4 }}
        >
          <CircularProgress size={60} thickness={4} />
          <ResponsiveTypography variant="pageSubtitle" sx={{ mt: 2 }}>
            {t('admin.portfolioList.loading')}
          </ResponsiveTypography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('admin.portfolioList.error')}: {error.message}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <ResponsiveTypography variant="pageTitle" sx={{ mb: 1 }}>
            {t('admin.portfolioList.title')}
          </ResponsiveTypography>
          <ResponsiveTypography variant="pageSubtitle" color="text.secondary">
            {t('admin.portfolioList.subtitle')}
          </ResponsiveTypography>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <PortfolioIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                  <Box>
                    <ResponsiveTypography variant="cardValue" color="text.primary">
                      {portfolios?.length || 0}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary">
                      {t('admin.portfolioList.totalPortfolios')}
                    </ResponsiveTypography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <PersonIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                  <Box>
                    <ResponsiveTypography variant="cardValue" color="text.primary">
                      {new Set(portfolios?.map(p => p.createdBy.accountId) || []).size}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary">
                      {t('admin.portfolioList.uniqueUsers')}
                    </ResponsiveTypography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <ValueIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                  <Box>
                    <ResponsiveTypography variant="cardValue" color="text.primary">
                      {formatCurrency(
                        portfolios?.reduce((sum, p) => sum + (p.totalValue || 0), 0) || 0,
                        'VND'
                      )}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary">
                      {t('admin.portfolioList.totalValue')}
                    </ResponsiveTypography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <DateIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                  <Box>
                    <ResponsiveTypography variant="cardValue" color="text.primary">
                      {new Date().toLocaleDateString()}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary">
                      {t('admin.portfolioList.lastUpdated')}
                    </ResponsiveTypography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Actions */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            placeholder={t('admin.portfolioList.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />
          <Tooltip title={t('admin.portfolioList.refresh')}>
            <IconButton onClick={() => refetch()} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Portfolio Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <ResponsiveTypography variant="tableHeaderSmall">
                      {t('admin.portfolioList.table.portfolioName')}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell>
                    <ResponsiveTypography variant="tableHeaderSmall">
                      {t('admin.portfolioList.table.portfolioId')}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell>
                    <ResponsiveTypography variant="tableHeaderSmall">
                      {t('admin.portfolioList.table.createdBy')}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell>
                    <ResponsiveTypography variant="tableHeaderSmall">
                      {t('admin.portfolioList.table.user')}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell>
                    <ResponsiveTypography variant="tableHeaderSmall">
                      {t('admin.portfolioList.table.currency')}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell>
                    <ResponsiveTypography variant="tableHeaderSmall">
                      {t('admin.portfolioList.table.createdAt')}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="center">
                    <ResponsiveTypography variant="tableHeaderSmall">
                      {t('admin.portfolioList.table.actions')}
                    </ResponsiveTypography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPortfolios.map((portfolio) => (
                  <TableRow key={portfolio.portfolioId} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <PortfolioIcon sx={{ fontSize: 20, color: 'primary.main', mr: 1 }} />
                        <ResponsiveTypography variant="tableCell">
                          {portfolio.name}
                        </ResponsiveTypography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <ResponsiveTypography variant="tableCellSmall" color="text.secondary">
                        {portfolio.portfolioId}
                      </ResponsiveTypography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <PersonIcon sx={{ fontSize: 16, color: 'success.main', mr: 1 }} />
                        <Tooltip title={portfolio.createdBy.email} arrow>
                          <Box sx={{ cursor: 'help' }}>
                            <ResponsiveTypography variant="tableCell">
                              {portfolio.createdBy.name}
                            </ResponsiveTypography>
                          </Box>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {portfolio.user ? (
                        <Box display="flex" alignItems="center">
                          <PersonIcon sx={{ fontSize: 16, color: 'info.main', mr: 1 }} />
                          <Tooltip title={portfolio.user.email} arrow>
                            <Box sx={{ cursor: 'help' }}>
                              <ResponsiveTypography variant="tableCell">
                                {portfolio.user.username}
                              </ResponsiveTypography>
                            </Box>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Chip
                          label="No User"
                          size="small"
                          color="default"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={portfolio.baseCurrency}
                        size="small"
                        color="primary"
                        variant="outlined"
                        icon={<CurrencyIcon sx={{ fontSize: 16 }} />}
                      />
                    </TableCell>
                    <TableCell>
                      <ResponsiveTypography variant="tableCellSmall" color="text.secondary">
                        {new Date(portfolio.createdAt).toLocaleDateString()}
                      </ResponsiveTypography>
                    </TableCell>
                    <TableCell align="right">
                      {!portfolio.user && (
                        <>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, portfolio)}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {filteredPortfolios.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ResponsiveTypography variant="pageSubtitle" color="text.secondary">
              {searchTerm ? t('admin.portfolioList.noResults') : t('admin.portfolioList.noPortfolios')}
            </ResponsiveTypography>
          </Box>
        )}

        {/* Actions Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
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
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>{t('admin.portfolioList.deletePortfolio')}</ListItemText>
          </MenuItem>
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {t('admin.portfolioList.deleteDialog.title')}
          </DialogTitle>
          <DialogContent>
            <ResponsiveTypography variant="body1" ellipsis={false}>
              {t('admin.portfolioList.deleteDialog.message', { 
                portfolioName: portfolioToDelete?.name 
              })}
            </ResponsiveTypography>
          </DialogContent>
          <DialogActions>
            <ResponsiveButton 
              onClick={() => setDeleteDialogOpen(false)}
              variant="outlined"
              forceTextOnly={true}
              mobileText={t('common.cancel')}
              desktopText={t('common.cancel')}
            >
              {t('common.cancel')}
            </ResponsiveButton>
            <ActionButton 
              onClick={handleDeletePortfolio}
              color="error"
              variant="contained"
              forceTextOnly={true}
              mobileText={t('common.delete')}
              desktopText={t('common.delete')}
            >
              {t('common.delete')}
            </ActionButton>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default AdminPortfolioList;
