import React, { useState } from 'react';
import { Tooltip } from '@mui/material';
import { ResponsiveButton } from '../Common';
import { History } from '@mui/icons-material';
import { UpdatePriceByDateModal } from './UpdatePriceByDateModal';
import { BulkUpdateResult } from '../../hooks/useAssetPriceBulk';

interface UpdatePriceByDateButtonProps {
  onUpdateSuccess?: (result: BulkUpdateResult) => void;
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  fullWidth?: boolean;
}

export const UpdatePriceByDateButton: React.FC<UpdatePriceByDateButtonProps> = ({
  onUpdateSuccess,
  variant = 'outlined',
  size = 'medium',
  disabled = false,
  fullWidth = false,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleUpdateSuccess = (result: BulkUpdateResult) => {
    if (onUpdateSuccess) {
      onUpdateSuccess(result);
    }
    // Keep modal open to show results
  };

  return (
    <>
      <Tooltip title="Cập nhật giá từ dữ liệu lịch sử theo ngày được chọn">
        <ResponsiveButton
          variant={variant}
          size={size}
          disabled={disabled}
          fullWidth={fullWidth}
          icon={<History />}
          mobileText="Cập nhật giá"
          desktopText="Cập nhật giá theo ngày"
          onClick={handleOpenModal}
        >
          Cập nhật giá theo ngày
        </ResponsiveButton>
      </Tooltip>

      <UpdatePriceByDateModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSuccess={handleUpdateSuccess}
      />
    </>
  );
};
