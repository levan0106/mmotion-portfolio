import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  AccountBalance as PortfolioIcon,
  TrendingUp as TransactionIcon,
  Inventory as AssetsIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  AccountBalance as CashFlowIcon,
} from '@mui/icons-material';
import ResponsiveTypography from '../Common/ResponsiveTypography';

// TipBox component
const TipBox = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ 
    p: 2, 
    backgroundColor: '#e3f2fd', 
    borderRadius: 2, 
    border: '1px solid #2196f3',
    mb: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 1
  }}>
    <span>💡</span>
    <Box>{children}</Box>
  </Box>
);

// WarningBox component
const WarningBox = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ 
    p: 2, 
    backgroundColor: '#fff3e0', 
    borderRadius: 2, 
    border: '1px solid #ff9800',
    mb: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 1
  }}>
    <span>⚠️</span>
    <Box>{children}</Box>
  </Box>
);

// InfoBox component
const InfoBox = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ 
    p: 2, 
    backgroundColor: '#e8f5e8', 
    borderRadius: 2, 
    border: '1px solid #4caf50',
    mb: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 1
  }}>
    <span>ℹ️</span>
    <Box>{children}</Box>
  </Box>
);

const DetailedGuideSection: React.FC = () => {
  const portfolioSteps = [
    {
      label: 'Đăng nhập hệ thống',
      description: 'Sử dụng tài khoản quản lý với quyền OWNER',
      details: 'Truy cập https://mmotion.cloud và đăng nhập với email/username đã được cấp quyền quản lý'
    },
    {
      label: 'Tạo Portfolio mới',
      description: 'Chọn menu Portfolio > Tạo mới',
      details: 'Nhấn nút "Tạo Portfolio" ở góc trên bên phải'
    },
    {
      label: 'Thiết lập thông tin cơ bản',
      description: 'Nhập tên, mô tả và loại portfolio',
      details: 'Ví dụ: "Portfolio Cổ phiếu Blue-chip", "Portfolio Trái phiếu Chính phủ"'
    },
    {
      label: 'Cấu hình mục tiêu đầu tư',
      description: 'Chọn mục tiêu và chiến lược phân bổ',
      details: 'Tăng trưởng (80% cổ phiếu, 20% trái phiếu), Thu nhập (20% cổ phiếu, 80% trái phiếu)'
    },
    {
      label: 'Thiết lập ngân sách ban đầu',
      description: 'Nhập số tiền đầu tư ban đầu',
      details: 'Ví dụ: 1,000,000,000 VND cho portfolio cổ phiếu'
    },
    {
      label: 'Kích hoạt Portfolio',
      description: 'Lưu và kích hoạt portfolio để bắt đầu giao dịch',
      details: 'Sau khi kích hoạt, bạn có thể thêm giao dịch và quản lý các loại tài sản'
    }
  ];

  const transactionSteps = [
    {
      label: 'Chọn Portfolio',
      description: 'Vào portfolio muốn thêm giao dịch',
      details: 'Từ danh sách portfolio, chọn portfolio phù hợp'
    },
    {
      label: 'Thêm giao dịch mới',
      description: 'Nhấn nút "Thêm giao dịch"',
      details: 'Chọn loại giao dịch: Mua hoặc Bán'
    },
    {
      label: 'Nhập thông tin chứng khoán',
      description: 'Nhập mã chứng khoán và số lượng',
      details: 'Ví dụ: VIC (Vingroup), VHM (Vinhomes), VRE (Vincom Retail)'
    },
    {
      label: 'Thiết lập giá và ngày',
      description: 'Nhập giá giao dịch và ngày thực hiện',
      details: 'Giá có thể nhập thủ công hoặc lấy từ thị trường'
    },
    {
      label: 'Thêm phí giao dịch',
      description: 'Nhập phí môi giới và các phí khác',
      details: 'Phí môi giới thường 0.15-0.25% giá trị giao dịch'
    },
    {
      label: 'Xác nhận và lưu',
      description: 'Kiểm tra thông tin và lưu giao dịch',
      details: 'Hệ thống sẽ tự động cập nhật Assets và tính P&L'
    }
  ];

  const assetsActions = [
    { action: 'Xem danh sách Assets', icon: <ViewIcon />, description: 'Xem tất cả cổ phiếu trong portfolio' },
    { action: 'Cập nhật giá thị trường', icon: <EditIcon />, description: 'Đồng bộ giá mới nhất từ thị trường' },
    { action: 'Thêm giao dịch mới', icon: <AddIcon />, description: 'Thêm giao dịch mua/bán mới' },
    { action: 'Chỉnh sửa giao dịch', icon: <EditIcon />, description: 'Sửa thông tin giao dịch đã có' },
    { action: 'Xóa giao dịch', icon: <DeleteIcon />, description: 'Xóa giao dịch không chính xác' },
    { action: 'Xuất báo cáo', icon: <ViewIcon />, description: 'Tải xuống báo cáo chi tiết' }
  ];

  const cashFlowSteps = [
    {
      label: 'Theo dõi dòng tiền',
      description: 'Giám sát cash flow real-time',
      details: 'Inflows: Dividends, Interest, Capital gains. Outflows: Fees, Taxes'
    },
    {
      label: 'Dự báo thanh khoản',
      description: 'Dự đoán nhu cầu tiền mặt',
      details: '30-day, 90-day, 1-year liquidity forecasts'
    },
    {
      label: 'Quản lý dividend',
      description: 'Tự động hóa thu nhập từ cổ tức',
      details: 'Dividend calendar, Reinvestment options, Tax optimization'
    }
  ];

  const cashFlowExamples = [
    { date: '2024-01-15', type: 'Dividend', symbol: 'VIC', amount: 500000, description: 'Cổ tức Vingroup Q4/2023' },
    { date: '2024-01-20', type: 'Interest', symbol: 'BOND', amount: 250000, description: 'Lãi trái phiếu chính phủ' },
    { date: '2024-02-01', type: 'Capital Gain', symbol: 'VIC', amount: 2000000, description: 'Lãi từ bán cổ phiếu VIC' },
    { date: '2024-02-10', type: 'Fee', symbol: 'TRADING', amount: -150000, description: 'Phí giao dịch và quản lý' },
    { date: '2024-02-15', type: 'Tax', symbol: 'TAX', amount: -300000, description: 'Thuế thu nhập từ đầu tư' },
    { date: '2024-02-20', type: 'Dividend', symbol: 'VHM', amount: 750000, description: 'Cổ tức Vinhomes Q1/2024' }
  ];

  const exampleTransactions = [
    { date: '2024-01-15', type: 'Mua', symbol: 'VIC', quantity: 1000, price: 45000, total: 45000000, fees: 112500 },
    { date: '2024-01-20', type: 'Mua', symbol: 'VHM', quantity: 500, price: 32000, total: 16000000, fees: 40000 },
    { date: '2024-02-01', type: 'Bán', symbol: 'VIC', quantity: 200, price: 47000, total: 9400000, fees: 23500 },
    { date: '2024-02-10', type: 'Mua', symbol: 'VRE', quantity: 800, price: 28000, total: 22400000, fees: 56000 }
  ];

  return (
    <Box id="detailed-guide" sx={{ mb: 6 }}>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <ResponsiveTypography variant="cardTitle" component="h2" gutterBottom>
            Hướng dẫn chi tiết
          </ResponsiveTypography>
          <ResponsiveTypography variant="cardLabel" color="text.secondary" paragraph>
            Các bước cụ thể để sử dụng các tính năng chính của hệ thống
          </ResponsiveTypography>

          <TipBox>
            Mỗi bước đều có hướng dẫn chi tiết với số thứ tự rõ ràng. Hãy làm theo đúng thứ tự để đảm bảo hệ thống hoạt động tốt nhất.
          </TipBox>

          {/* Portfolio Creation */}
          <Paper elevation={2} sx={{ p: 2, mb: 2 }} id="portfolio-creation">
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PortfolioIcon sx={{ color: 'primary.main' }} />
              Tạo Portfolio Chi Tiết
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Hướng dẫn từng bước để tạo portfolio với đầy đủ thông tin
            </Typography>

            <Stepper orientation="vertical" sx={{ mt: 1, '& .MuiStepContent-root': { pl: 2 } }}>
              {portfolioSteps.map((step, index) => (
                <Step key={index} active completed>
                  <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.9rem' } }}>
                    <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 600 }}>
                      {step.label}
                    </Typography>
                  </StepLabel>
                  <StepContent sx={{ pl: 1, pb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {step.description}
                    </Typography>
                    <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
                      {step.details}
                    </Typography>
                  </StepContent>
                </Step>
              ))}
            </Stepper>

            <WarningBox>
              <Typography variant="body2">
                <strong>Quan trọng:</strong> Đảm bảo tên portfolio mô tả rõ mục đích để dễ quản lý sau này. 
                Mỗi portfolio có thể chứa nhiều loại tài sản khác nhau.
              </Typography>
            </WarningBox>
          </Paper>

          {/* Transaction Creation */}
          <Paper elevation={2} sx={{ p: 2, mb: 2 }} id="transaction-creation">
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TransactionIcon sx={{ color: 'success.main' }} />
              Tạo Giao Dịch
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Hướng dẫn thêm giao dịch vào portfolio
            </Typography>

            <Stepper orientation="vertical" sx={{ mt: 1, '& .MuiStepContent-root': { pl: 2 } }}>
              {transactionSteps.map((step, index) => (
                <Step key={index} active completed>
                  <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.9rem' } }}>
                    <Typography variant="subtitle1" sx={{ color: 'success.main', fontWeight: 600 }}>
                      {step.label}
                    </Typography>
                  </StepLabel>
                  <StepContent sx={{ pl: 1, pb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {step.description}
                    </Typography>
                    <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
                      {step.details}
                    </Typography>
                  </StepContent>
                </Step>
              ))}
            </Stepper>

            <InfoBox>
              <Typography variant="body2">
                Hệ thống sẽ tự động tính toán tổng giá trị, P&L và cập nhật danh mục Assets. 
                Tất cả giao dịch đều được lưu trữ và có thể xem lại bất kỳ lúc nào.
              </Typography>
            </InfoBox>

            {/* Example Transactions Table */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <InfoIcon />
                Ví dụ giao dịch mẫu - Portfolio "Cổ phiếu Blue-chip"
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                Dưới đây là ví dụ về các giao dịch thực tế trong một portfolio đầu tư cổ phiếu:
              </Typography>

              <TableContainer component={Paper} elevation={1}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Ngày</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Loại</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Mã CK</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Số lượng</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Giá (VND)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Tổng tiền</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Phí</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {exampleTransactions.map((tx, index) => (
                      <TableRow key={index} hover sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{tx.date}</TableCell>
                        <TableCell>
                          <Chip 
                            label={tx.type} 
                            color={tx.type === 'Mua' ? 'success' : 'error'} 
                            size="small"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: '0.8rem' }}>{tx.symbol}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{tx.quantity.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{tx.price.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{tx.total.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{tx.fees.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Transaction Analysis */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  📊 Phân tích ví dụ:
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={1} sx={{ p: 1.5, textAlign: 'center', backgroundColor: '#e8f5e8' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Tổng đầu tư
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 600 }}>
                        {exampleTransactions
                          .filter(tx => tx.type === 'Mua')
                          .reduce((sum, tx) => sum + tx.total, 0)
                          .toLocaleString()} VND
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={1} sx={{ p: 1.5, textAlign: 'center', backgroundColor: '#fff3e0' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Đã bán
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'warning.main', fontWeight: 600 }}>
                        {exampleTransactions
                          .filter(tx => tx.type === 'Bán')
                          .reduce((sum, tx) => sum + tx.total, 0)
                          .toLocaleString()} VND
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={1} sx={{ p: 1.5, textAlign: 'center', backgroundColor: '#e3f2fd' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Tổng phí
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'info.main', fontWeight: 600 }}>
                        {exampleTransactions
                          .reduce((sum, tx) => sum + tx.fees, 0)
                          .toLocaleString()} VND
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={1} sx={{ p: 1.5, textAlign: 'center', backgroundColor: '#f3e5f5' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Số giao dịch
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'secondary.main', fontWeight: 600 }}>
                        {exampleTransactions.length} lần
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {/* Transaction Explanation */}
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  💡 Giải thích chi tiết:
                </Typography>
                <List dense>
                  <ListItem sx={{ py: 0.25 }}>
                    <ListItemText 
                      primary="• Mua 1,000 cổ phiếu VIC (Vingroup) với giá 45,000 VND/cổ phiếu"
                      secondary="Tổng đầu tư: 45,000,000 VND + phí 112,500 VND"
                      primaryTypographyProps={{ fontSize: '0.8rem' }}
                      secondaryTypographyProps={{ fontSize: '0.7rem' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0.25 }}>
                    <ListItemText 
                      primary="• Mua 500 cổ phiếu VHM (Vinhomes) với giá 32,000 VND/cổ phiếu"
                      secondary="Tổng đầu tư: 16,000,000 VND + phí 40,000 VND"
                      primaryTypographyProps={{ fontSize: '0.8rem' }}
                      secondaryTypographyProps={{ fontSize: '0.7rem' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0.25 }}>
                    <ListItemText 
                      primary="• Bán 200 cổ phiếu VIC với giá 47,000 VND/cổ phiếu (lãi 2,000 VND/cổ phiếu)"
                      secondary="Thu về: 9,400,000 VND - phí 23,500 VND = Lãi: 400,000 VND"
                      primaryTypographyProps={{ fontSize: '0.8rem' }}
                      secondaryTypographyProps={{ fontSize: '0.7rem' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0.25 }}>
                    <ListItemText 
                      primary="• Mua 800 cổ phiếu VRE (Vincom Retail) với giá 28,000 VND/cổ phiếu"
                      secondary="Tổng đầu tư: 22,400,000 VND + phí 56,000 VND"
                      primaryTypographyProps={{ fontSize: '0.8rem' }}
                      secondaryTypographyProps={{ fontSize: '0.7rem' }}
                    />
                  </ListItem>
                </List>
              </Box>
            </Box>
          </Paper>

          {/* Assets Management */}
          <Paper elevation={2} sx={{ p: 2, mb: 2 }} id="tradings-management">
            <Typography  variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssetsIcon sx={{ color: 'info.main' }} />
              Quản Lý Giao Dịch
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Theo dõi và quản lý danh mục đầu tư hiện tại
            </Typography>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ViewIcon />
                  Xem Giao Dịch
                </Typography>
                <List dense sx={{ '& .MuiListItem-root': { py: 0.25 } }}>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Vào tab 'Quản lý Giao Dịch' trong portfolio" 
                      secondary="Xem danh sách tất cả giao dịch hiện có"
                      primaryTypographyProps={{ fontSize: '0.85rem' }}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Kiểm tra số lượng và giá trị hiện tại" 
                      secondary="Thông tin được cập nhật hàng ngày"
                      primaryTypographyProps={{ fontSize: '0.85rem' }}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Theo dõi P&L từng mã" 
                      secondary="Lãi/lỗ chưa thực hiện và đã thực hiện"
                      primaryTypographyProps={{ fontSize: '0.85rem' }}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <EditIcon />
                  Cập nhật Giao Dịch
                </Typography>
                <List dense sx={{ '& .MuiListItem-root': { py: 0.25 } }}>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Chỉnh sửa thông tin giao dịch" 
                      secondary="Sửa giá, số lượng, ngày giao dịch"
                      primaryTypographyProps={{ fontSize: '0.85rem' }}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Thêm giao dịch bổ sung" 
                      secondary="Mua thêm hoặc bán một phần"
                      primaryTypographyProps={{ fontSize: '0.85rem' }}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Cập nhật giá thị trường" 
                      secondary="Đồng bộ giá mới nhất từ sàn giao dịch"
                      primaryTypographyProps={{ fontSize: '0.85rem' }}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Assets Actions */}
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <InfoIcon />
              Các thao tác với Giao Dịch
            </Typography>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              {assetsActions.map((action, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper elevation={1} sx={{ p: 1.5, textAlign: 'center', height: '100%' }}>
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      bgcolor: 'primary.main', 
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 0.5
                    }}>
                      {action.icon}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.8rem' }}>
                      {action.action}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      {action.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <TipBox>
              <Typography variant="body2">
                Giá tài sản được cập nhật hàng ngày. Bạn có thể xem lịch sử giao dịch, phân tích hiệu suất, 
                và xuất báo cáo chi tiết bất kỳ lúc nào.
              </Typography>
            </TipBox>
          </Paper>

          {/* Cash Flow Management */}
          <Paper elevation={2} sx={{ p: 2, mb: 2 }} id="cash-flow">
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CashFlowIcon sx={{ color: 'info.main' }} />
              Quản lý dòng tiền
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Hướng dẫn quản lý và tối ưu hóa dòng tiền đầu tư
            </Typography>

            <Stepper orientation="vertical" sx={{ mt: 1, '& .MuiStepContent-root': { pl: 2 } }}>
              {cashFlowSteps.map((step, index) => (
                <Step key={index} active completed>
                  <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.9rem' } }}>
                    <Typography variant="subtitle1" sx={{ color: 'info.main', fontWeight: 600 }}>
                      {step.label}
                    </Typography>
                  </StepLabel>
                  <StepContent sx={{ pl: 1, pb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {step.description}
                    </Typography>
                    <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
                      {step.details}
                    </Typography>
                  </StepContent>
                </Step>
              ))}
            </Stepper>

            {/* Cash Flow Examples Table */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <InfoIcon />
                Ví dụ dòng tiền mẫu - Portfolio "Cổ phiếu Blue-chip"
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                Dưới đây là ví dụ về các dòng tiền thực tế trong một portfolio đầu tư:
              </Typography>

              <TableContainer component={Paper} elevation={1}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Ngày</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Loại</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Mã</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Số tiền (VND)</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Mô tả</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cashFlowExamples.map((flow, index) => (
                      <TableRow key={index} hover sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{flow.date}</TableCell>
                        <TableCell>
                          <Chip 
                            label={flow.type} 
                            color={
                              flow.type === 'Dividend' || flow.type === 'Interest' || flow.type === 'Capital Gain' 
                                ? 'success' 
                                : 'error'
                            } 
                            size="small"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: '0.8rem' }}>{flow.symbol}</TableCell>
                        <TableCell align="right" sx={{ 
                          fontSize: '0.8rem', 
                          fontWeight: 500,
                          color: flow.amount > 0 ? 'success.main' : 'error.main'
                        }}>
                          {flow.amount > 0 ? '+' : ''}{flow.amount.toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{flow.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Cash Flow Analysis */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  📊 Phân tích dòng tiền:
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={1} sx={{ p: 1.5, textAlign: 'center', backgroundColor: '#e8f5e8' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Tổng thu nhập
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 600 }}>
                        {cashFlowExamples
                          .filter(flow => flow.amount > 0)
                          .reduce((sum, flow) => sum + flow.amount, 0)
                          .toLocaleString()} VND
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={1} sx={{ p: 1.5, textAlign: 'center', backgroundColor: '#fff3e0' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Tổng chi phí
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'error.main', fontWeight: 600 }}>
                        {Math.abs(cashFlowExamples
                          .filter(flow => flow.amount < 0)
                          .reduce((sum, flow) => sum + flow.amount, 0))
                          .toLocaleString()} VND
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={1} sx={{ p: 1.5, textAlign: 'center', backgroundColor: '#e3f2fd' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Dòng tiền ròng
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        color: cashFlowExamples.reduce((sum, flow) => sum + flow.amount, 0) > 0 ? 'success.main' : 'error.main', 
                        fontWeight: 600 
                      }}>
                        {cashFlowExamples
                          .reduce((sum, flow) => sum + flow.amount, 0)
                          .toLocaleString()} VND
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={1} sx={{ p: 1.5, textAlign: 'center', backgroundColor: '#f3e5f5' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Số giao dịch
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'secondary.main', fontWeight: 600 }}>
                        {cashFlowExamples.length} lần
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {/* Cash Flow Explanation */}
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  💡 Giải thích dòng tiền:
                </Typography>
                <List dense>
                  <ListItem sx={{ py: 0.25 }}>
                    <ListItemText 
                      primary="• Thu nhập từ cổ tức: 500,000 VND (VIC) + 750,000 VND (VHM) = 1,250,000 VND"
                      secondary="Thu nhập thụ động từ cổ phiếu sở hữu"
                      primaryTypographyProps={{ fontSize: '0.8rem' }}
                      secondaryTypographyProps={{ fontSize: '0.7rem' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0.25 }}>
                    <ListItemText 
                      primary="• Lãi từ đầu tư: 250,000 VND (trái phiếu) + 2,000,000 VND (bán cổ phiếu) = 2,250,000 VND"
                      secondary="Thu nhập từ lãi suất và lãi vốn"
                      primaryTypographyProps={{ fontSize: '0.8rem' }}
                      secondaryTypographyProps={{ fontSize: '0.7rem' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0.25 }}>
                    <ListItemText 
                      primary="• Chi phí: 150,000 VND (phí) + 300,000 VND (thuế) = 450,000 VND"
                      secondary="Chi phí vận hành và nghĩa vụ thuế"
                      primaryTypographyProps={{ fontSize: '0.8rem' }}
                      secondaryTypographyProps={{ fontSize: '0.7rem' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0.25 }}>
                    <ListItemText 
                      primary="• Dòng tiền ròng: +3,050,000 VND (thu nhập ròng tích cực)"
                      secondary="Tổng dòng tiền sau khi trừ chi phí"
                      primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 600 }}
                      secondaryTypographyProps={{ fontSize: '0.7rem' }}
                    />
                  </ListItem>
                </List>
              </Box>
            </Box>

            <TipBox>
              <Typography variant="body2">
                <strong>Mẹo:</strong> Sử dụng tính năng dự báo thanh khoản để lập kế hoạch đầu tư dài hạn và 
                tránh tình trạng thiếu tiền mặt khi cần thiết.
              </Typography>
            </TipBox>
          </Paper>

          {/* Summary */}
          <Box sx={{ 
            p: 2, 
            backgroundColor: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%)', 
            borderRadius: 2, 
            border: '2px solid #2196f3',
            textAlign: 'center',
            mt: 2
          }}>
            <Typography variant="h6" sx={{ color: 'primary.main', mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              📋 Tổng kết hướng dẫn chi tiết
            </Typography>
            <Typography variant="body2" color="text.primary">
              Với 4 bước chính: Tạo Portfolio → Thêm Giao dịch → Quản lý Giao Dịch → Quản lý dòng tiền, 
              bạn có thể dễ dàng quản lý danh mục đầu tư một cách chuyên nghiệp và hiệu quả.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DetailedGuideSection;
