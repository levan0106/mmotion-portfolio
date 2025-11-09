/**
 * Simple currency format toggle component
 */

import React, { useState, useEffect } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { 
  Visibility as CompactIcon,
  VisibilityOff as FullIcon
} from '@mui/icons-material';

interface CurrencyToggleProps {
  onToggle: (showFull: boolean) => void;
  size?: 'small' | 'medium';
  color?: 'primary' | 'secondary' | 'default';
}

const CurrencyToggle: React.FC<CurrencyToggleProps> = ({
  onToggle,
  size = 'small',
  color = 'default'
}) => {
  const [showFull, setShowFull] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('currency-show-full');
    const isFull = savedState === 'true';
    setShowFull(isFull);
    onToggle(isFull);
  }, [onToggle]);

  const handleToggle = () => {
    const newState = !showFull;
    setShowFull(newState);
    localStorage.setItem('currency-show-full', newState.toString());
    onToggle(newState);
    
    // Reload page to apply changes
    window.location.reload();
  };

  const iconSizes = {
    small: 16,
    medium: 20
  };

  const iconColors = {
    primary: 'primary.main',
    secondary: 'secondary.main',
    default: 'text.secondary'
  };

  return (
    <Tooltip 
      title={showFull ? "Show compact format (1.5tr ₫)" : "Show full format (1,500,000 ₫)"}
      placement="bottom"
      arrow
    >
      <IconButton
        size={size}
        onClick={handleToggle}
        sx={{
          color: iconColors[color],
          mr: { xs: 0, sm: 0.5 },
          ml: { xs: 0.5, sm: 0 },
          '&:hover': {
            color: 'primary.main',
            backgroundColor: 'primary.light',
          },
          transition: 'all 0.2s ease-in-out',
        }}
      >
        {showFull ? (
          <FullIcon sx={{ fontSize: iconSizes[size] }} />
        ) : (
          <CompactIcon sx={{ fontSize: iconSizes[size] }} />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default CurrencyToggle;
