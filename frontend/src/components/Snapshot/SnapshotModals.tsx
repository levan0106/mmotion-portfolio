// SnapshotModals Component for CR-006 Asset Snapshot System
// Centralized modal management for snapshot operations

import React from 'react';
import { BulkSnapshotModal } from './BulkSnapshotModal';
import DeleteSnapshotsModal from './DeleteSnapshotsModal';
import RecalculateConfirmModal from './RecalculateConfirmModal';

interface SnapshotModalsProps {
  // Bulk Create Modal Props
  bulkCreateModalOpen: boolean;
  onBulkCreateModalClose: () => void;
  selectedPortfolioId?: string;
  onBulkCreateSuccess: (portfolioId: string, snapshotDate: string) => void;
  onBulkCreateError: (error: string) => void;
  onPortfolioRefresh: () => void;

  // Delete Modal Props
  deleteModalOpen: boolean;
  onDeleteModalClose: () => void;
  onDeleteSuccess: (deletedCount: number, message: string) => void;
  onDeleteError: (error: string) => void;

  // Recalculate Modal Props
  recalculateConfirmOpen: boolean;
  onRecalculateConfirmClose: () => void;
  onRecalculateConfirm: () => void;
  isRecalculating: boolean;
}

export const SnapshotModals: React.FC<SnapshotModalsProps> = ({
  // Bulk Create Modal
  bulkCreateModalOpen,
  onBulkCreateModalClose,
  selectedPortfolioId,
  onBulkCreateSuccess,
  onBulkCreateError,
  onPortfolioRefresh,

  // Delete Modal
  deleteModalOpen,
  onDeleteModalClose,
  onDeleteSuccess,
  onDeleteError,

  // Recalculate Modal
  recalculateConfirmOpen,
  onRecalculateConfirmClose,
  onRecalculateConfirm,
  isRecalculating,
}) => {
  return (
    <>
      {/* Bulk Create Modal */}
      <BulkSnapshotModal
        open={bulkCreateModalOpen}
        onClose={onBulkCreateModalClose}
        selectedPortfolioId={selectedPortfolioId}
        onSuccess={onBulkCreateSuccess}
        onError={onBulkCreateError}
        onPortfolioRefresh={onPortfolioRefresh}
      />

      {/* Delete Snapshots Modal */}
      <DeleteSnapshotsModal
        open={deleteModalOpen}
        onClose={onDeleteModalClose}
        portfolioId={selectedPortfolioId || ''}
        onSuccess={onDeleteSuccess}
        onError={onDeleteError}
      />

      {/* Recalculate Confirmation Modal */}
      <RecalculateConfirmModal
        open={recalculateConfirmOpen}
        onClose={onRecalculateConfirmClose}
        onConfirm={onRecalculateConfirm}
        isRecalculating={isRecalculating}
      />
    </>
  );
};

export default SnapshotModals;
