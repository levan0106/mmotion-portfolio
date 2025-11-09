import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  keyframes,
} from '@mui/material';
import {
  Info,
  Lightbulb,
  Add,
  GroupAdd,
  Speed,
} from '@mui/icons-material';

// Animation for blinking effect
const blink = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
`;

interface UserGuideItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: string;
}

interface UserGuideProps {
  guideKey: string; // Unique key for each page/guide
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';
  className?: string;
}

// Guide Registry - Tất cả hướng dẫn được lưu trữ ở đây
interface GuideConfig {
  title: string;
  items: UserGuideItem[];
}

const GUIDE_REGISTRY: Record<string, GuideConfig> = {
  'assets': {
    title: 'Hướng dẫn sử dụng Assets',
    items: [
      {
        icon: <Lightbulb fontSize="small" />,
        title: 'Assets là gì?',
        description: 'Assets là các tài sản tài chính trong portfolio của bạn như cổ phiếu, trái phiếu, vàng, crypto...',
        color: 'info.main'
      },
      {
        icon: <Info fontSize="small" />,
        title: 'Theo dõi hiệu suất',
        description: 'Hệ thống tự động tính toán lãi/lỗ, tỷ lệ tăng trưởng và phân tích rủi ro',
        color: 'warning.main'
      },
      {
        icon: <Add fontSize="small" />,
        title: 'Tạo từng asset riêng lẻ',
        description: 'Nhấn \'Add Asset\' để tạo asset mới với thông tin chi tiết (tên, loại, giá, số lượng...)',
        color: 'primary.main'
      },
      {
        icon: <GroupAdd fontSize="small" />,
        title: 'Tạo hàng loạt (Bulk Create)',
        description: 'Nhấn \'Quick Create\' để chọn nhiều assets từ danh sách mẫu có sẵn',
        color: 'secondary.main'
      },
      {
        icon: <Speed fontSize="small" />,
        title: 'Quick Create nhanh hơn',
        description: 'Dành cho người dùng mới - chọn từ danh sách assets phổ biến',
        color: 'success.main'
      }
    ]
  },
  'trading': {
    title: 'Hướng dẫn sử dụng Trading',
    items: [
      {
        icon: <Add fontSize="small" />,
        title: 'Tạo giao dịch mới',
        description: 'Nhấn \'Add Trade\' để ghi lại giao dịch mua/bán',
        color: 'primary.main'
      },
      {
        icon: <Speed fontSize="small" />,
        title: 'Theo dõi hiệu suất',
        description: 'Xem lãi/lỗ và phân tích portfolio của bạn',
        color: 'success.main'
      }
    ]
  },
  'portfolio': {
    title: 'Hướng dẫn sử dụng Portfolio',
    items: [
      {
        icon: <Add fontSize="small" />,
        title: 'Tạo portfolio mới',
        description: 'Nhấn \'Create Portfolio\' để tạo danh mục đầu tư',
        color: 'primary.main'
      },
      {
        icon: <Speed fontSize="small" />,
        title: 'Quản lý danh mục',
        description: 'Theo dõi và quản lý các portfolio của bạn',
        color: 'success.main'
      }
    ]
  }
};

export const UserGuide: React.FC<UserGuideProps> = ({
  guideKey,
  position = 'top-right',
  size = 'medium',
  className
}) => {
  const theme = useTheme();
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Get guide config from registry
  const guideConfig = GUIDE_REGISTRY[guideKey];

  // Get tooltip size configuration
  const getTooltipSize = (size: string) => {
    switch (size) {
      case 'small':
        return { maxWidth: 300, padding: 1.5 };
      case 'medium':
        return { maxWidth: 400, padding: 2 };
      case 'large':
        return { maxWidth: 500, padding: 2.5 };
      case 'xlarge':
        return { maxWidth: 800, padding: 3 };
      case 'xxlarge':
        return { maxWidth: 1000, padding: 3 };
      default:
        return { maxWidth: 400, padding: 2 };
    }
  };

  const tooltipSize = getTooltipSize(size);
  if (!guideConfig) {
    console.warn(`Guide with key "${guideKey}" not found in registry`);
    return null;
  }

  const { title, items } = guideConfig;

  // Check if user has seen this specific guide
  const hasSeenThisGuide = localStorage.getItem(`seen_guide_${guideKey}`) === 'true';
  const [isBlinking, setIsBlinking] = useState(!hasSeenThisGuide);

  // Stop blinking after 10 seconds for new users
  useEffect(() => {
    if (!hasSeenThisGuide) {
      const timer = setTimeout(() => {
        setIsBlinking(false);
      }, 10000); // Stop blinking after 10 seconds

      return () => clearTimeout(timer);
    }
  }, [hasSeenThisGuide]);

  // Handle click to show/hide tooltip
  const handleClick = () => {
    setShowTooltip(!showTooltip);
    setIsBlinking(false);
    
    // Mark this specific guide as seen
    if (!showTooltip) {
      localStorage.setItem(`seen_guide_${guideKey}`, 'true');
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return { justifyContent: 'flex-start' };
      case 'top-right':
        return { justifyContent: 'flex-end' };
      case 'bottom-left':
        return { justifyContent: 'flex-start', mt: 'auto' };
      case 'bottom-right':
        return { justifyContent: 'flex-end', mt: 'auto' };
      default:
        return { justifyContent: 'flex-end' };
    }
  };

  // Create tooltip content
  const tooltipContent = (
    <Box sx={{ maxWidth: tooltipSize.maxWidth, p: tooltipSize.padding }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Lightbulb sx={{ mr: 1, color: 'info.main', fontSize: 20 }} />
        <Box sx={{ color: 'info.main', fontWeight: 600, fontSize: '14px' }}>
          {title}
        </Box>
      </Box>
      
      {items.map((item, index) => (
        <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
          <Box sx={{ 
            color: item.color || 'primary.main', 
            mr: 1.5, 
            mt: 0.5,
            display: 'flex',
            alignItems: 'center'
          }}>
            {item.icon}
          </Box>
          <Box>
            <Box sx={{ 
              fontWeight: 600, 
              color: 'text.primary', 
              fontSize: '13px',
              mb: 0.5
            }}>
              {item.title}
            </Box>
            <Box sx={{ 
              color: 'text.secondary', 
              fontSize: '12px',
              lineHeight: 1.4
            }}>
              {item.description}
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );

  return (
    <Box className={className}>
      <Box sx={{ 
        display: 'flex', 
        ...getPositionStyles()
      }}>
        <Tooltip 
          title={showTooltip ? tooltipContent : ''}
          placement="left"
          arrow
          open={showTooltip}
          onClose={() => setShowTooltip(false)}
          PopperProps={{
            sx: {
              '& .MuiTooltip-tooltip': {
                backgroundColor: 'white',
                color: 'text.primary',
                fontSize: '12px',
                maxWidth: 'none',
                padding: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '1px solid rgba(0,0,0,0.1)'
              },
              '& .MuiTooltip-arrow': {
                color: 'white'
              }
            }
          }}
        >
          <IconButton
            onClick={handleClick}
            sx={{
              backgroundColor: showTooltip 
                ? alpha(theme.palette.info.main, 0.2) 
                : alpha(theme.palette.info.main, 0.1),
              color: 'info.main',
              '&:hover': {
                backgroundColor: alpha(theme.palette.info.main, 0.2),
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease-in-out',
              animation: isBlinking ? `${blink} 1.5s infinite` : 'none',
              boxShadow: isBlinking ? `0 0 20px ${alpha(theme.palette.info.main, 0.5)}` : 'none'
            }}
          >
            <Info />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

// Export guide registry for external access
export { GUIDE_REGISTRY };

// Helper function to add new guides
export const addGuide = (key: string, config: GuideConfig) => {
  GUIDE_REGISTRY[key] = config;
};

// Helper function to check if guide exists
export const hasGuide = (key: string): boolean => {
  return key in GUIDE_REGISTRY;
};

export default UserGuide;
