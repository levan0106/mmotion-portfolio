import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Alert,
  CircularProgress,
  Container,
  Link,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { ResponsiveTypography } from '../components/Common/ResponsiveTypography';
import { ResponsiveButton } from '../components/Common/ResponsiveButton';
import { ContactAdminModal } from '../components/Auth/ContactAdminModal';

export const ForgetPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError(t('forgetPassword.errors.emailRequired'));
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('forgetPassword.errors.invalidEmail'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show contact admin modal
      setContactModalOpen(true);
    } catch (err: any) {
      setError(err.message || t('forgetPassword.errors.submitFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleContactAdmin = () => {
    setContactModalOpen(true);
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box>
        {/* Back to Login Link */}
        <Box mb={3}>
          <Link
            component="button"
            variant="body2"
            onClick={handleBackToLogin}
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'primary.main',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            <ArrowBackIcon sx={{ mr: 1, fontSize: 20 }} />
            {t('forgetPassword.backToLogin')}
          </Link>
        </Box>

        {/* Main Card */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box textAlign="center" mb={4}>
              <SecurityIcon 
                sx={{ 
                  fontSize: 64, 
                  color: 'primary.main', 
                  mb: 2 
                }} 
              />
              <ResponsiveTypography variant="pageHeader" gutterBottom>
                {t('forgetPassword.title')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="pageSubtitle" color="text.secondary">
                {t('forgetPassword.subtitle')}
              </ResponsiveTypography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label={t('forgetPassword.emailLabel')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />

              <ResponsiveButton
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ mb: 3 }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  t('forgetPassword.submitButton')
                )}
              </ResponsiveButton>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Contact Admin Section */}
            <Box textAlign="center">
              <ResponsiveTypography variant="cardSubtitle" color="text.secondary" gutterBottom>
                {t('forgetPassword.contactAdmin.title')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('forgetPassword.contactAdmin.description')}
              </ResponsiveTypography>
              <ResponsiveButton
                variant="outlined"
                onClick={handleContactAdmin}
                startIcon={<EmailIcon />}
              >
                {t('forgetPassword.contactAdmin.button')}
              </ResponsiveButton>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Contact Admin Modal */}
      <ContactAdminModal
        open={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
    </Container>
  );
};

export default ForgetPassword;
