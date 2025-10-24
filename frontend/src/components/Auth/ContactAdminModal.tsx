import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common/ResponsiveButton';

interface ContactAdminModalProps {
  open: boolean;
  onClose: () => void;
}

export const ContactAdminModal: React.FC<ContactAdminModalProps> = ({
  open,
  onClose
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
      
      // Auto close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <ResponsiveTypography variant="cardTitle">
            {t('forgetPassword.contactAdmin.modal.title')}
          </ResponsiveTypography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('forgetPassword.contactAdmin.modal.success')}
          </Alert>
        ) : (
          <>
            <ResponsiveTypography variant="cardTitle" color="warning.main" ellipsis={false}>
              {t('forgetPassword.contactAdmin.modal.description')}
            </ResponsiveTypography>

            <Box my={3}>
              <ResponsiveTypography variant="cardTitle" gutterBottom>
                {t('forgetPassword.contactAdmin.modal.contactInfo')}
              </ResponsiveTypography>
              
              <Box sx={{ mt: 2 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <EmailIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="body2">
                  mmotionsystem@gmail.com
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center" mb={1}>
                  <PhoneIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="body2">
                    +84 xxx xxx xxx
                  </Typography>
                </Box>
                
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* <TextField
              fullWidth
              multiline
              rows={4}
              label={t('forgetPassword.contactAdmin.modal.messageLabel')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('forgetPassword.contactAdmin.modal.messagePlaceholder')}
              disabled={loading}
            /> */}
          </>
        )}
      </DialogContent>

      {!success && (
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <ResponsiveButton onClick={handleClose}>
            {t('forgetPassword.contactAdmin.modal.cancel')}
          </ResponsiveButton>
          <ResponsiveButton
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !message.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <EmailIcon />}
          >
            {loading ? t('forgetPassword.contactAdmin.modal.sending') : t('forgetPassword.contactAdmin.modal.send')}
          </ResponsiveButton>
        </DialogActions>
      )}
    </Dialog>
  );
};
