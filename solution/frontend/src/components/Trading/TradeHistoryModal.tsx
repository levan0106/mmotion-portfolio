import React from 'react';
import { Box, Alert, Chip, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ModalWrapper from '../Common/ModalWrapper';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import { apiService } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/format';

export interface TradeHistoryModalProps {
  open: boolean;
  onClose: () => void;
  symbol: string | null;
  baseCurrency: string;
  portfolioId: string;
  accountId: string;
  assetId: string;
}

const TradeHistoryModal: React.FC<TradeHistoryModalProps> = ({
  open,
  onClose,
  symbol,
  baseCurrency,
  portfolioId,
  accountId,
  assetId,
}) => {
  const { t } = useTranslation();
  const [trades, setTrades] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadTrades = React.useCallback(async () => {
    if (!open || !assetId || !portfolioId || !accountId) return;
    setLoading(true);
    setError(null);
    setTrades([]);
    try {
      const res = await apiService.getTrades(portfolioId, accountId, { assetId });
      res.sort((a: any, b: any) => new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime());
      setTrades(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load trade history');
    } finally {
      setLoading(false);
    }
  }, [open, assetId, portfolioId, accountId]);

  React.useEffect(() => {
    void loadTrades();
  }, [loadTrades]);

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ResponsiveTypography variant="cardTitle" sx={{ fontWeight: 700 }}>
            {t('portfolio.tradeHistory')} {symbol ? `- ${symbol}` : ''}
          </ResponsiveTypography>
        </Box>
      }
      loading={loading}
      maxWidth="lg"
      actions={
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} variant="outlined" color="primary">
            {t('common.close')}
          </Button>
        </Box>
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <ResponsiveTypography variant="tableCell">{error}</ResponsiveTypography>
        </Alert>
      )}
      {!loading && !error && (
        <Box>
          {trades.length === 0 ? (
            <ResponsiveTypography variant="tableCell" color="text.secondary">
              {t('common.noData')}
            </ResponsiveTypography>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell align="left">{t('trading.date')}</TableCell>
                    <TableCell align="left" sx={{ display: { xs: 'none', sm: 'table-cell' }}}>{t('trading.side')}</TableCell>
                    <TableCell align="right">{t('common.quantity')}</TableCell>
                    <TableCell align="right">{t('common.price')}</TableCell>
                    <TableCell align="right">{t('common.total')}</TableCell>
                    <TableCell align="right">P/L</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trades.map((tr, idx) => {
                    const qty = Number(tr.quantity ?? 0);
                    const price = Number(tr.price ?? 0);
                    const total = qty * price;
                    const side = (tr.side || '').toString().toUpperCase();
                    const sideColor = side === 'BUY' ? 'success' : side === 'SELL' ? 'error' : 'default';
                    const avgCost = tr.avgCost !== undefined ? Number(tr.avgCost) : undefined;
                    const realizedPl = side === 'SELL'
                      ? (tr.realizedPl !== undefined ? Number(tr.realizedPl) : (avgCost !== undefined ? (price - avgCost) * qty : undefined))
                      : undefined;
                    return (
                      <TableRow hover key={idx}>
                        <TableCell sx={{ color: 'text.secondary' }}>
                          {tr.tradeDate ? formatDate(tr.tradeDate, 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }}}>
                          <Chip size="small" label={side || '-'} color={sideColor as any} variant={sideColor === 'default' ? 'outlined' : 'filled'} />
                        </TableCell>
                        <TableCell align="right">{qty.toLocaleString()}</TableCell>
                        <TableCell align="right">{formatCurrency(price, baseCurrency)}</TableCell>
                        <TableCell align="right" sx={{ color: side === 'BUY' ? 'success.main' : (side === 'SELL' ? 'error.main' : 'text.primary') }}>
                          {formatCurrency(total, baseCurrency)}
                        </TableCell>
                        <TableCell align="right" sx={{color: realizedPl !== undefined ? (realizedPl >= 0 ? 'success.main' : 'error.main') : 'text.secondary' }}>
                          {realizedPl !== undefined ? formatCurrency(realizedPl, baseCurrency) : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
    </ModalWrapper>
  );
};

export default TradeHistoryModal;


