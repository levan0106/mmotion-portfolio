import React from 'react';
import { Box, BoxProps } from '@mui/material';
import { useBorderStyles } from '../../theme/useBorders';

interface BorderBoxProps extends Omit<BoxProps, 'border' | 'borderRadius'> {
  borderStyle?: 'card' | 'section' | 'input' | 'button' | 'alert' | 'chart' | 'table';
  borderSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  borderColor?: 'light' | 'medium' | 'dark' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  borderWidth?: 'thin' | 'normal' | 'thick';
  customBorder?: {
    border?: string;
    borderRadius?: string;
  };
}

/**
 * BorderBox component that applies consistent border styling
 */
export const BorderBox: React.FC<BorderBoxProps> = ({
  borderStyle = 'card',
  borderSize = 'md',
  borderColor = 'light',
  borderWidth = 'thin',
  customBorder,
  sx = {},
  children,
  ...props
}) => {
  const borderStyles = useBorderStyles();
  
  if (!borderStyles) {
    // Fallback to default styling if border system is not available
    return (
      <Box
        sx={{
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          ...sx,
        }}
        {...props}
      >
        {children}
      </Box>
    );
  }
  
  // Use custom border if provided
  if (customBorder) {
    return (
      <Box
        sx={{
          ...customBorder,
          ...sx,
        }}
        {...props}
      >
        {children}
      </Box>
    );
  }
  
  // Use predefined border style
  const borderStyleConfig = borderStyles.getBorderStyle(borderStyle);
  const radius = borderStyles.getRadius(borderSize);
  const color = borderStyles.getColor(borderColor);
  const width = borderStyles.getWidth(borderWidth);
  
  return (
    <Box
      sx={{
        border: `${width} solid ${color}`,
        borderRadius: radius,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default BorderBox;
