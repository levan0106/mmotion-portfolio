import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  TrendingUp as PerformanceIcon,
  Warning as RiskIcon,
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

const AdvancedFeaturesSection: React.FC = () => {
  const performanceSteps = [
    {
      label: 'Thiết lập benchmark',
      description: 'Chọn chỉ số tham chiếu phù hợp',
      details: 'Ví dụ: VN-Index, VN30, S&P 500, hoặc chỉ số tùy chỉnh'
    },
    {
      label: 'Cấu hình metrics',
      description: 'Thiết lập các chỉ số hiệu suất',
      details: 'ROI, Sharpe Ratio, Maximum Drawdown, Volatility'
    },
    {
      label: 'Phân tích so sánh',
      description: 'So sánh hiệu suất với benchmark',
      details: 'Tracking Error, Alpha, Beta, Information Ratio'
    },
    {
      label: 'Báo cáo chi tiết',
      description: 'Xuất báo cáo phân tích chuyên sâu',
      details: 'Monthly, Quarterly, Annual performance reports'
    }
  ];

  const riskManagementSteps = [
    {
      label: 'Thiết lập giới hạn rủi ro',
      description: 'Định nghĩa các ngưỡng rủi ro',
      details: 'VaR 95%, Maximum Drawdown 10%, Volatility < 20%'
    },
    {
      label: 'Phân tích đa dạng hóa',
      description: 'Kiểm tra mức độ đa dạng hóa',
      details: 'Sector allocation, Geographic distribution, Asset correlation'
    },
    {
      label: 'Stress testing',
      description: 'Mô phỏng các kịch bản rủi ro',
      details: 'Market crash, Interest rate shock, Currency fluctuation'
    },
    {
      label: 'Cảnh báo tự động',
      description: 'Thiết lập hệ thống cảnh báo',
      details: 'Email alerts, Dashboard notifications, Risk threshold breaches'
    }
  ];


  const sharingSteps = [
    {
      label: 'Tạo báo cáo tự động',
      description: 'Thiết lập báo cáo định kỳ',
      details: 'Daily, Weekly, Monthly, Quarterly automated reports'
    },
    {
      label: 'Cấu hình email',
      description: 'Thiết lập gửi email tự động',
      details: 'Recipient lists, Report templates, Delivery schedules'
    },
    {
      label: 'Chia sẻ với khách hàng',
      description: 'Cấp quyền truy cập cho khách hàng',
      details: 'View-only access, Custom dashboards, Client portals'
    },
    {
      label: 'Cập nhật hàng ngày',
      description: 'Đồng bộ dữ liệu liên tục',
      details: 'Live data feeds, Real-time notifications, Instant updates'
    }
  ];

  const performanceMetrics = [
    { metric: 'ROI (Return on Investment)', value: '12.5%', benchmark: '10.2%', status: 'outperform' },
    { metric: 'Sharpe Ratio', value: '1.8', benchmark: '1.2', status: 'outperform' },
    { metric: 'Maximum Drawdown', value: '-8.5%', benchmark: '-12.3%', status: 'outperform' },
    { metric: 'Volatility', value: '15.2%', benchmark: '18.7%', status: 'outperform' },
    { metric: 'Alpha', value: '2.3%', benchmark: '0%', status: 'outperform' },
    { metric: 'Beta', value: '0.85', benchmark: '1.0', status: 'outperform' }
  ];

  return (
    <Box id="advanced-features" sx={{ mb: 6 }}>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <ResponsiveTypography variant="cardTitle" component="h2" gutterBottom>
            Tính năng nâng cao
          </ResponsiveTypography>
          <ResponsiveTypography variant="cardLabel" color="text.secondary" paragraph>
            Các tính năng chuyên sâu để tối ưu hóa quản lý đầu tư
          </ResponsiveTypography>

          <InfoBox>
            <Typography variant="body2">
              Các tính năng này giúp bạn phân tích sâu hơn về hiệu suất đầu tư, quản lý rủi ro hiệu quả và tối ưu hóa danh mục đầu tư.
            </Typography>
          </InfoBox>

          {/* Performance Analysis */}
          <Paper elevation={2} sx={{ p: 2, mb: 2 }} id="performance-analysis">
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PerformanceIcon sx={{ color: 'success.main' }} />
              Phân tích hiệu suất
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Hướng dẫn thiết lập và sử dụng các công cụ phân tích hiệu suất chuyên nghiệp
            </Typography>

            <Stepper orientation="vertical" sx={{ mt: 1, '& .MuiStepContent-root': { pl: 2 } }}>
              {performanceSteps.map((step, index) => (
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

            {/* Performance Metrics Table */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AssessmentIcon />
                Ví dụ metrics hiệu suất
              </Typography>
              <TableContainer component={Paper} elevation={1}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Chỉ số</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Portfolio</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Benchmark</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Trạng thái</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {performanceMetrics.map((metric, index) => (
                      <TableRow key={index} hover>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{metric.metric}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{metric.value}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{metric.benchmark}</TableCell>
                        <TableCell align="center">
                          <Chip 
                            label="Tốt hơn" 
                            color="success" 
                            size="small"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Paper>

          {/* Risk Management */}
          <Paper elevation={2} sx={{ p: 2, mb: 2 }} id="risk-management">
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RiskIcon sx={{ color: 'warning.main' }} />
              Quản lý rủi ro
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Thống quản lý rủi ro toàn diện
            </Typography>

            <Stepper orientation="vertical" sx={{ mt: 1, '& .MuiStepContent-root': { pl: 2 } }}>
              {riskManagementSteps.map((step, index) => (
                <Step key={index} active completed>
                  <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.9rem' } }}>
                    <Typography variant="subtitle1" sx={{ color: 'warning.main', fontWeight: 600 }}>
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
                <strong>Lưu ý:</strong> Hệ thống sẽ tự động cảnh báo khi portfolio vượt quá các ngưỡng rủi ro đã thiết lập. 
                Hãy kiểm tra và điều chỉnh định kỳ.
              </Typography>
            </WarningBox>
          </Paper>


          {/* Sharing and Reports */}
          <Paper elevation={2} sx={{ p: 2, mb: 2 }} id="sharing-reports">
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShareIcon sx={{ color: 'primary.main' }} />
              Chia sẻ và báo cáo
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Hướng dẫn tạo và chia sẻ báo cáo chuyên nghiệp với khách hàng
            </Typography>

            <Stepper orientation="vertical" sx={{ mt: 1, '& .MuiStepContent-root': { pl: 2 } }}>
              {sharingSteps.map((step, index) => (
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

            <Alert severity="info" sx={{ mt: 2 }}>
              <AlertTitle>Báo cáo tự động</AlertTitle>
              Hệ thống có thể tạo báo cáo tự động theo lịch trình và gửi email cho khách hàng. 
              Bạn có thể tùy chỉnh nội dung và định dạng báo cáo theo nhu cầu.
            </Alert>
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
              🚀 Tổng kết tính năng nâng cao
            </Typography>
            <Typography variant="body2" color="text.primary">
              Với 3 nhóm tính năng nâng cao: Phân tích hiệu suất, Quản lý rủi ro, và Chia sẻ báo cáo, 
              bạn có thể quản lý danh mục đầu tư một cách chuyên nghiệp và hiệu quả tối đa.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdvancedFeaturesSection;
