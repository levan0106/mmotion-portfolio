import React from 'react';
import { Typography, TypographyProps, SxProps, Theme } from '@mui/material';
import { useTypography } from '../../theme/useTypography';

interface ResponsiveTypographyProps extends Omit<TypographyProps, 'sx' | 'variant'> {
  variant?: keyof ReturnType<typeof useTypography>['variants'];
  customVariant?: keyof ReturnType<typeof useTypography>['getFontSize'];
  overrides?: any;
  sx?: SxProps<Theme>;
  ellipsis?: boolean;
  maxLines?: number;
}

/**
 * Responsive Typography component that uses custom typography variants
 */
export const ResponsiveTypography: React.FC<ResponsiveTypographyProps> = ({
  variant = 'body1',
  customVariant,
  overrides = {},
  sx = {},
  ellipsis = false,
  maxLines,
  children,
  ...props
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
  
  return (
    <Typography
      {...props}
      sx={getSx()}
    >
      {children}
    </Typography>
  );
};

export default ResponsiveTypography;
