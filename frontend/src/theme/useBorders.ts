import { useTheme } from '@mui/material/styles';

interface BorderSystem {
  radius: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  width: {
    thin: string;
    normal: string;
    thick: string;
  };
  colors: {
    light: string;
    medium: string;
    dark: string;
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  styles: {
    card: {
      border: string;
      borderRadius: string;
    };
    section: {
      border: string;
      borderRadius: string;
    };
    input: {
      border: string;
      borderRadius: string;
    };
    button: {
      border: string;
      borderRadius: string;
    };
    alert: {
      border: string;
      borderRadius: string;
    };
    chart: {
      border: string;
      borderRadius: string;
    };
    table: {
      border: string;
      borderRadius: string;
    };
  };
}

/**
 * Hook to access the custom border system
 */
export const useBorders = () => {
  const theme = useTheme();
  
  // Type assertion to access custom borders
  const borders = (theme as any).borders as BorderSystem;
  
  if (!borders) {
    console.warn('Border system not found in theme. Make sure to include customBorders in themeOptions.');
    return null;
  }
  
  return borders;
};

/**
 * Hook to get border styles for common components
 */
export const useBorderStyles = () => {
  const borders = useBorders();
  
  if (!borders) return null;
  
  return {
    // Get border style by name
    getBorderStyle: (styleName: keyof BorderSystem['styles']) => {
      return borders.styles[styleName];
    },
    
    // Get border radius by size
    getRadius: (size: keyof BorderSystem['radius']) => {
      return borders.radius[size];
    },
    
    // Get border width by type
    getWidth: (type: keyof BorderSystem['width']) => {
      return borders.width[type];
    },
    
    // Get border color by name
    getColor: (colorName: keyof BorderSystem['colors']) => {
      return borders.colors[colorName];
    },
    
    // Create custom border style
    createBorder: (options: {
      width?: keyof BorderSystem['width'];
      color?: keyof BorderSystem['colors'];
      radius?: keyof BorderSystem['radius'];
    }) => {
      const width = options.width ? borders.width[options.width] : borders.width.thin;
      const color = options.color ? borders.colors[options.color] : borders.colors.light;
      const radius = options.radius ? borders.radius[options.radius] : borders.radius.sm;
      
      return {
        border: `${width} solid ${color}`,
        borderRadius: radius,
      };
    },
  };
};

export default useBorders;
