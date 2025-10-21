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
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Share as ShareIcon,
  Assessment as AssessmentIcon,
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

const UseCasesSection: React.FC = () => {
  return (
    <Box id="use-cases" sx={{ mb: 6 }}>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <ResponsiveTypography variant="cardTitle" component="h2" gutterBottom>
            Trường hợp sử dụng
          </ResponsiveTypography>
          <ResponsiveTypography variant="cardLabel" color="text.secondary" paragraph>
            Các tình huống thực tế và cách hệ thống giải quyết từng vấn đề cụ thể
          </ResponsiveTypography>

          <InfoBox>
            <Typography variant="body2">
              Hệ thống được thiết kế để phục vụ nhiều loại người dùng khác nhau với các nhu cầu đa dạng về quản lý danh mục đầu tư.
            </Typography>
          </InfoBox>

          {/* Use Case 1: Investment Manager */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }} id="manager-scenario">
            <Typography variant="h5" gutterBottom sx={{ 
              display: 'flex', alignItems: 'center', 
              gap: 1, color: 'primary.main',
              fontWeight: 'bold',
             }}>
              <BusinessIcon />
              Tình huống 1: Nhà quản lý đầu tư chuyên nghiệp
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Quản lý nhiều khách hàng với các chiến lược đầu tư khác nhau
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                  🎯 Mục tiêu
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Quản lý 50+ khách hàng cá nhân" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Theo dõi hiệu suất từng portfolio" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Chia sẻ báo cáo với khách hàng" />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ color: 'success.main' }}>
                  ✅ Giải pháp
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Tạo tài khoản riêng cho từng khách hàng" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Portfolio theo mục tiêu đầu tư" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Báo cáo tự động hàng ngày" />
                  </ListItem>
                </List>
              </Grid>
            </Grid>

            <Stepper orientation="vertical" sx={{ mt: 2 }}>
              <Step active>
                <StepLabel>Đăng nhập hệ thống</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    Tạo tài khoản quản lý.
                  </Typography>
                </StepContent>
              </Step>
              <Step active>
                <StepLabel>Quản lý khách hàng</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    Tạo Account cho từng khách hàng, thiết lập thông tin cá nhân và mục tiêu đầu tư.
                  </Typography>
                </StepContent>
              </Step>
              <Step active>
                <StepLabel>Xây dựng portfolio</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    Tạo portfolio theo chiến lược (Tăng trưởng, Thu nhập, Cân bằng) cho từng khách hàng.
                  </Typography>
                </StepContent>
              </Step>
              <Step active>
                <StepLabel>Thực hiện giao dịch</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    Thêm giao dịch mua/bán, theo dõi P&L và cập nhật Assets.
                  </Typography>
                </StepContent>
              </Step>
              <Step active>
                <StepLabel>Chia sẻ với khách hàng</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    Cấp quyền VIEW/UPDATE cho khách hàng, gửi Account ID và hướng dẫn truy cập.
                  </Typography>
                </StepContent>
              </Step>
            </Stepper>
          </Paper>

          {/* Use Case 2: Individual Investor */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }} id="investor-scenario">
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', 
              gap: 1, color: 'success.main',
              fontWeight: 'bold',
             }}>
              <PersonIcon />
              Tình huống 2: Nhà đầu tư cá nhân
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Theo dõi danh mục đầu tư cá nhân và nhận tư vấn từ chuyên gia
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ color: 'success.main' }}>
                  🎯 Mục tiêu
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Theo dõi hiệu suất đầu tư" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Nhận tư vấn từ chuyên gia" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Hiểu rõ danh mục của mình" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Đưa ra quyết định đầu tư" />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ color: 'info.main' }}>
                  ✅ Giải pháp
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Đăng ký tài khoản cá nhân" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Nhận Account ID từ quản lý" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Xem portfolio được chia sẻ" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Nhận báo cáo định kỳ" />
                  </ListItem>
                </List>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon />
                Quy trình cho nhà đầu tư
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Typography variant="h6" sx={{ color: 'primary.main' }}>1️⃣</Typography>
                  </ListItemIcon>
                  <ListItemText 
                    primary="Đăng ký tài khoản trên hệ thống" 
                    secondary="Tạo tài khoản cá nhân với thông tin cơ bản"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Typography variant="h6" sx={{ color: 'success.main' }}>2️⃣</Typography>
                  </ListItemIcon>
                  <ListItemText 
                    primary="Nhận Account ID từ nhà quản lý" 
                    secondary="Quản lý sẽ cung cấp Account ID để truy cập"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Typography variant="h6" sx={{ color: 'warning.main' }}>3️⃣</Typography>
                  </ListItemIcon>
                  <ListItemText 
                    primary="Đăng nhập và xem portfolio" 
                    secondary="Truy cập danh mục đầu tư được chia sẻ"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Typography variant="h6" sx={{ color: 'info.main' }}>4️⃣</Typography>
                  </ListItemIcon>
                  <ListItemText 
                    primary="Theo dõi hiệu suất và nhận báo cáo" 
                    secondary="Xem P&L, nhận báo cáo định kỳ từ quản lý"
                  />
                </ListItem>
              </List>
            </Box>
          </Paper>

          {/* Use Case 3: Family Office */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }} id="family-office-scenario">
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', 
              gap: 1, color: 'warning.main',
              fontWeight: 'bold',
             }}>
              <SecurityIcon />
              Tình huống 3: Văn phòng gia đình (Family Office)
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Quản lý tài sản cho gia đình với nhiều thế hệ và mục tiêu khác nhau
            </Typography>

            <Grid container spacing={3} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}>
                <Paper elevation={1} sx={{ p: 2, borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                  <Typography variant="h6" sx={{ color: 'primary.main', mb: 1 }}>
                    👨‍👩‍👧‍👦 Thế hệ 1: Cha mẹ
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Portfolio bảo toàn vốn" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Thu nhập ổn định" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Rủi ro thấp" />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper elevation={1} sx={{ p: 2, borderLeft: '4px solid', borderLeftColor: 'success.main' }}>
                  <Typography variant="h6" sx={{ color: 'success.main', mb: 1 }}>
                    👨‍👩‍👦 Thế hệ 2: Con cái
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Portfolio tăng trưởng" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Đầu tư dài hạn" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Rủi ro trung bình" />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper elevation={1} sx={{ p: 2, borderLeft: '4px solid', borderLeftColor: 'warning.main' }}>
                  <Typography variant="h6" sx={{ color: 'warning.main', mb: 1 }}>
                    👶 Thế hệ 3: Cháu
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Portfolio tăng trưởng mạnh" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Đầu tư công nghệ" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Rủi ro cao" />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
            </Grid>

            <WarningBox>
              <Typography variant="body2">
                <strong>Lưu ý:</strong> Mỗi thế hệ có Account riêng biệt với portfolio phù hợp với mục tiêu và khả năng chịu rủi ro khác nhau.
              </Typography>
            </WarningBox>
          </Paper>

          {/* Use Case 4: Investment Club */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }} id="investment-club-scenario">
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', 
              gap: 1, color: 'info.main',
              fontWeight: 'bold',
             }}>
              <ShareIcon />
              Tình huống 4: Đầu tư chung
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Nhóm bạn cùng đầu tư và chia sẻ kinh nghiệm với nhau
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ color: 'info.main' }}>
                  🎯 Đặc điểm
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Cùng mục tiêu đầu tư" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Chia sẻ thông tin" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Học hỏi lẫn nhau" />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ color: 'secondary.main' }}>
                  ✅ Lợi ích
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Quyết định tập thể" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Chia sẻ rủi ro" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Học hỏi kinh nghiệm" />
                  </ListItem>
                </List>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon />
                Quy trình hoạt động
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Thiết lập ban đầu:</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="1. Chọn người quản lý chính" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="2. Tạo Account cho từng thành viên" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="3. Thiết lập quy tắc đầu tư" />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Hoạt động hàng ngày:</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="4. Thảo luận cơ hội đầu tư" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="5. Biểu quyết quyết định" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="6. Thực hiện giao dịch" />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* Summary */}
          <Box sx={{ 
            p: 3, 
            backgroundColor: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)', 
            borderRadius: 2, 
            border: '2px solid #4caf50',
            textAlign: 'center',
            mt: 3
          }}>
            <Typography variant="h6" sx={{ color: 'success.main', mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              🎯 Tổng kết
            </Typography>
            <Typography variant="body2" color="text.primary">
              Hệ thống linh hoạt phục vụ nhiều loại người dùng từ cá nhân đến tổ chức, 
              với khả năng tùy chỉnh theo nhu cầu cụ thể của từng trường hợp sử dụng.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UseCasesSection;
