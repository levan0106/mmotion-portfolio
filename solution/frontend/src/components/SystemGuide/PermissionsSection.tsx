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
import {
  AdminPanelSettings as AdminIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import ResponsiveTypography from '../Common/ResponsiveTypography';

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


const PermissionsSection: React.FC = () => {
  const permissionLevels = [
    {
      level: 'OWNER',
      color: 'error',
      icon: <AdminIcon />,
      description: 'Toàn quyền quản lý',
      permissions: [
        'Tạo, sửa, xóa tài khoản',
        'Tạo, sửa, xóa portfolio',
        'Thực hiện giao dịch',
        'Chia sẻ quyền truy cập',
        'Xem tất cả dữ liệu',
        'Quản lý cài đặt hệ thống'
      ]
    },
    {
      level: 'UPDATE',
      color: 'warning',
      icon: <EditIcon />,
      description: 'Quyền cập nhật',
      permissions: [
        'Xem portfolio được chia sẻ',
        'Thêm, sửa giao dịch',
        'Cập nhật các mã tài sản',
        'Xem báo cáo',
        'Không thể chia sẻ quyền'
      ]
    },
    {
      level: 'VIEW',
      color: 'info',
      icon: <ViewIcon />,
      description: 'Quyền xem',
      permissions: [
        'Xem portfolio được chia sẻ',
        'Xem báo cáo',
        'Không thể chỉnh sửa',
        'Chỉ đọc dữ liệu'
      ]
    }
  ];


  return (
    <Box id="permissions" sx={{ mb: 6 }}>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <ResponsiveTypography variant="cardTitle" component="h2" gutterBottom>
            Hệ thống phân quyền
          </ResponsiveTypography>
          <ResponsiveTypography variant="cardLabel" color="text.secondary" paragraph>
            Cơ chế phân quyền chi tiết và cách hoạt động của hệ thống
          </ResponsiveTypography>

          <InfoBox>
            <Typography variant="body2">
              Hệ thống sử dụng mô hình phân quyền 3 cấp (OWNER, UPDATE, VIEW) để đảm bảo bảo mật và kiểm soát truy cập dữ liệu.
            </Typography>
          </InfoBox>

          {/* Permission Levels Overview */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon />
              Các cấp độ phân quyền
            </Typography>

            <Grid container spacing={2}>
              {permissionLevels.map((level) => (
                <Grid item xs={12} md={4} key={level.level}>
                  <Paper elevation={2} sx={{ p: 3, borderLeft: '4px solid', borderLeftColor: `${level.color}.main`, height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        bgcolor: `${level.color}.main`, 
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2
                      }}>
                        {level.icon}
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ color: `${level.color}.main`, fontWeight: 600 }}>
                          {level.level}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {level.description}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <List dense>
                      {level.permissions.map((permission, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemIcon>
                            <CheckIcon sx={{ color: `${level.color}.main`, fontSize: '1rem' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={permission}
                            primaryTypographyProps={{ fontSize: '0.875rem' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Permission Matrix */}
          {/* <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon />
              Ma trận phân quyền chi tiết
            </Typography>

            <TableContainer component={Paper} elevation={1}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Hành động</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, color: 'error.main' }}>OWNER</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, color: 'warning.main' }}>UPDATE</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, color: 'info.main' }}>VIEW</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {permissionMatrix.map((row, index) => (
                    <TableRow key={index} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{row.action}</TableCell>
                      <TableCell align="center">
                        {row.owner ? (
                          <CheckIcon sx={{ color: 'success.main' }} />
                        ) : (
                          <CancelIcon sx={{ color: 'error.main' }} />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {row.update ? (
                          <CheckIcon sx={{ color: 'success.main' }} />
                        ) : (
                          <CancelIcon sx={{ color: 'error.main' }} />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {row.view ? (
                          <CheckIcon sx={{ color: 'success.main' }} />
                        ) : (
                          <CancelIcon sx={{ color: 'error.main' }} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box> */}

          {/* User Roles */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon />
              Vai trò người dùng
            </Typography>

            <Grid container spacing={3}>
              {/* Admin Role */}
              {/* <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3, borderLeft: '4px solid', borderLeftColor: 'error.main' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AdminIcon sx={{ color: 'error.main', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: 'error.main' }}>
                      Quản trị viên (Admin)
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Có quyền OWNER trên tất cả tài khoản và portfolio trong hệ thống
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Tạo và quản lý tài khoản khách hàng" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Tạo portfolio cho khách hàng" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Chia sẻ quyền truy cập" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Quản lý cài đặt hệ thống" />
                    </ListItem>
                  </List>
                </Paper>
              </Grid> */}

              {/* Manager Role */}
              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3, borderLeft: '4px solid', borderLeftColor: 'warning.main' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BusinessIcon sx={{ color: 'warning.main', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: 'warning.main' }}>
                      Nhà quản lý (Fund Manager)
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Có quyền OWNER trên các tài khoản được phân công
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Quản lý portfolio khách hàng" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Thực hiện giao dịch" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Chia sẻ dữ liệu với khách hàng" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Tạo báo cáo" />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>

              {/* Customer Role */}
              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3, borderLeft: '4px solid', borderLeftColor: 'info.main' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PersonIcon sx={{ color: 'info.main', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: 'info.main' }}>
                      Khách hàng (Customer)
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Có quyền VIEW hoặc UPDATE trên portfolio được chia sẻ
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Xem portfolio của mình" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Theo dõi hiệu suất đầu tư" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Nhận báo cáo từ quản lý" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Cập nhật thông tin cá nhân" />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>

              {/* Guest Role */}
              {/* <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3, borderLeft: '4px solid', borderLeftColor: 'grey.500' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ViewIcon sx={{ color: 'grey.500', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: 'grey.500' }}>
                      Khách (Guest)
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Chỉ có quyền VIEW trên portfolio được chia sẻ công khai
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Xem thông tin công khai" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Không thể chỉnh sửa" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Truy cập hạn chế" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Cần đăng ký để có quyền cao hơn" />
                    </ListItem>
                  </List>
                </Paper>
              </Grid> */}
            </Grid>
          </Box>

          {/* Summary */}
          <Box sx={{ 
            p: 3, 
            backgroundColor: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%)', 
            borderRadius: 2, 
            border: '2px solid #2196f3',
            textAlign: 'center',
            mt: 3
          }}>
            <Typography variant="h6" sx={{ color: 'primary.main', mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              🔒 Tổng kết hệ thống phân quyền
            </Typography>
            <Typography variant="body2" color="text.primary">
              Hệ thống phân quyền theo cấp độ đảm bảo bảo mật dữ liệu, kiểm soát truy cập chặt chẽ và 
              phù hợp với nhu cầu quản lý của các tổ chức tài chính chuyên nghiệp.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PermissionsSection;
