/**
 * Historical Prices Update Button
 * Button component to trigger historical prices update dialog
 */

import React, { useState } from 'react';
import {
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  History as HistoryIcon,
  Update as UpdateIcon,
  CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';
import HistoricalPricesUpdateDialog from './HistoricalPricesUpdateDialog';

interface HistoricalPricesButtonProps {
  variant?: 'button' | 'icon' | 'text';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  startIcon?: React.ReactNode;
  children?: React.ReactNode;
  onSuccess?: (result: any) => void;
  className?: string;
}

const HistoricalPricesButton: React.FC<HistoricalPricesButtonProps> = ({
  variant = 'button',
  size = 'medium',
  color = 'primary',
  startIcon,
  children,
  onSuccess,
  className
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSuccess = (result: any) => {
    onSuccess?.(result);
    setDialogOpen(false);
  };

  const getDefaultIcon = () => {
    switch (variant) {
      case 'icon':
        return <HistoryIcon />;
      case 'text':
        return <CloudDownloadIcon />;
      default:
        return <UpdateIcon />;
    }
  };

  const getDefaultText = () => {
    switch (variant) {
      case 'icon':
        return 'Cập nhật giá lịch sử';
      case 'text':
        return 'Cập nhật giá lịch sử';
      default:
        return 'Cập nhật giá lịch sử';
    }
  };

  const renderButton = () => {
    const buttonProps = {
      onClick: handleOpenDialog,
      size,
      color,
      className,
      startIcon: startIcon || getDefaultIcon()
    };

    switch (variant) {
      case 'icon':
        return (
          <Tooltip title={getDefaultText()}>
            <IconButton {...buttonProps}>
              {getDefaultIcon()}
            </IconButton>
          </Tooltip>
        );

      case 'text':
        return (
          <Button
            {...buttonProps}
            variant="text"
            sx={{ textTransform: 'none' }}
          >
            {children || getDefaultText()}
          </Button>
        );

      default:
        return (
          <Button
            {...buttonProps}
            variant="contained"
          >
            {children || getDefaultText()}
          </Button>
        );
    }
  };

  return (
    <>
      {renderButton()}
      
      <HistoricalPricesUpdateDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSuccess={handleSuccess}
      />
    </>
  );
};

export default HistoricalPricesButton;
