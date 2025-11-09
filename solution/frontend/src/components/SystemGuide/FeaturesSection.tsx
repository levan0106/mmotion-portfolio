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
} from '@mui/material';
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

const FeaturesSection: React.FC = () => {
  return (
    <Card sx={{ mb: 4 }} id="features">
      <CardContent>
        <ResponsiveTypography variant="cardTitle" component="h2" gutterBottom>
          Tính năng chính
        </ResponsiveTypography>
        <ResponsiveTypography variant="cardLabel" color="text.secondary" paragraph>
          Các tính năng cốt lõi của hệ thống
        </ResponsiveTypography>

        <TipBox>
        <Typography variant="body2" color="text.primary">
          Hệ thống được thiết kế với 4 tính năng cốt lõi, mỗi tính năng đều có vai trò quan trọng trong việc quản lý danh mục đầu tư hiệu quả.
        </Typography>
        </TipBox>

        {/* Core Features Grid */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            🔧 Tính năng cốt lõi
          </Typography>

          <Grid container spacing={1.5}>
            {/* Feature 1: Multi-Account Management */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={1} sx={{ p: 1.5, borderLeft: '3px solid', borderLeftColor: 'primary.main', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    👥
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 600, mb: 0.5 }}>
                      Quản lý đa tài khoản
                    </Typography>
                    <Typography variant="caption" color="text.primary" sx={{ fontSize: '0.75rem' }}>
                      Tạo và quản lý nhiều tài khoản khách hàng
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Feature 2: Portfolio Management */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={1} sx={{ p: 1.5, borderLeft: '3px solid', borderLeftColor: 'success.main', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: '50%', 
                    bgcolor: 'success.main', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    📊
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ color: 'success.main', fontWeight: 600, mb: 0.5 }}>
                      Quản lý Portfolio
                    </Typography>
                    <Typography variant="caption" color="text.primary" sx={{ fontSize: '0.75rem' }}>
                      Tạo portfolio theo mục tiêu đầu tư
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Feature 3: Daily Tracking */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={1} sx={{ p: 1.5, borderLeft: '3px solid', borderLeftColor: 'warning.main', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: '50%', 
                    bgcolor: 'warning.main', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    ⚡
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ color: 'warning.main', fontWeight: 600, mb: 0.5 }}>
                      Theo dõi hiệu suất đầu tư
                    </Typography>
                    <Typography variant="caption" color="text.primary" sx={{ fontSize: '0.75rem' }}>
                      Cập nhật dữ liệu và hiệu suất hàng ngày
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Feature 4: Secure Sharing */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={1} sx={{ p: 1.5, borderLeft: '3px solid', borderLeftColor: 'info.main', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: '50%', 
                    bgcolor: 'info.main', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    🔒
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ color: 'info.main', fontWeight: 600, mb: 0.5 }}>
                      Chia sẻ danh mục đầu tư
                    </Typography>
                    <Typography variant="caption" color="text.primary" sx={{ fontSize: '0.75rem' }}>
                      Chia sẻ dữ liệu với quyền truy cập linh hoạt
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Detailed Features */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              📋 Chi tiết từng tính năng
            </Typography>

            <Grid container spacing={2}>
              {/* Multi-Account Management Details */}
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2, borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                  <Typography variant="h6" sx={{ color: 'primary.main', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    👥 Quản lý đa tài khoản
                  </Typography>
                  <List dense>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary="Tạo tài khoản riêng biệt" 
                        secondary="Mỗi khách hàng có tài khoản độc lập"
                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary="Phân quyền linh hoạt" 
                        secondary="UPDATE, VIEW cho từng tài khoản khách hàng"
                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary="Bảo mật dữ liệu" 
                        secondary="Dữ liệu khách hàng được bảo vệ riêng biệt"
                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>

              {/* Portfolio Management Details */}
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2, borderLeft: '4px solid', borderLeftColor: 'success.main' }}>
                  <Typography variant="h6" sx={{ color: 'success.main', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    📊 Quản lý Portfolio
                  </Typography>
                  <List dense>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary="Tạo theo mục tiêu" 
                        secondary="Portfolio được thiết kế theo chiến lược đầu tư"
                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary="Quản lý giao dịch" 
                        secondary="Theo dõi mua/bán, P&L chi tiết"
                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary="Chia sẻ linh hoạt" 
                        secondary="Có thể chia sẻ toàn bộ hoặc một phần portfolio"
                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>

              {/* Daily Tracking Details */}
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2, borderLeft: '4px solid', borderLeftColor: 'warning.main' }}>
                  <Typography variant="h6" sx={{ color: 'warning.main', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    ⚡ Theo dõi hiệu suất đầu tư
                  </Typography>
                  <List dense>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary="Cập nhật giá liên tục" 
                        secondary="Giá cổ phiếu được cập nhật hàng ngày"
                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary="Tính toán P&L" 
                        secondary="Lãi/lỗ được tính toán tự động"
                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary="Báo cáo tức thì" 
                        secondary="Báo cáo hiệu suất được tạo tự động"
                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>

              {/* Secure Sharing Details */}
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2, borderLeft: '4px solid', borderLeftColor: 'info.main' }}>
                  <Typography variant="h6" sx={{ color: 'info.main', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    🔒 Chia sẻ danh mục đầu tư
                  </Typography>
                  <List dense>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary="Quyền truy cập phân cấp" 
                        secondary="OWNER > UPDATE > VIEW"
                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary="Bảo mật dữ liệu" 
                        secondary="Mã hóa và xác thực đăng nhập"
                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary="Kiểm soát truy cập" 
                        secondary="Quản lý quyền truy cập chi tiết"
                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* Benefits Summary */}
          <Box sx={{ 
            p: 2, 
            backgroundColor: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%)', 
            borderRadius: 2, 
            border: '2px solid #2196f3',
            textAlign: 'center',
            mt: 3
          }}>
            <Typography variant="h6" sx={{ color: 'primary.main', mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              🎯 Lợi ích tổng thể
            </Typography>
            <Typography variant="body2" color="text.primary">
              Hệ thống tích hợp 4 tính năng cốt lõi giúp quản lý danh mục đầu tư hiệu quả, 
              bảo mật cao và dễ sử dụng cho cả nhà quản lý và khách hàng.
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FeaturesSection;
