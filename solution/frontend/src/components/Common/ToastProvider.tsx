import React, { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { CheckCircle as CheckCircleIcon, Warning as WarningIcon, Error as ErrorIcon } from '@mui/icons-material';
import { toastService } from '../../utils/toast';

interface ToastMessage {
  message: string;
  type: 'success' | 'warning' | 'error';
  duration?: number;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    const unsubscribe = toastService.subscribe((newToast) => {
      setToast(newToast);
    });

    return unsubscribe;
  }, []);

  const handleClose = () => {
    setToast(null);
  };

  return (
    <>
      {children}
      {toast && (
        <Snackbar
          open={!!toast}
          autoHideDuration={toast?.duration || 3000}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={handleClose}
            severity={toast.type}
            sx={{ width: '100%' }}
            icon={
              toast.type === 'success' ? <CheckCircleIcon /> :
              toast.type === 'warning' ? <WarningIcon /> :
              <ErrorIcon />
            }
          >
            {toast.message}
          </Alert>
        </Snackbar>
      )}
    </>
  );
};
