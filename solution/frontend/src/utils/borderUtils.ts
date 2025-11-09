import { SxProps, Theme } from '@mui/material/styles';

/**
 * Border utility functions for consistent styling
 */

// Border style presets
export const borderStyles = {
  // Card styles
  card: {
    border: '1px solid #edeaea',
    borderRadius: '32px',
  },
  
  // Section styles
  section: {
    border: '1px solid #e3f2fd',
    borderRadius: '16px',
  },
  
  // Input styles
  input: {
    border: '1px solid #bdbdbd',
    borderRadius: '4px',
  },
  
  // Button styles
  button: {
    border: '1px solid #1976d2',
    borderRadius: '6px',
  },
  
  // Alert styles
  alert: {
    border: '1px solid #ffcdd2',
    borderRadius: '4px',
  },
  
  // Chart styles
  chart: {
    //border: '1px solid #edeaea',
    borderRadius: '24px',
  },
  
  // Table styles
  table: {
    border: '1px solid #edeaea',
    borderRadius: '4px',
  },
  
  // Hover styles
  hover: {
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease-in-out',
    },
  },
} as const;

// Border radius variants
export const borderRadius = {
  xs: '4px',
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
} as const;

// Border width variants
export const borderWidth = {
  thin: '1px',
  normal: '2px',
  thick: '3px',
} as const;

// Border color variants
export const borderColors = {
  light: '#edeaea',
  medium: '#bdbdbd',
  dark: '#757575',
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
} as const;

/**
 * Get border style by name
 */
export const getBorderStyle = (styleName: keyof typeof borderStyles) => {
  return borderStyles[styleName];
};

/**
 * Create custom border style
 */
export const createBorder = (options: {
  width?: keyof typeof borderWidth;
  color?: keyof typeof borderColors;
  radius?: keyof typeof borderRadius;
  style?: 'solid' | 'dashed' | 'dotted';
}) => {
  const width = options.width ? borderWidth[options.width] : borderWidth.thin;
  const color = options.color ? borderColors[options.color] : borderColors.light;
  const radius = options.radius ? borderRadius[options.radius] : borderRadius.sm;
  const style = options.style || 'solid';
  
  return {
    border: `${width} ${style} ${color}`,
    borderRadius: radius,
  };
};

/**
 * Apply border style to sx prop
 */
export const applyBorderStyle = (
  styleName: keyof typeof borderStyles,
  additionalSx?: SxProps<Theme>
): SxProps<Theme> => {
  return {
    ...borderStyles[styleName],
    ...additionalSx,
  };
};

/**
 * Apply hover effects to border style
 */
export const applyBorderHover = (
  styleName: keyof typeof borderStyles,
  additionalSx?: SxProps<Theme>
): SxProps<Theme> => {
  return {
    ...borderStyles[styleName],
    ...borderStyles.hover,
    ...additionalSx,
  };
};

/**
 * Common border combinations for different use cases
 */
export const borderCombinations = {
  // Card with hover effect
  cardHover: applyBorderHover('card'),
  
  // Section with hover effect
  sectionHover: applyBorderHover('section'),
  
  // Chart with hover effect
  chartHover: applyBorderHover('chart'),
  
  // Table with hover effect
  tableHover: applyBorderHover('table'),
  
  // Alert with hover effect
  alertHover: applyBorderHover('alert'),
  
  // Button with hover effect
  buttonHover: applyBorderHover('button'),
} as const;

export default {
  borderStyles,
  borderRadius,
  borderWidth,
  borderColors,
  getBorderStyle,
  createBorder,
  applyBorderStyle,
  applyBorderHover,
  borderCombinations,
};
