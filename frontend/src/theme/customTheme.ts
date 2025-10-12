import { createTheme, ThemeOptions } from '@mui/material/styles';

// Extend ThemeOptions to include custom borders
declare module '@mui/material/styles' {
  interface Theme {
    borders: typeof customBorders;
  }
  interface ThemeOptions {
    borders?: typeof customBorders;
  }
}

// Custom border system for consistent styling
const customBorders = {
  // Border radius variants
  radius: {
    xs: '4px',
    sm: '6px', 
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  
  // Border width variants
  width: {
    thin: '1px',
    normal: '2px',
    thick: '3px',
  },
  
  // Border color variants
  colors: {
    light: '#e0e0e0',
    medium: '#bdbdbd',
    dark: '#757575',
    primary: '#1976d2',
    secondary: '#dc004e',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    info: '#0288d1',
  },
  
  // Predefined border styles
  styles: {
    // Card borders
    card: {
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
    },
    
    // Section borders
    section: {
      border: '1px solid #e3f2fd',
      borderRadius: '8px',
    },
    
    // Input borders
    input: {
      border: '1px solid #bdbdbd',
      borderRadius: '4px',
    },
    
    // Button borders
    button: {
      border: '1px solid #1976d2',
      borderRadius: '6px',
    },
    
    // Alert borders
    alert: {
      border: '1px solid #ffcdd2',
      borderRadius: '4px',
    },
    
    // Chart borders
    chart: {
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
    },
    
    // Table borders
    table: {
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
    },
  },
};

// Custom typography variants for responsive design
const customTypography = {
  // Header variants
  header: {
    xs: '1.2rem',    // 19.2px (increased from 16px)
    sm: '1.4rem',    // 22.4px (increased from 18.7px)
    md: '1.6rem',    // 25.6px (increased from 21.3px)
    lg: '1.8rem',    // 28.8px (increased from 24px)
    xl: '2rem',      // 32px (increased from 26.7px)
  },
  
  // Title variants
  title: {
    xs: '0.9rem',    // 14.4px (increased from 11.7px)
    sm: '1rem',      // 16px (increased from 13.3px)
    md: '1.1rem',    // 17.6px (increased from 14.7px)
    lg: '1.2rem',    // 19.2px (increased from 16px)
    xl: '1.3rem',    // 20.8px (increased from 17.3px)
  },
  
  // Subtitle variants
  subtitle: {
    xs: '0.6rem',    // 11.2px (increased from 9.3px)
    sm: '0.7rem',    // 12.8px (increased from 10.7px)
    md: '0.8rem',    // 14.4px (increased from 12px)
    lg: '0.9rem',      // 16px (increased from 13.3px)
    xl: '1.0rem',    // 17.6px (increased from 14.7px)
  },
  
  // Body text variants
  body: {
    xs: '0.875rem',  // 14px (mobile standard minimum)
    sm: '0.9rem',    // 14.4px
    md: '1rem',      // 16px (desktop standard)
    lg: '1.1rem',    // 17.6px
    xl: '1.2rem',    // 19.2px
  },
  
  // Small text variants
  small: {
    xs: '0.75rem',   // 12px (mobile readable minimum)
    sm: '0.8rem',    // 12.8px
    md: '0.875rem',  // 14px
    lg: '0.9rem',    // 14.4px
    xl: '1rem',      // 16px
  },

  // XSmall text variants
  xSmall: {
    xs: '0.625rem',  // 10px (mobile readable minimum)
    sm: '0.65rem',    // 10.4px
    md: '0.7rem',    // 11.2px
    lg: '0.75rem',     // 12px
    xl: '0.8rem',   // 12.8px
  },
  
  // Caption variants
  caption: {
    xs: '0.625rem',  // 10px (mobile readable minimum)
    sm: '0.7rem',    // 11.2px
    md: '0.75rem',   // 12px
    lg: '0.8rem',    // 12.8px
    xl: '0.875rem',  // 14px
  },

  // Chart title variants
  chartTitle: {
    xs: '0.75rem',  // 12px (mobile readable)
    sm: '0.8rem',   // 12.8px
    md: '0.875rem', // 14px
    lg: '0.9rem',   // 14.4px
    xl: '1rem',     // 16px
  },
  
  // Chart subtitle variants
  chartSubtitle: {
    xs: '0.625rem', // 10px (mobile readable)
    sm: '0.7rem',   // 11.2px
    md: '0.75rem',  // 12px
    lg: '0.8rem',   // 12.8px
    xl: '0.875rem', // 14px
  },
  
  // Chart legend variants
  chartLegend: {
    xs: '0.625rem', // 10px (mobile readable)
    sm: '0.7rem',   // 11.2px
    md: '0.75rem',  // 12px
    lg: '0.8rem',   // 12.8px
    xl: '0.875rem', // 14px
  },
  
  // Chart tooltip variants
  chartTooltip: {
    xs: '0.625rem', // 10px (mobile readable)
    sm: '0.7rem',   // 11.2px
    md: '0.75rem',  // 12px
    lg: '0.8rem',   // 12.8px
    xl: '0.875rem', // 14px
  },
  
  // Card title variants
  cardTitle: {
    xs: '0.75rem',  // 12px (mobile readable)
    sm: '0.8rem',   // 12.8px
    md: '0.875rem', // 14px
    lg: '0.9rem',   // 14.4px
    xl: '1rem',     // 16px
  },
  
  // Card value variants
  cardValue: {
    xs: '0.875rem', // 14px (mobile readable)
    sm: '0.9rem',   // 14.4px
    md: '1rem',     // 16px
    lg: '1.1rem',   // 17.6px
    xl: '1.2rem',   // 19.2px
  },

  cardValueLarge: {
    xs: '1rem',     // 16px (mobile readable)
    sm: '1.1rem',   // 17.6px
    md: '1.2rem',   // 19.2px
    lg: '1.3rem',   // 20.8px
    xl: '1.4rem',   // 22.4px
  },

  cardValueMedium: {
    xs: '0.75rem',  // 12px (mobile readable)
    sm: '0.8rem',   // 12.8px
    md: '0.875rem', // 14px
    lg: '0.9rem',   // 14.4px
    xl: '1rem',     // 16px
  },

  cardValueSmall: {
    xs: '0.625rem', // 10px (mobile readable)
    sm: '0.7rem',   // 11.2px
    md: '0.75rem',  // 12px
    lg: '0.8rem',   // 12.8px
    xl: '0.875rem', // 14px
  },

  // Card label variants
  cardLabel: {
    xs: '0.625rem', // 10px (mobile readable)
    sm: '0.7rem',   // 11.2px
    md: '0.75rem',  // 12px
    lg: '0.8rem',   // 12.8px
    xl: '0.875rem', // 14px
  },

  // Label small variants
  labelSmall: {
    xs: '0.625rem', // 10px (mobile readable)
    sm: '0.7rem',   // 11.2px
    md: '0.75rem',  // 12px
    lg: '0.8rem',   // 12.8px
    xl: '0.875rem', // 14px
  },
  
  // Tab variants
  tab: {
    xs: '0.75rem',  // 12px (mobile readable)
    sm: '0.8rem',   // 12.8px
    md: '0.875rem', // 14px
    lg: '0.9rem',   // 14.4px
    xl: '1rem',     // 16px
  },
  
  // Button variants
  button: {
    xs: '0.75rem',  // 12px (mobile readable)
    sm: '0.8rem',   // 12.8px
    md: '0.875rem', // 14px
    lg: '0.9rem',   // 14.4px
    xl: '1rem',     // 16px
  }
};

// Helper function to get responsive font size
export const getResponsiveFontSize = (variant: keyof typeof customTypography) => {
  const sizes = customTypography[variant];
  return {
    xs: sizes.xs,
    sm: sizes.sm,
    md: sizes.md,
    lg: sizes.lg,
    xl: sizes.xl,
  };
};

// Custom theme options
const themeOptions: ThemeOptions = {
  // Add custom border system to theme
  borders: customBorders,
  
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#10b981', // Soft emerald
      light: '#6ee7b7',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    success: {
      main: '#22c55e', // Soft green
      light: '#86efac',
      dark: '#16a34a',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b', // Soft amber
      light: '#fcd34d',
      dark: '#d97706',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444', // Soft red
      light: '#fca5a5',
      dark: '#dc2626',
      contrastText: '#ffffff',
    },
    info: {
      main: '#06b6d4', // Soft cyan
      light: '#67e8f9',
      dark: '#0891b2',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafafa', // Very light gray
      paper: '#ffffff',
    },
    text: {
      primary: 'rgb(56, 63, 75)', // Softer dark gray
      secondary: '#9ca3af', // Lighter gray
    },
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  typography: {
    fontFamily: [
      'Open Sans',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: getResponsiveFontSize('header').md,
      fontWeight: 500,
      lineHeight: 1.2,
      '@media (min-width:0px)': {
        fontSize: getResponsiveFontSize('header').xs,
      },
      '@media (min-width:600px)': {
        fontSize: getResponsiveFontSize('header').sm,
      },
      '@media (min-width:900px)': {
        fontSize: getResponsiveFontSize('header').md,
      },
      '@media (min-width:1200px)': {
        fontSize: getResponsiveFontSize('header').lg,
      },
      '@media (min-width:1536px)': {
        fontSize: getResponsiveFontSize('header').xl,
      },
    },
    
    h2: {
      fontSize: getResponsiveFontSize('title').md,
      fontWeight: 500,
      lineHeight: 1.3,
      '@media (min-width:0px)': {
        fontSize: getResponsiveFontSize('title').xs,
      },
      '@media (min-width:600px)': {
        fontSize: getResponsiveFontSize('title').sm,
      },
      '@media (min-width:900px)': {
        fontSize: getResponsiveFontSize('title').md,
      },
      '@media (min-width:1200px)': {
        fontSize: getResponsiveFontSize('title').lg,
      },
      '@media (min-width:1536px)': {
        fontSize: getResponsiveFontSize('title').xl,
      },
    },
    
    h3: {
      fontSize: getResponsiveFontSize('subtitle').md,
      fontWeight: 500,
      lineHeight: 1.3,
      '@media (min-width:0px)': {
        fontSize: getResponsiveFontSize('subtitle').xs,
      },
      '@media (min-width:600px)': {
        fontSize: getResponsiveFontSize('subtitle').sm,
      },
      '@media (min-width:900px)': {
        fontSize: getResponsiveFontSize('subtitle').md,
      },
      '@media (min-width:1200px)': {
        fontSize: getResponsiveFontSize('subtitle').lg,
      },
      '@media (min-width:1536px)': {
        fontSize: getResponsiveFontSize('subtitle').xl,
      },
    },
    
    h4: {
      fontSize: getResponsiveFontSize('body').md,
      fontWeight: 500,
      lineHeight: 1.4,
      '@media (min-width:0px)': {
        fontSize: getResponsiveFontSize('body').xs,
      },
      '@media (min-width:600px)': {
        fontSize: getResponsiveFontSize('body').sm,
      },
      '@media (min-width:900px)': {
        fontSize: getResponsiveFontSize('body').md,
      },
      '@media (min-width:1200px)': {
        fontSize: getResponsiveFontSize('body').lg,
      },
      '@media (min-width:1536px)': {
        fontSize: getResponsiveFontSize('body').xl,
      },
    },
    
    h5: {
      fontSize: getResponsiveFontSize('small').md,
      fontWeight: 500,
      lineHeight: 1.4,
      '@media (min-width:0px)': {
        fontSize: getResponsiveFontSize('small').xs,
      },
      '@media (min-width:600px)': {
        fontSize: getResponsiveFontSize('small').sm,
      },
      '@media (min-width:900px)': {
        fontSize: getResponsiveFontSize('small').md,
      },
      '@media (min-width:1200px)': {
        fontSize: getResponsiveFontSize('small').lg,
      },
      '@media (min-width:1536px)': {
        fontSize: getResponsiveFontSize('small').xl,
      },
    },
    
    h6: {
      fontSize: getResponsiveFontSize('cardTitle').md,
      fontWeight: 500,
      lineHeight: 1.2,
      '@media (min-width:0px)': {
        fontSize: getResponsiveFontSize('cardTitle').xs,
      },
      '@media (min-width:600px)': {
        fontSize: getResponsiveFontSize('cardTitle').sm,
      },
      '@media (min-width:900px)': {
        fontSize: getResponsiveFontSize('cardTitle').md,
      },
      '@media (min-width:1200px)': {
        fontSize: getResponsiveFontSize('cardTitle').lg,
      },
      '@media (min-width:1536px)': {
        fontSize: getResponsiveFontSize('cardTitle').xl,
      },
    },
    
    body1: {
      fontSize: getResponsiveFontSize('body').md,
      fontWeight: 400,
      lineHeight: 1.5,
      '@media (min-width:0px)': {
        fontSize: getResponsiveFontSize('body').xs,
      },
      '@media (min-width:600px)': {
        fontSize: getResponsiveFontSize('body').sm,
      },
      '@media (min-width:900px)': {
        fontSize: getResponsiveFontSize('body').md,
      },
      '@media (min-width:1200px)': {
        fontSize: getResponsiveFontSize('body').lg,
      },
      '@media (min-width:1536px)': {
        fontSize: getResponsiveFontSize('body').xl,
      },
    },
    
    body2: {
      fontSize: getResponsiveFontSize('small').md,
      fontWeight: 400,
      lineHeight: 1.4,
      '@media (min-width:0px)': {
        fontSize: getResponsiveFontSize('small').xs,
      },
      '@media (min-width:600px)': {
        fontSize: getResponsiveFontSize('small').sm,
      },
      '@media (min-width:900px)': {
        fontSize: getResponsiveFontSize('small').md,
      },
      '@media (min-width:1200px)': {
        fontSize: getResponsiveFontSize('small').lg,
      },
      '@media (min-width:1536px)': {
        fontSize: getResponsiveFontSize('small').xl,
      },
    },
    
    caption: {
      fontSize: getResponsiveFontSize('caption').md,
      fontWeight: 400,
      lineHeight: 1.3,
      '@media (min-width:0px)': {
        fontSize: getResponsiveFontSize('caption').xs,
      },
      '@media (min-width:600px)': {
        fontSize: getResponsiveFontSize('caption').sm,
      },
      '@media (min-width:900px)': {
        fontSize: getResponsiveFontSize('caption').md,
      },
      '@media (min-width:1200px)': {
        fontSize: getResponsiveFontSize('caption').lg,
      },
      '@media (min-width:1536px)': {
        fontSize: getResponsiveFontSize('caption').xl,
      },
    },
  },
  shape: {
    borderRadius: 12, // More modern rounded corners
  },
  shadows: [
    'none',
    '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
    '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
    '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
    '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
    '0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)',
    '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
    '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
    '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
    '0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)',
    '0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)',
    '0px 6px 7px -4px rgba(0,0,0,0.2),0px 11px 15px 1px rgba(0,0,0,0.14),0px 4px 20px 3px rgba(0,0,0,0.12)',
    '0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)',
    '0px 7px 8px -4px rgba(0,0,0,0.2),0px 13px 19px 2px rgba(0,0,0,0.14),0px 5px 24px 4px rgba(0,0,0,0.12)',
    '0px 7px 9px -4px rgba(0,0,0,0.2),0px 14px 21px 2px rgba(0,0,0,0.14),0px 5px 26px 4px rgba(0,0,0,0.12)',
    '0px 8px 9px -5px rgba(0,0,0,0.2),0px 15px 22px 2px rgba(0,0,0,0.14),0px 6px 28px 5px rgba(0,0,0,0.12)',
    '0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)',
    '0px 8px 11px -5px rgba(0,0,0,0.2),0px 17px 26px 2px rgba(0,0,0,0.14),0px 6px 32px 5px rgba(0,0,0,0.12)',
    '0px 9px 11px -5px rgba(0,0,0,0.2),0px 18px 28px 2px rgba(0,0,0,0.14),0px 7px 34px 6px rgba(0,0,0,0.12)',
    '0px 9px 12px -6px rgba(0,0,0,0.2),0px 19px 29px 2px rgba(0,0,0,0.14),0px 7px 36px 6px rgba(0,0,0,0.12)',
    '0px 10px 13px -6px rgba(0,0,0,0.2),0px 20px 31px 3px rgba(0,0,0,0.14),0px 8px 38px 7px rgba(0,0,0,0.12)',
    '0px 10px 13px -6px rgba(0,0,0,0.2),0px 21px 33px 3px rgba(0,0,0,0.14),0px 8px 40px 7px rgba(0,0,0,0.12)',
    '0px 10px 14px -6px rgba(0,0,0,0.2),0px 22px 35px 3px rgba(0,0,0,0.14),0px 8px 42px 7px rgba(0,0,0,0.12)',
    '0px 11px 14px -7px rgba(0,0,0,0.2),0px 23px 36px 3px rgba(0,0,0,0.14),0px 9px 44px 8px rgba(0,0,0,0.12)',
    '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)',
  ],
  
  // Custom component overrides
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: getResponsiveFontSize('button').md,
          fontWeight: 600,
          textTransform: 'none',
          borderRadius: 8,
          '@media (min-width:0px)': {
            fontSize: getResponsiveFontSize('button').xs,
          },
          '@media (min-width:600px)': {
            fontSize: getResponsiveFontSize('button').sm,
          },
          '@media (min-width:900px)': {
            fontSize: getResponsiveFontSize('button').md,
          },
          '@media (min-width:1200px)': {
            fontSize: getResponsiveFontSize('button').lg,
          },
          '@media (min-width:1536px)': {
            fontSize: getResponsiveFontSize('button').xl,
          },
        },
      },
    },
    
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '16px',
          '&:last-child': {
            paddingBottom: '16px',
          },
        },
      },
    },
    
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: getResponsiveFontSize('tab').md,
          fontWeight: 500,
          textTransform: 'none',
          '@media (min-width:0px)': {
            fontSize: getResponsiveFontSize('tab').xs,
          },
          '@media (min-width:600px)': {
            fontSize: getResponsiveFontSize('tab').sm,
          },
          '@media (min-width:900px)': {
            fontSize: getResponsiveFontSize('tab').md,
          },
          '@media (min-width:1200px)': {
            fontSize: getResponsiveFontSize('tab').lg,
          },
          '@media (min-width:1536px)': {
            fontSize: getResponsiveFontSize('tab').xl,
          },
        },
      },
    },
  },
};

// Create and export the theme
export const customTheme = createTheme(themeOptions);

// Export typography variants for direct use
export { customTypography };