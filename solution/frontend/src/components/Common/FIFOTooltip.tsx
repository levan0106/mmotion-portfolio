/**
 * FIFO Tooltip Component
 * Provides detailed explanation of FIFO (First In, First Out) calculation method
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Tooltip,
  IconButton,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  HelpOutline as HelpIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

interface FIFOTooltipProps {
  /**
   * Position of the tooltip
   */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /**
   * Size of the icon button
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Color variant of the icon
   */
  color?: 'primary' | 'secondary' | 'default' | 'inherit';
}

const FIFOTooltip: React.FC<FIFOTooltipProps> = ({
  placement = 'top',
  size = 'small',
  color = 'primary'
}) => {
  const [autoPlacement, setAutoPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const iconRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updatePlacement = () => {
      if (!iconRef.current) return;

      const rect = iconRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Calculate available space
      const spaceAbove = rect.top;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceLeft = rect.left;
      const spaceRight = viewportWidth - rect.right;
      
      // Tooltip content is approximately 400px wide and 300px tall
      const tooltipWidth = 400;
      const tooltipHeight = 300;
      
      // Determine best placement
      if (spaceBelow >= tooltipHeight + 20) {
        setAutoPlacement('bottom');
      } else if (spaceAbove >= tooltipHeight + 20) {
        setAutoPlacement('top');
      } else if (spaceRight >= tooltipWidth + 20) {
        setAutoPlacement('right');
      } else if (spaceLeft >= tooltipWidth + 20) {
        setAutoPlacement('left');
      } else {
        // Fallback to bottom if no space available
        setAutoPlacement('bottom');
      }
    };

    // Initial calculation
    updatePlacement();

    // Update on scroll and resize
    window.addEventListener('scroll', updatePlacement);
    window.addEventListener('resize', updatePlacement);

    return () => {
      window.removeEventListener('scroll', updatePlacement);
      window.removeEventListener('resize', updatePlacement);
    };
  }, []);

  // Use auto placement if placement is 'top' (default), otherwise use provided placement
  const finalPlacement = placement === 'top' ? autoPlacement : placement;
  const fifoExplanation = (
    <Box sx={{ maxWidth: 600, p: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
          FIFO (First In, First Out)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Phương pháp tính lãi/lỗ thực hiện trong giao dịch 👉 "accounting style"
        </Typography>
      </Box>

      {/* Two Column Layout */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        {/* Left Column - Explanation & Example */}
        <Box sx={{ flex: 1 }}>
          {/* Explanation */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="medium" gutterBottom>
              Nguyên tắc hoạt động:
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Khi bán cổ phiếu, hệ thống sẽ tự động khớp với các lệnh mua theo thứ tự thời gian (mua trước, bán trước).
            </Typography>
          </Box>

          {/* Example */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="medium" gutterBottom>
              Ví dụ thực tế:
            </Typography>
            <List dense sx={{ py: 0 }}>
              <ListItem sx={{ px: 0, py: 0.5 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUpIcon color="success" fontSize="small" />
                      <Typography variant="body2">Mua 100 cổ phiếu A @ 50,000 VND (01/01)</Typography>
                    </Box>
                  }
                />
              </ListItem>
              <ListItem sx={{ px: 0, py: 0.5 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUpIcon color="success" fontSize="small" />
                      <Typography variant="body2">Mua 50 cổ phiếu A @ 55,000 VND (15/01)</Typography>
                    </Box>
                  }
                />
              </ListItem>
              <ListItem sx={{ px: 0, py: 0.5 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingDownIcon color="error" fontSize="small" />
                      <Typography variant="body2">Bán 80 cổ phiếu A @ 60,000 VND (20/01)</Typography>
                    </Box>
                  }
                />
              </ListItem>
            </List>
          </Box>
        </Box>

        {/* Right Column - Calculation & Benefits */}
        <Box sx={{ flex: 1 }}>
          {/* Calculation */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="medium" gutterBottom>
              Cách tính FIFO:
            </Typography>
            <List dense sx={{ py: 0 }}>
              <ListItem sx={{ px: 0, py: 0.5 }}>
                <ListItemText
                  primary={
                    <Typography variant="body2">
                      • 80 cổ phiếu bán sẽ được khớp với: 80 cổ phiếu mua đầu tiên @ 50,000 VND
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem sx={{ px: 0, py: 0.5 }}>
                <ListItemText
                  primary={
                    <Typography variant="body2">
                      • Lãi thực hiện = (60,000 - 50,000) × 80 = 800,000 VND
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem sx={{ px: 0, py: 0.5 }}>
                <ListItemText
                  primary={
                    <Typography variant="body2">
                      • Số cổ phiếu còn lại: 70 cổ phiếu (20 từ lần mua đầu + 50 từ lần mua thứ 2)
                    </Typography>
                  }
                />
              </ListItem>
            </List>
          </Box>

          {/* Benefits */}
          <Box>
            <Typography variant="body2" fontWeight="medium" gutterBottom>
              Lợi ích của FIFO:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Chip 
                label="Đơn giản, dễ hiểu" 
                size="small" 
                color="primary" 
                variant="outlined"
                sx={{ alignSelf: 'flex-start' }}
              />
              <Chip 
                label="Tuân thủ chuẩn kế toán" 
                size="small" 
                color="secondary" 
                variant="outlined"
                sx={{ alignSelf: 'flex-start' }}
              />
              <Chip 
                label="Tự động hóa" 
                size="small" 
                color="success" 
                variant="outlined"
                sx={{ alignSelf: 'flex-start' }}
              />
            </Box>
            
            {/* Accounting Style Explanation */}
            <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
              <Typography variant="caption" fontWeight="medium" color="text.secondary" gutterBottom>
                📊 "Accounting Style" nghĩa là:
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                • Tuân thủ chuẩn kế toán quốc tế (IFRS/GAAP)
              </Typography>
              <Typography variant="caption" display="block">
                • Phù hợp với báo cáo tài chính chuyên nghiệp
              </Typography>
              <Typography variant="caption" display="block">
                • Được các tổ chức tài chính công nhận
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Tooltip
      title={fifoExplanation}
      placement={finalPlacement}
      arrow
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 3,
            maxWidth: 'none',
          },
        },
        arrow: {
          sx: {
            color: 'background.paper',
            '&::before': {
              border: '1px solid',
              borderColor: 'divider',
            },
          },
        },
      }}
    >
      <IconButton
        ref={iconRef}
        size={size}
        color={color}
        sx={{
          '&:hover': {
            bgcolor: 'primary.main',
            color: 'white',
          },
        }}
      >
        <HelpIcon />
      </IconButton>
    </Tooltip>
  );
};

export default FIFOTooltip;
