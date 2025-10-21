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
  Divider,
} from '@mui/material';
import {
  Business as ManagerIcon,
  Person as CustomerIcon,
  CheckCircle as CheckIcon,
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


const GettingStartedSection: React.FC = () => {
  const managerSteps = [
    {
      label: 'Đăng ký tài khoản quản lý',
      description: 'Tạo tài khoản đăng nhập',
      details: 'Truy cập https://mmotion.com/register và chọn "Đăng ký làm nhà quản lý"'
    },
    {
      label: 'Xác thực tài khoản',
      description: 'Xác thực email và hoàn thiện hồ sơ',
      details: 'Kiểm tra email, xác thực tài khoản và cập nhật thông tin cá nhân'
    },
    {
      label: 'Tạo tài khoản khách hàng',
      description: 'Thêm khách hàng vào hệ thống',
      details: 'Vào menu "Quản lý khách hàng" > "Thêm mới" > Nhập thông tin khách hàng'
    },
    {
      label: 'Tạo portfolio cho khách hàng',
      description: 'Thiết lập danh mục đầu tư',
      details: 'Chọn khách hàng > "Tạo Portfolio" > Thiết lập mục tiêu và chiến lược đầu tư'
    },
    {
      label: 'Chia sẻ quyền truy cập',
      description: 'Cấp quyền xem cho khách hàng',
      details: 'Chọn portfolio > "Chia sẻ" > Nhập Account ID khách hàng > Chọn quyền VIEW/UPDATE'
    },
    {
      label: 'Theo dõi và báo cáo',
      description: 'Giám sát hiệu suất và tạo báo cáo',
      details: 'Sử dụng dashboard để theo dõi hiệu suất và tạo báo cáo định kỳ cho khách hàng'
    }
  ];

  const customerSteps = [
    {
      label: 'Đăng nhập hệ thống',
      description: 'Truy cập vào tài khoản',
      details: 'Đăng ký tài khoản hoặc liên hệ với nhà quản lý để nhận thông tin đăng nhập'
    },
    {
      label: 'Chọn tài khoản được chia sẻ',
      description: 'Kết nối với portfolio của bạn',
      details: 'Vào menu "Tài khoản" > "Kết nối tài khoản" > Nhập Account ID'
    },
    {
      label: 'Xem portfolio và báo cáo',
      description: 'Theo dõi danh mục đầu tư',
      details: 'Truy cập menu "Nhà đầu tư" để xem portfolio, giao dịch và báo cáo hiệu suất'
    },
    {
      label: 'Theo dõi hiệu suất',
      description: 'Giám sát kết quả đầu tư',
      details: 'Sử dụng dashboard để theo dõi P&L, hiệu suất và nhận báo cáo từ nhà quản lý'
    }
  ];


  return (
    <Box id="getting-started" sx={{ mb: 6 }}>
      <Card>
        <CardContent>
          <ResponsiveTypography variant="cardTitle" component="h2" gutterBottom>
            Bắt đầu sử dụng
          </ResponsiveTypography>
          <ResponsiveTypography variant="cardLabel" color="text.secondary" paragraph>
            Hướng dẫn chi tiết để bắt đầu sử dụng hệ thống
          </ResponsiveTypography>

          <InfoBox>
            <Typography variant="body2">
              Chọn đúng vai trò của bạn (Nhà quản lý hoặc Khách hàng) để xem hướng dẫn phù hợp nhất. 
              Mỗi vai trò có quy trình và quyền hạn khác nhau.
            </Typography>
          </InfoBox>

          {/* For Managers */}
          <Paper elevation={2} sx={{ p: 2, mb: 2 }} id="for-managers">
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ManagerIcon sx={{ color: 'primary.main' }} />
              Cho nhà quản lý
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Hướng dẫn chi tiết để thiết lập và quản lý hệ thống cho nhà quản lý đầu tư
            </Typography>

            <Stepper orientation="vertical" sx={{ mt: 1, '& .MuiStepContent-root': { pl: 2 } }}>
              {managerSteps.map((step, index) => (
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

            <TipBox>
              <Typography variant="body2">
                <strong>Mẹo:</strong> Bắt đầu với 1-2 khách hàng để làm quen với hệ thống trước khi mở rộng quy mô.
              </Typography>
            </TipBox>
          </Paper>

          {/* For Customers */}
          <Paper elevation={2} sx={{ p: 2, mb: 2 }} id="for-customers">
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CustomerIcon sx={{ color: 'success.main' }} />
              Cho khách hàng
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Hướng dẫn để khách hàng bắt đầu sử dụng hệ thống và theo dõi đầu tư
            </Typography>

            <Stepper orientation="vertical" sx={{ mt: 1, '& .MuiStepContent-root': { pl: 2 } }}>
              {customerSteps.map((step, index) => (
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
                <strong>Lưu ý:</strong> Bạn cần có Account ID từ nhà quản lý để có thể truy cập vào portfolio của mình.
              </Typography>
            </InfoBox>
          </Paper>

          <Divider sx={{ my: 3 }} />

          {/* Support Section */}
          {/* <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SupportIcon />
              Cần hỗ trợ?
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Nếu bạn gặp khó khăn trong quá trình thiết lập hoặc sử dụng hệ thống, hãy liên hệ với chúng tôi:
            </Typography>

            <Grid container spacing={2}>
              {supportContacts.map((contact, index) => (
                <Grid item xs={12} sm={4} key={index}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                    <Box sx={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: '50%', 
                      bgcolor: 'primary.main', 
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 1
                    }}>
                      {contact.icon}
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {contact.type}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                      {contact.contact}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {contact.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box> */}

          {/* Quick Start Checklist */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CheckIcon />
              Checklist bắt đầu nhanh
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2, borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ManagerIcon />
                    Nhà quản lý
                  </Typography>
                  <List dense>
                    <ListItem sx={{ py: 0.25 }}>
                      <ListItemIcon>
                        <CheckIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Đăng ký tài khoản quản lý" 
                        primaryTypographyProps={{ fontSize: '0.8rem' }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.25 }}>
                      <ListItemIcon>
                        <CheckIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Tạo tài khoản khách hàng đầu tiên" 
                        primaryTypographyProps={{ fontSize: '0.8rem' }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.25 }}>
                      <ListItemIcon>
                        <CheckIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Thiết lập portfolio mẫu" 
                        primaryTypographyProps={{ fontSize: '0.8rem' }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.25 }}>
                      <ListItemIcon>
                        <CheckIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Chia sẻ quyền truy cập" 
                        primaryTypographyProps={{ fontSize: '0.8rem' }}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2, borderLeft: '4px solid', borderLeftColor: 'success.main' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CustomerIcon />
                    Khách hàng
                  </Typography>
                  <List dense>
                    <ListItem sx={{ py: 0.25 }}>
                      <ListItemIcon>
                        <CheckIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Đăng ký tài khoản khách hàng" 
                        primaryTypographyProps={{ fontSize: '0.8rem' }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.25 }}>
                      <ListItemIcon>
                        <CheckIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Nhận Account ID từ quản lý" 
                        primaryTypographyProps={{ fontSize: '0.8rem' }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.25 }}>
                      <ListItemIcon>
                        <CheckIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Kết nối tài khoản được chia sẻ" 
                        primaryTypographyProps={{ fontSize: '0.8rem' }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.25 }}>
                      <ListItemIcon>
                        <CheckIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Bắt đầu theo dõi đầu tư" 
                        primaryTypographyProps={{ fontSize: '0.8rem' }}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* Summary */}
          <Box sx={{ 
            p: 2, 
            backgroundColor: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%)', 
            borderRadius: 2, 
            border: '2px solid #2196f3',
            textAlign: 'center',
            mt: 3
          }}>
            <Typography variant="h6" sx={{ color: 'primary.main', mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              🚀 Sẵn sàng bắt đầu!
            </Typography>
            <Typography variant="body2" color="text.primary">
              Với hướng dẫn chi tiết trên, bạn có thể bắt đầu sử dụng hệ thống một cách dễ dàng và hiệu quả. 
              Nếu cần hỗ trợ, hãy liên hệ với chúng tôi!
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default GettingStartedSection;
