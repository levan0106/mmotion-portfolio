/**
 * Data Display Toggle Component
 * Toggle between show full, compact, and mask data modes
 */

import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Visibility as ShowFullIcon,
  VisibilityOff as MaskDataIcon,
  FormatSize as CompactIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { 
  getDataDisplayPreferences, 
  toggleShowFull, 
  toggleMaskData 
} from '../../utils/format';

interface DataDisplayToggleProps {
  size?: 'small' | 'medium' | 'large';
}

const DataDisplayToggle: React.FC<DataDisplayToggleProps> = ({
  size = 'small',
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [preferences] = useState(getDataDisplayPreferences());
  


  const handleToggle = () => {
    if (preferences.maskData) {
      // Currently masked -> turn off mask, go to compact
      toggleMaskData(); // This will set maskData to false
    } else if (preferences.showFull) {
      // Currently show full -> turn off show full, turn on mask
      toggleShowFull(); // This will set showFull to false
      toggleMaskData(); // This will set maskData to true
    } else {
      // Currently compact -> turn on show full
      toggleShowFull(); // This will set showFull to true
    }
    
    // Refresh page to update all components with new preferences
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const getCurrentMode = () => {
    if (preferences.maskData) return 'mask';
    if (preferences.showFull) return 'full';
    return 'compact';
  };

  const getIcon = () => {
    const mode = getCurrentMode();
    switch (mode) {
      case 'mask':
        return <MaskDataIcon />;
      case 'full':
        return <ShowFullIcon />;
      case 'compact':
        return <CompactIcon />;
      default:
        return <CompactIcon />;
    }
  };

  const getTooltip = () => {
    const mode = getCurrentMode();
    switch (mode) {
      case 'mask':
        return t('dataDisplay.toggle.masked');
      case 'full':
        return t('dataDisplay.toggle.full');
      case 'compact':
        return t('dataDisplay.toggle.compact');
      default:
        return t('dataDisplay.toggle.title');
    }
  };

  const getColor = () => {
    const mode = getCurrentMode();
    switch (mode) {
      case 'mask':
        return theme.palette.warning?.main || '#ed6c02';
      case 'full':
        return theme.palette.success?.main || '#2e7d32';
      case 'compact':
        return theme.palette.primary?.main || '#1976d2';
      default:
        return theme.palette.text?.secondary || '#666666';
    }
  };

  return (
    <Tooltip title={getTooltip()} placement="top" arrow>
      <IconButton
        size={size}
        onClick={handleToggle}
        sx={{
          color: getColor(),
          background: alpha(getColor(), 0.1),
          '&:hover': {
            background: alpha(getColor(), 0.2),
            transform: 'scale(1.05)',
            boxShadow: `0 2px 8px ${alpha(getColor(), 0.3)}`,
          },
          transition: 'all 0.2s ease-in-out',
          borderRadius: 2,
          width: size === 'small' ? 36 : size === 'medium' ? 40 : 44,
          height: size === 'small' ? 36 : size === 'medium' ? 40 : 44,
        }}
      >
        {getIcon()}
      </IconButton>
    </Tooltip>
  );
};

export default DataDisplayToggle;
