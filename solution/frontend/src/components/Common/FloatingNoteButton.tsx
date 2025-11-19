import React, { useState, useEffect } from 'react';
import {
  Fab,
  Tooltip,
  alpha,
  Zoom,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Notes as NotesIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '../../contexts/AccountContext';
import { useNotifications } from '../../contexts/NotificationContext';
import NotesModal from '../Notes/NotesModal';

interface FloatingNoteButtonProps {
  portfolioId?: string;
}

const FloatingNoteButton: React.FC<FloatingNoteButtonProps> = ({ 
  portfolioId 
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentAccount } = useAccount();
  const { isFullscreenOpen } = useNotifications();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  // Always show tooltip on desktop
  useEffect(() => {
    setTooltipOpen(isDesktop);
  }, [isDesktop]);

  const handleButtonClick = () => {
    if (!currentAccount?.accountId) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }

    // Open notes modal
    setShowNotesModal(true);
  };

  // Don't show the button if user is not authenticated or is investor
  if (!currentAccount?.accountId || currentAccount?.isInvestor) {
    return null;
  }

  // Don't show the button when notifications are in fullscreen mode
  if (isFullscreenOpen) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <Zoom in={true}>
        <Tooltip 
          title={t('notes.floatingButton.tooltip', 'Ghi chú')}
          placement="left"
          arrow
          open={tooltipOpen}
          onOpen={() => setTooltipOpen(true)}
          onClose={() => setTooltipOpen(isDesktop)}
          disableHoverListener={isDesktop}
          disableFocusListener={isDesktop}
          disableTouchListener={isDesktop}
        >
          <Fab
            aria-label={t('notes.floatingButton.ariaLabel', 'Ghi chú')}
            onClick={handleButtonClick}
            sx={{
              position: 'fixed',
              bottom: {xs: 24, md: 88}, // Left for mobile, above FloatingTradingButton for desktop
              right: {xs: 88, md: 28}, // left for mobile, above FloatingTradingButton for desktop
              zIndex: 1300,
              boxShadow: `0 8px 32px ${alpha('#000000', 0.15)}`,
              background: 'transparent',
              color: '#212121',
              border: '1px solid',
              borderColor: 'rgba(0, 0, 0, 0.12)',
              '&:hover': {
                boxShadow: `0 12px 40px ${alpha('#000000', 0.2)}`,
                transform: 'scale(1.05)',
                background: 'rgba(0, 0, 0, 0.05)',
                borderColor: 'rgba(0, 0, 0, 0.2)',
              },
              '&:active': {
                transform: 'scale(0.95)',
                background: 'rgba(0, 0, 0, 0.1)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              width: 48,
              height: 48,
            }}
          >
            <NotesIcon sx={{ fontSize: 28 }} />
          </Fab>
        </Tooltip>
      </Zoom>

      {/* Notes Modal */}
      <NotesModal
        open={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        portfolioId={portfolioId}
      />
    </>
  );
};

export default FloatingNoteButton;

