/**
 * Floating Menu Button Component
 * Provides easy access to navigation menu on mobile devices
 */

import React from 'react';
import { Fab, useTheme, useMediaQuery } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';

interface FloatingMenuButtonProps {
  onClick: () => void;
  isOpen?: boolean;
}

const FloatingMenuButton: React.FC<FloatingMenuButtonProps> = ({ 
  onClick, 
  isOpen = false 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Only show on mobile devices
  if (!isMobile) {
    return null;
  }

  return (
    <Fab
      color="primary"
      aria-label="open menu"
      onClick={onClick}
      sx={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        zIndex: theme.zIndex.speedDial,
        width: 56,
        height: 56,
         background: 'transparent',
         boxShadow: `0 4px 20px ${theme.palette.primary.light}40`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
         '&:hover': {
           background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
           transform: isOpen ? 'rotate(45deg) scale(1.1)' : 'rotate(0deg) scale(1.1)',
           boxShadow: `0 6px 25px ${theme.palette.primary.main}60`,
         },
        '&:active': {
          transform: isOpen ? 'rotate(45deg) scale(0.95)' : 'rotate(0deg) scale(0.95)',
        },
        // Animation for first appearance
        animation: 'fadeInUp 0.5s ease-out',
        '@keyframes fadeInUp': {
          from: {
            opacity: 0,
            transform: 'translateY(20px)',
          },
          to: {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
        // Pulse animation when drawer is closed
        ...(isOpen ? {} : {
          animation: 'pulse 2s infinite',
           '@keyframes pulse': {
             '0%': {
               boxShadow: `0 4px 20px ${theme.palette.primary.light}40`,
             },
             '50%': {
               boxShadow: `0 4px 20px ${theme.palette.primary.light}60`,
             },
             '100%': {
               boxShadow: `0 4px 20px ${theme.palette.primary.light}40`,
             },
           },
        }),
      }}
    >
       <MenuIcon 
         sx={{ 
           fontSize: 28,
           color: 'gray',
           transition: 'transform 0.3s ease',
           transform: isOpen ? 'rotate(-45deg)' : 'rotate(0deg)',
         }} 
       />
    </Fab>
  );
};

export default FloatingMenuButton;
