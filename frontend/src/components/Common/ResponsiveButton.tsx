import React from 'react';
import { Button, ButtonProps, useMediaQuery, useTheme } from '@mui/material';

interface ResponsiveButtonProps extends Omit<ButtonProps, 'children'> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  mobileText?: string;
  desktopText?: string;
  forceIconOnly?: boolean;
  forceTextOnly?: boolean;
  breakpoint?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  iconSize?: 'small' | 'medium' | 'large';
  responsiveSizing?: boolean;
}

/**
 * ResponsiveButton component that automatically switches between text+icon and icon-only
 * based on screen size for better mobile user experience
 */
export const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  children,
  icon,
  mobileText,
  desktopText,
  forceIconOnly = false,
  forceTextOnly = false,
  breakpoint = 'sm',
  iconSize = 'medium',
  responsiveSizing = true,
  sx = {},
  ...buttonProps
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(breakpoint));
  
  // Determine if we should show icon only
  const shouldShowIconOnly = forceIconOnly || (!forceTextOnly && isMobile);
  
  // Determine the text to display
  const getDisplayText = () => {
    if (forceIconOnly) return null;
    if (forceTextOnly) return children;
    
    if (isMobile && mobileText) return mobileText;
    if (!isMobile && desktopText) return desktopText;
    
    return children;
  };
  
  // Determine the icon to display
  const getDisplayIcon = () => {
    if (!icon) return undefined;
    
    // Clone icon with responsive sizing
    if (React.isValidElement(icon) && responsiveSizing) {
      const iconSizeMap = {
        small: { xs: 16, sm: 18, md: 20 },
        medium: { xs: 18, sm: 20, md: 24 },
        large: { xs: 20, sm: 24, md: 28 }
      };
      
      return React.cloneElement(icon as React.ReactElement<any>, {
        sx: {
          fontSize: iconSizeMap[iconSize],
          ...(icon.props as any).sx
        }
      });
    }
    
    return icon;
  };
  
  // Get responsive button styles
  const getResponsiveStyles = () => {
    const baseStyles = {
      borderRadius: 2,
      textTransform: 'none' as const,
      fontWeight: 500,
      transition: 'all 0.2s ease-in-out',
      ...sx
    };
    
    if (!responsiveSizing) return baseStyles;
    
    // Responsive sizing based on screen size
    const responsiveStyles = {
      // Mobile styles (icon-only or compact)
      ...(isMobile && {
        minWidth: shouldShowIconOnly ? 'auto' : '120px',
        px: shouldShowIconOnly ? 1.5 : 2,
        py: shouldShowIconOnly ? 1.5 : 1,
        fontSize: '0.75rem',
        '& .MuiButton-startIcon': {
          marginRight: shouldShowIconOnly ? 0 : 0.5,
        }
      }),
      
      // Desktop styles
      ...(!isMobile && {
        minWidth: '120px',
        px: 3,
        py: 1,
        fontSize: '0.875rem',
        '& .MuiButton-startIcon': {
          marginRight: 0.5,
        }
      }),
      
      // Hover effects
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
      }
    };
    
    return { ...baseStyles, ...responsiveStyles };
  };
  
  return (
    <Button
      {...buttonProps}
      startIcon={shouldShowIconOnly ? undefined : getDisplayIcon()}
      sx={getResponsiveStyles()}
    >
      {shouldShowIconOnly ? getDisplayIcon() : getDisplayText()}
    </Button>
  );
};

export default ResponsiveButton;
