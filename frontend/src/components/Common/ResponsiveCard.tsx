import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Box,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { ResponsiveCardProps, ResponsiveCardContentProps, ResponsiveCardHeaderProps, ResponsiveCardActionsProps } from './ResponsiveCard.types';
import ResponsiveTypography from './ResponsiveTypography';

/**
 * Responsive Card Component with consistent styling
 * Provides unified card styling across the application
 */
const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  title,
  subtitle,
  icon,
  variant = 'default',
  size = 'small',
  spacing = 'small',
  hoverable = false,
  clickable = false,
  loading = false,
  error = null,
  actions,
  className = '',
  sx = {},
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Size configurations
  const sizeConfig = {
    none: {
      padding: 0,
      marginBottom: 0,
      borderRadius: 0,
    },
    small: {
      padding: isMobile ? 0 : 1,
      marginBottom: 1,
      borderRadius: 1,
    },
    medium: {
      padding: isMobile ? 0.5 : 2,
      marginBottom: 1.5,
      borderRadius: 2,
    },
    large: {
      padding: isMobile ? 1.5 : 3,
      marginBottom: 2,
      borderRadius: 3,
    },
  };

  // Spacing configurations
  const spacingConfig = {
    none: { mb: 0 },
    small: { mb: 1 },
    medium: { mb: 1.5 },
    large: { mb: 2 },
  };

  // Variant configurations
  const variantConfig = {
    default: {
      border: '1px solid',
      borderColor: 'divider',
      boxShadow: 'none',
      bgcolor: 'background.paper',
    },
    transparent: {
      border: 0,
      boxShadow: 0,
      bgcolor: 'transparent',
    },
    outlined: {
      border: '2px solid',
      borderColor: 'primary.main',
      boxShadow: 'none',
      bgcolor: 'background.paper',
    },
    elevated: {
      border: 'none',
      boxShadow: theme.shadows[2],
      bgcolor: 'background.paper',
    },
  };

  const currentSize = sizeConfig[size];
  const currentSpacing = spacingConfig[spacing];
  const currentVariant = variantConfig[variant];

  const cardSx = {
    ...currentSize,
    ...currentSpacing,
    ...currentVariant,
    cursor: clickable ? 'pointer' : 'default',
    transition: hoverable || clickable ? 'all 0.2s ease-in-out' : 'none',
    '&:hover': hoverable || clickable ? {
      boxShadow: variant === 'transparent' ? 'none' : theme.shadows[4],
      transform: clickable ? 'translateY(-2px)' : 'none',
    } : {
        boxShadow: 'none',
        transform: 'none'
    },
    ...sx,
  };

  const handleClick = () => {
    if (clickable && onClick) {
      onClick();
    }
  };

  return (
    <Card
      className={`responsive-card ${className}`}
      sx={cardSx}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {(title || subtitle || icon || actions) && (
        <CardHeader
          title={title ? (
            <Box display="flex" alignItems="center" gap={1}>
              {icon && <Box sx={{ display: 'flex', alignItems: 'center' }}>{icon}</Box>}
              <ResponsiveTypography variant="cardTitle" component="h3">
                {title}
              </ResponsiveTypography>
            </Box>
          ) : undefined}
          subheader={subtitle ? (
            <ResponsiveTypography variant="cardSubtitle" color="text.secondary">
              {subtitle}
            </ResponsiveTypography>
          ) : undefined}
          action={actions}
          sx={{
            p: size === 'none' ? 0 : 1,
            pb: 1,
            '& .MuiCardHeader-content': {
              overflow: 'hidden',
            },
          }}
        />
      )}

      <CardContent sx={{ p: currentSize.padding }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Responsive Card Content Component
 */
export const ResponsiveCardContent: React.FC<ResponsiveCardContentProps> = ({
  children,
  padding = 'none',
  className = '',
  sx = {},
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const paddingConfig = {
    none: 0,
    small: isMobile ? 1 : 1.5,
    medium: isMobile ? 1.5 : 2,
    large: isMobile ? 2 : 3,
  };

  return (
    <CardContent
      className={`responsive-card-content ${className}`}
      sx={{
        p: paddingConfig[padding],
        ...sx,
      }}
    >
      {children}
    </CardContent>
  );
};

/**
 * Responsive Card Header Component
 */
export const ResponsiveCardHeader: React.FC<ResponsiveCardHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  className = '',
  sx = {},
}) => {
  return (
    <CardHeader
      className={`responsive-card-header ${className}`}
      title={title ? (
        <Box display="flex" alignItems="center" gap={1}>
          {icon && <Box sx={{ display: 'flex', alignItems: 'center' }}>{icon}</Box>}
          <ResponsiveTypography variant="cardTitle">
            {title}
          </ResponsiveTypography>
        </Box>
      ) : undefined}
      subheader={subtitle ? (
        <ResponsiveTypography variant="cardSubtitle" color="text.secondary">
          {subtitle}
        </ResponsiveTypography>
      ) : undefined}
      action={actions}
      sx={{
        pb: 1,
        '& .MuiCardHeader-content': {
          overflow: 'hidden',
        },
        ...sx,
      }}
    />
  );
};

/**
 * Responsive Card Actions Component
 */
export const ResponsiveCardActions: React.FC<ResponsiveCardActionsProps> = ({
  children,
  position = 'right',
  spacing = 'small',
  className = '',
  sx = {},
}) => {
  const spacingConfig = {
    none: 0,
    small: 1,
    medium: 1.5,
    large: 2,
  };

  const positionConfig = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  };

  return (
    <CardActions
      className={`responsive-card-actions ${className}`}
      sx={{
        p: spacingConfig[spacing],
        justifyContent: positionConfig[position],
        gap: 1,
        ...sx,
      }}
    >
      {children}
    </CardActions>
  );
};

export default ResponsiveCard;
