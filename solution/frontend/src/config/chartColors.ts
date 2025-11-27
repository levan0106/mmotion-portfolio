/**
 * Standard Chart Colors Configuration
 * Provides consistent color scheme across all charts
 */

export interface AssetTypeColors {
  STOCK: string;
  BOND: string;
  GOLD: string;
  CRYPTO: string;
  COMMODITY: string;
  REALESTATE: string;
  CURRENCY: string;
  OTHER: string;
  DEPOSITS: string;
  [key: string]: string; // Allow additional asset types
}

export const CHART_COLORS: AssetTypeColors = {
  STOCK: '#045db4',      // Blue
  BOND: '#059669',       // Emerald
  GOLD: '#ff9800',       // Orange/Yellow
  CRYPTO: '#dc3532',     // Rose
  COMMODITY: '#ff5722',  // Deep Orange
  REALESTATE: '#795548', // Brown
  CURRENCY: '#00BCD4',   // Cyan/Teal
  OTHER: '#9e9e9e',      // Grey
  DEPOSITS: '#5d2fd3',   // Purple
};

// Extended color palette for additional asset types
export const EXTENDED_CHART_COLORS: AssetTypeColors = {
  ...CHART_COLORS,
  CASH: '#607d8b',       // Slate
  REALESTATE: '#795548', // Brown
  COMMODITIES: '#ff5722', // Deep Orange
  FOREX: '#3f51b5',      // Indigo
  OTHER: '#9e9e9e',      // Grey
  ETF: '#3f51b5',      // Indigo
  MUTUAL_FUND: '#9e9e9e',      // Grey
};

/**
 * Get color for specific asset type
 * @param assetType - The asset type (STOCK, BOND, etc.)
 * @returns Color string
 */
export const getAssetTypeColor = (assetType: string): string => {
  const normalizedType = assetType.toUpperCase();
  return CHART_COLORS[normalizedType] || EXTENDED_CHART_COLORS[normalizedType] || '#9e9e9e';
};

/**
 * Get array of colors for multiple asset types
 * @param assetTypes - Array of asset types
 * @returns Array of color strings
 */
export const getAssetTypeColors = (assetTypes: string[]): string[] => {
  return assetTypes.map(getAssetTypeColor);
};

/**
 * Generate color palette for charts
 * @param data - Chart data with asset types
 * @returns Color palette object
 */
export const generateColorPalette = (data: any[]): Record<string, string> => {
  const palette: Record<string, string> = {};
  
  data.forEach((item) => {
    const assetType = item.assetType || item.type || item.name;
    if (assetType && !palette[assetType]) {
      palette[assetType] = getAssetTypeColor(assetType);
    }
  });
  
  return palette;
};

/**
 * Chart.js color configuration
 */
export const CHART_JS_COLORS = {
  backgroundColor: Object.values(CHART_COLORS),
  borderColor: Object.values(CHART_COLORS),
  hoverBackgroundColor: Object.values(CHART_COLORS).map(color => `${color}80`), // 50% opacity
  hoverBorderColor: Object.values(CHART_COLORS),
};

/**
 * Recharts color configuration
 */
export const RECHARTS_COLORS = Object.values(CHART_COLORS);

/**
 * Material-UI theme colors for consistency
 */
export const MUI_THEME_COLORS = {
  primary: CHART_COLORS.STOCK,
  secondary: CHART_COLORS.BOND,
  success: CHART_COLORS.GOLD,
  error: CHART_COLORS.CRYPTO,
  info: CHART_COLORS.DEPOSITS,
};

/**
 * P&L Color Configuration
 * Defines colors for positive and negative P&L values
 */
export interface PnLColors {
  positive: string;
  negative: string;
  positiveLight: string;
  negativeLight: string;
}

export const PNL_COLORS: PnLColors = {
  positive: '#00c49f',      // Green for positive P&L
  negative: '#bf2724',     // Red for negative P&L
  positiveLight: '#E0F2F1', // Light green background
  negativeLight: '#FFE8E8',  // Light red background
};

/**
 * Alternative P&L color schemes
 */
export const PNL_COLOR_SCHEMES = {
  default: {
    positive: '#00c49f',
    negative: '#f15350',
    positiveLight: '#E0F2F1',
    negativeLight: '#FFE8E8',
  },
  blueRed: {
    positive: '#2196f3',
    negative: '#f44336',
    positiveLight: '#E0F2F1',
    negativeLight: '#FFE8E8',
  },
  tealOrange: {
    positive: '#00BCD4',
    negative: '#FF9800',
    positiveLight: '#E8F5E8',
    negativeLight: '#FFF3E0',
  },
  purplePink: {
    positive: '#5d2fd3', // '#9C27B0',
    negative: '#E91E63',
    positiveLight: '#E0F2F1',
    negativeLight: '#FCE4EC',
  },
  greenRed: {
    positive: '#059669', // '#2E7D32',
    negative: '#D32F2F',
    positiveLight: '#E0F2F1',
    negativeLight: '#FFEBEE',
  },
} as const;

export type PnLColorScheme = keyof typeof PNL_COLOR_SCHEMES;

/**
 * Get P&L colors based on scheme
 * @param scheme - Color scheme name
 * @returns P&L color configuration
 */
export const getPnLColors = (scheme: PnLColorScheme = 'default'): PnLColors => {
  return PNL_COLOR_SCHEMES[scheme];
};

/**
 * Get P&L color for a value
 * @param value - P&L value
 * @param scheme - Color scheme
 * @returns Color string
 */
export const getPnLColor = (value: number, scheme: PnLColorScheme = 'default'): string => {
  const colors = getPnLColors(scheme);
  return value >= 0 ? colors.positive : colors.negative;
};

/**
 * Get P&L light color for a value (for backgrounds)
 * @param value - P&L value
 * @param scheme - Color scheme
 * @returns Light color string
 */
export const getPnLLightColor = (value: number, scheme: PnLColorScheme = 'default'): string => {
  const colors = getPnLColors(scheme);
  return value >= 0 ? colors.positiveLight : colors.negativeLight;
};

export default CHART_COLORS;
