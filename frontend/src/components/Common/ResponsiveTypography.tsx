import React from 'react';
import { Typography, TypographyProps } from '@mui/material';
import { useTypography } from '../../theme/useTypography';

interface ResponsiveTypographyProps extends Omit<TypographyProps, 'variant'> {
  variant?: keyof ReturnType<typeof useTypography>['variants'] | TypographyProps['variant'];
  customVariant?: keyof ReturnType<typeof useTypography>['getFontSize'];
  overrides?: any;
  ellipsis?: boolean;
  maxLines?: number;
  desktopOnly?: boolean;
  mobileOnly?: boolean;
}

/**
 * Responsive Typography component that uses custom typography variants
 */
export const ResponsiveTypography: React.FC<ResponsiveTypographyProps> = ({
  variant,
  customVariant,
  overrides = {},
  sx = {},
  ellipsis = true,
  maxLines,
  desktopOnly = false,
  mobileOnly = false,
  children,
  ...restProps
}) => {
  const { variants, getTypographySx } = useTypography();
  
  // Get the appropriate sx prop based on variant type
  const getSx = () => {
    let baseSx = {};
    
    if (customVariant) {
      baseSx = getTypographySx(customVariant, overrides);
    } else if (variant && variants[variant as keyof typeof variants]) {
      baseSx = variants[variant as keyof typeof variants](overrides);
    } else {
      baseSx = overrides;
    }
    
    // Add responsive display logic
    if (desktopOnly) {
      baseSx = {
        ...baseSx,
        display: { xs: 'none', md: 'block' }
      };
    } else if (mobileOnly) {
      baseSx = {
        ...baseSx,
        display: { xs: 'block', md: 'none' }
      };
    }

    // Add ellipsis styles if requested
    if (ellipsis) {
      if (maxLines && maxLines > 1) {
        // Multi-line ellipsis
        baseSx = {
          ...baseSx,
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        };
      } else {
        // Single line ellipsis
        baseSx = {
          ...baseSx,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        };
      }
    }
    
    // Merge with additional sx prop
    return { ...baseSx, ...sx };
  };
  
  // Determine which variant to pass to Typography
  // Only pass Material-UI variants to Typography, not custom variants
  const isCustomVariant = variant && variants[variant as keyof typeof variants];
  const typographyVariant = (customVariant || isCustomVariant) ? 'body2' : 
    (variant as TypographyProps['variant']);
  
  return (
    <Typography
      {...restProps}
      variant={typographyVariant}
      sx={getSx()}
    >
      {children}
    </Typography>
  );
};

export default ResponsiveTypography;
