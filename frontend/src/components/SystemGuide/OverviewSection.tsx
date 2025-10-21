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
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ResponsiveTypography from '../Common/ResponsiveTypography';

// TipBox component
const TipBox = ({ children, icon }: { children: React.ReactNode, icon?: React.ReactNode }) => (
  <Box sx={{ 
    p: 2, 
    backgroundColor: '#e3f2fd', 
    borderRadius: 2, 
    border: '1px solid #2196f3',
    mb: 2
  }}>
    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {icon || '💡'} {children}
    </Typography>
  </Box>
);

const OverviewSection: React.FC = () => {
  return (
    <Box id="overview" sx={{ mb: 6 }}>
      <ResponsiveTypography variant="pageTitle" component="h1" gutterBottom>
        Tổng quan hệ thống
      </ResponsiveTypography>
      <ResponsiveTypography variant="pageSubtitle" color="text.secondary" paragraph>
        Hướng dẫn toàn diện về cách sử dụng hệ thống quản lý danh mục đầu tư
      </ResponsiveTypography>

      {/* Workflow Steps */}
      <Card sx={{ mb: 4 }} id="workflow">
        <CardContent>
          <ResponsiveTypography variant="cardTitle" component="h2" gutterBottom>
            Quy trình hoạt động cơ bản
          </ResponsiveTypography>
          <ResponsiveTypography variant="cardLabel" color="text.secondary" paragraph>
            Các bước cơ bản để sử dụng hệ thống từ tạo tài khoản đến chia sẻ dữ liệu
          </ResponsiveTypography>

          <TipBox>
            Hệ thống được thiết kế theo mô hình phân quyền đa cấp, cho phép nhà quản lý tạo và chia sẻ portfolio với khách hàng một cách an toàn và linh hoạt.
          </TipBox>

          {/* Compact Step-by-Step Workflow */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              📋 Quy trình từng bước
            </Typography>

            {/* Compact Steps Grid */}
            <Grid container spacing={1.5}>
              {/* Step 1 */}
              <Grid item xs={12} sm={6} md={4}>
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
                      1
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 600, mb: 0.5 }}>
                        Đăng ký tài khoản quản lý
                      </Typography>
                      <Typography variant="caption" color="text.primary" sx={{ fontSize: '0.75rem' }}>
                        Tạo tài khoản đăng nhập
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Step 2 */}
              <Grid item xs={12} sm={6} md={4}>
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
                      2
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ color: 'success.main', fontWeight: 600, mb: 0.5 }}>
                        Tạo tài khoản khách hàng
                      </Typography>
                      <Typography variant="caption" color="text.primary" sx={{ fontSize: '0.75rem' }}>
                        Account 1, Account 2, Account 3...
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Step 3 */}
              <Grid item xs={12} sm={6} md={4}>
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
                      3
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ color: 'warning.main', fontWeight: 600, mb: 0.5 }}>
                        Tạo Portfolio
                      </Typography>
                      <Typography variant="caption" color="text.primary" sx={{ fontSize: '0.75rem' }}>
                        Portfolio 1, Portfolio 2... theo mục tiêu
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Step 4 */}
              <Grid item xs={12} sm={6} md={4}>
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
                      4
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ color: 'info.main', fontWeight: 600, mb: 0.5 }}>
                        Thêm giao dịch
                      </Typography>
                      <Typography variant="caption" color="text.primary" sx={{ fontSize: '0.75rem' }}>
                        Mua/bán cổ phiếu, trái phiếu
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Step 5 */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={1} sx={{ p: 1.5, borderLeft: '3px solid', borderLeftColor: 'secondary.main', height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box sx={{ 
                      width: 28, 
                      height: 28, 
                      borderRadius: '50%', 
                      bgcolor: 'secondary.main', 
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      5
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ color: 'secondary.main', fontWeight: 600, mb: 0.5 }}>
                        Chia sẻ quyền truy cập
                      </Typography>
                      <Typography variant="caption" color="text.primary" sx={{ fontSize: '0.75rem' }}>
                        Cấp quyền VIEW/UPDATE
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Step 6 */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={1} sx={{ p: 1.5, borderLeft: '3px solid', borderLeftColor: 'error.main', height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box sx={{ 
                      width: 28, 
                      height: 28, 
                      borderRadius: '50%', 
                      bgcolor: 'error.main', 
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      6
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ color: 'error.main', fontWeight: 600, mb: 0.5 }}>
                        Cung cấp Account ID
                      </Typography>
                      <Typography variant="caption" color="text.primary" sx={{ fontSize: '0.75rem' }}>
                        Gửi ID cho khách hàng
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Step 7 */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={1} sx={{ p: 1.5, borderLeft: '3px solid', borderLeftColor: 'success.dark', height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box sx={{ 
                      width: 28, 
                      height: 28, 
                      borderRadius: '50%', 
                      bgcolor: 'success.dark', 
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      7
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ color: 'success.dark', fontWeight: 600, mb: 0.5 }}>
                        Khách hàng truy cập
                      </Typography>
                      <Typography variant="caption" color="text.primary" sx={{ fontSize: '0.75rem' }}>
                        Đăng nhập và xem dữ liệu
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Final Result - Compact */}
            <Box sx={{ 
              p: 2, 
              backgroundColor: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)', 
              borderRadius: 2, 
              border: '2px solid #4caf50',
              textAlign: 'center',
              mt: 2
            }}>
              <Typography variant="h6" sx={{ color: 'success.main', mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                ✅ Kết quả cuối cùng
              </Typography>
              <Typography variant="body2" color="text.primary">
                Khách hàng có thể xem portfolio, theo dõi hiệu suất đầu tư và nhận báo cáo từ nhà quản lý
              </Typography>
            </Box>
          </Box>

          {/* Key Features */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              🔑 Đặc điểm chính của hệ thống
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Typography variant="h6" sx={{ color: 'primary.main' }}>🔐</Typography>
                    </ListItemIcon>
                    <ListItemText 
                      primary="Bảo mật đa cấp" 
                      secondary="Mỗi tài khoản có dữ liệu riêng biệt"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Typography variant="h6" sx={{ color: 'success.main' }}>👥</Typography>
                    </ListItemIcon>
                    <ListItemText 
                      primary="Quản lý đa khách hàng" 
                      secondary="Một quản lý có thể phục vụ nhiều khách hàng"
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Typography variant="h6" sx={{ color: 'warning.main' }}>📊</Typography>
                    </ListItemIcon>
                    <ListItemText 
                      primary="Theo dõi hiệu suất đầu tư" 
                      secondary="Dữ liệu được cập nhật liên tục"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Typography variant="h6" sx={{ color: 'info.main' }}>🔄</Typography>
                    </ListItemIcon>
                    <ListItemText 
                      primary="Chia sẻ linh hoạt" 
                      secondary="Có thể chia sẻ toàn bộ hoặc một phần portfolio"
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default OverviewSection;
