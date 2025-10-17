import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Alert,
  CircularProgress,
  Container,
  Avatar,
  Divider,
  Collapse,
  Grid,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ResponsiveButton, ResponsiveTypography } from '../components/Common';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Cake as CakeIcon,
  Home as HomeIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { authService, User, UpdateProfileRequest, SetPasswordRequest, ChangePasswordRequest } from '../services/authService';
import { useAccount } from '../contexts/AccountContext';
import { userHistoryService } from '../services/userHistoryService';

export const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { updateAuthState } = useAccount();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState<UpdateProfileRequest>({});
  const [passwordData, setPasswordData] = useState<SetPasswordRequest>({ password: '' });
  const [changePasswordData, setChangePasswordData] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch fresh user data from API
      const currentUser = await authService.getProfile();
      if (currentUser) {
        setUser(currentUser);
        setFormData({
          fullName: currentUser.fullName || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          dateOfBirth: currentUser.dateOfBirth || '',
          address: currentUser.address || '',
        });
        
        // Auto-enter edit mode if profile is incomplete
        if (!currentUser.isProfileComplete) {
          setIsEditing(true);
        }
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(t('profile.failedToLoadProfile'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    // Don't allow cancel if profile is incomplete
    if (user && !user.isProfileComplete) {
      setError(t('profile.pleaseCompleteProfile'));
      return;
    }
    
    setIsEditing(false);
    setFormData({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth || '',
      address: user?.address || '',
    });
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      
      // Clean form data - remove empty strings and convert dateOfBirth
      const cleanFormData = {
        ...formData,
        // Only include dateOfBirth if it's not empty
        ...(formData.dateOfBirth && formData.dateOfBirth.trim() !== '' 
          ? { dateOfBirth: formData.dateOfBirth } 
          : {}),
        // Remove empty string fields
        fullName: formData.fullName?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        address: formData.address?.trim() || undefined,
      };
      
      // Remove undefined values
      const finalFormData = Object.fromEntries(
        Object.entries(cleanFormData).filter(([_, value]) => value !== undefined)
      );
      
      const updatedUser = await authService.updateProfile(finalFormData);
      setUser(updatedUser);
      setIsEditing(false);
      setSuccess(t('profile.profileUpdatedSuccessfully'));
      
      // Update localStorage with fresh data
      const currentSession = JSON.parse(localStorage.getItem('user_session') || '{}');
      const updatedSession = {
        ...currentSession,
        user: updatedUser
      };
      localStorage.setItem('user_session', JSON.stringify(updatedSession));
      
      // Update user history with new profile data
      userHistoryService.addUserToHistory({
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        avatarText: updatedUser.avatarText,
        isProfileComplete: updatedUser.isProfileComplete,
      });
      
      // Refresh user info in AccountContext
      await updateAuthState();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || t('profile.errors.failedToUpdateProfile'));
    } finally {
      setSaving(false);
    }
  };

  const handleSetPassword = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      
      await authService.setPassword(passwordData.password);
      setShowPassword(false);
      setPasswordData({ password: '' });
      setSuccess(t('profile.passwordSetSuccessfully'));
      
      // Reload user profile and refresh AccountContext
      await loadUserProfile();
      
      // Update localStorage with fresh data
      const updatedUser = await authService.getProfile();
      const currentSession = JSON.parse(localStorage.getItem('user_session') || '{}');
      const updatedSession = {
        ...currentSession,
        user: updatedUser
      };
      localStorage.setItem('user_session', JSON.stringify(updatedSession));
      
      // Update user history with new profile data
      userHistoryService.addUserToHistory({
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        avatarText: updatedUser.avatarText,
        isProfileComplete: updatedUser.isProfileComplete,
      });
      
      await updateAuthState();
    } catch (err: any) {
      console.error('Error setting password:', err);
      setError(err.response?.data?.message || t('profile.errors.failedToSetPassword'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      
      await authService.changePassword(
        changePasswordData.currentPassword,
        changePasswordData.newPassword
      );
      setShowChangePassword(false);
      setChangePasswordData({ currentPassword: '', newPassword: '' });
      setSuccess(t('profile.passwordChangedSuccessfully'));
      
      // Update localStorage with fresh data
      const updatedUser = await authService.getProfile();
      const currentSession = JSON.parse(localStorage.getItem('user_session') || '{}');
      const updatedSession = {
        ...currentSession,
        user: updatedUser
      };
      localStorage.setItem('user_session', JSON.stringify(updatedSession));
      
      // Update user history with new profile data
      userHistoryService.addUserToHistory({
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        avatarText: updatedUser.avatarText,
        isProfileComplete: updatedUser.isProfileComplete,
      });
      
      // Refresh user info in AccountContext
      await updateAuthState();
    } catch (err: any) {
      // console.error('Error changing password:', err);
      // console.error('Error response status:', err.response?.status);
      // console.error('Error response data:', err.response?.data);
      // console.error('Error response message:', err.response?.data?.message);
      
      // Handle different types of errors with clear messages
      let errorMessage = t('profile.errors.cannotChangePassword');
      
      if (err.response?.status === 401) {
        if (err.response?.data?.message?.includes('Current password is incorrect')) {
          errorMessage = t('profile.errors.currentPasswordIncorrect');
        } else if (err.response?.data?.message?.includes('User has no password set')) {
          errorMessage = t('profile.errors.userHasNoPassword');
        } else {
          errorMessage = t('profile.errors.authenticationFailed');
        }
      } else if (err.response?.status === 400) {
        if (err.response?.data?.message?.includes('Password must be at least 6 characters')) {
          errorMessage = t('profile.errors.passwordTooShort');
        } else {
          errorMessage = t('profile.errors.invalidData');
        }
      } else if (err.response?.status === 404) {
        errorMessage = t('profile.errors.userNotFound');
      } else if (err.response?.data?.message) {
        // Use backend error message and translate
        const backendMessage = err.response.data.message;
        if (backendMessage.includes('Current password is incorrect')) {
          errorMessage = t('profile.errors.currentPasswordIncorrect');
        } else if (backendMessage.includes('User has no password set')) {
          errorMessage = t('profile.errors.userHasNoPassword');
        } else if (backendMessage.includes('Password must be at least 6 characters')) {
          errorMessage = t('profile.errors.passwordTooShort');
        } else if (backendMessage.includes('User not found')) {
          errorMessage = t('profile.errors.userNotFound');
        } else {
          errorMessage = backendMessage;
        }
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };


  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{t('profile.userNotFound')}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 3 } }}>
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mr: 3,
                bgcolor: 'primary.main',
                fontSize: '2rem',
              }}
            >
              {user.avatarText || getInitials(user.username)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <ResponsiveTypography variant="h4" component="h1" gutterBottom>
                {user.fullName || user.username}
              </ResponsiveTypography>
              {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip
                  label={getAuthStateText(user.authState)}
                  color={getAuthStateColor(user.authState)}
                  size="small"
                />
                {user.isEmailVerified && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={t('profile.emailVerified')}
                    color="success"
                    size="small"
                  />
                )}
              </Box> */}
              <ResponsiveTypography variant="body2" color="text.secondary">
                @{user.username}
              </ResponsiveTypography>
            </Box>
            {!isEditing && (
              <ResponsiveButton
                variant="outlined"
                icon={<EditIcon />}
                onClick={handleEdit}
                mobileText={t('profile.editProfile')}
                desktopText={t('profile.editProfile')}
              >
                {t('profile.editProfile')}
              </ResponsiveButton>
            )}
          </Box>

          {/* Success/Error Messages */}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          {/* Incomplete Profile Notice */}
          {!user.isProfileComplete && isEditing && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <ResponsiveTypography variant="cardTitle" ellipsis={false}>
                <strong>{t('profile.completeProfileNotice')}</strong> - {t('profile.completeProfileDescription')}
              </ResponsiveTypography>
            </Alert>
          )}

          {/* Basic Information */}
          <ResponsiveTypography variant="cardTitle" gutterBottom sx={{ mt: 3, mb:2 }}>
            {t('profile.basicInformation')}
          </ResponsiveTypography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('profile.username')}
                value={user.username}
                disabled
                helperText={t('profile.usernameHelper')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('profile.fullName')}
                value={isEditing ? formData.fullName : user.fullName || ''}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                disabled={!isEditing}
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('profile.email')}
                value={isEditing ? formData.email : user.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
                InputProps={{
                  startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                //helperText={user.isEmailVerified ? t('profile.emailVerified') : t('profile.emailVerificationRequired')}
              />
            </Grid>
          </Grid>

          {/* Advanced Information */}
          <Box sx={{ mt: 3 }}>
            <ResponsiveButton
              onClick={() => setShowAdvanced(!showAdvanced)}
              icon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              mobileText={t('profile.advancedInformation')}
              desktopText={t('profile.advancedInformation')}
              sx={{ mb: 2 }}
            >
              {t('profile.advancedInformation')}
            </ResponsiveButton>
            <Collapse in={showAdvanced}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('profile.phone')}
                    value={isEditing ? formData.phone : user.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('profile.dateOfBirth')}
                    type="date"
                    value={isEditing ? formData.dateOfBirth : user.dateOfBirth || ''}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <CakeIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('profile.address')}
                    multiline
                    rows={3}
                    value={isEditing ? formData.address : user.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <HomeIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
              </Grid>
            </Collapse>
          </Box>

          {/* Action Buttons */}
          {isEditing && (
            <Box sx={{ display: 'flex', gap: 2, mt: 4, mb: 4 }}>
              <ResponsiveButton
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                icon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                mobileText={saving ? t('profile.saving') : t('profile.saveChanges')}
                desktopText={saving ? t('profile.saving') : t('profile.saveChanges')}
              >
                {saving ? t('profile.saving') : t('profile.saveChanges')}
              </ResponsiveButton>
              <ResponsiveButton
                variant="outlined"
                onClick={handleCancel}
                disabled={saving || (user && !user.isProfileComplete)}
                icon={<CancelIcon />}
                mobileText={t('profile.cancel')}
                desktopText={t('profile.cancel')}
              >
                {t('profile.cancel')}
              </ResponsiveButton>
            </Box>
          )}

          {/* Security Section */}
          <Divider sx={{ my: 4 }} />
          <ResponsiveTypography variant="h6" gutterBottom>
            {t('profile.security')}
          </ResponsiveTypography>

          {!user.isPasswordSet ? (
            <Box>
              <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('profile.setPasswordDescription')}
              </ResponsiveTypography>
              {!showPassword ? (
                <ResponsiveButton
                  variant="outlined"
                  icon={<LockIcon />}
                  onClick={() => setShowPassword(true)}
                  mobileText={t('profile.setPassword')}
                  desktopText={t('profile.setPassword')}
                >
                  {t('profile.setPassword')}
                </ResponsiveButton>
              ) : (
                <Box sx={{ maxWidth: 400 }}>
                  <TextField
                    fullWidth
                    label={t('profile.newPassword')}
                    type="password"
                    value={passwordData.password}
                    onChange={(e) => setPasswordData({ password: e.target.value })}
                    helperText={t('profile.passwordHelper')}
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <ResponsiveButton
                      variant="contained"
                      onClick={handleSetPassword}
                      disabled={saving || !passwordData.password}
                      icon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                      mobileText={saving ? t('profile.setting') : t('profile.setPassword')}
                      desktopText={saving ? t('profile.setting') : t('profile.setPassword')}
                    >
                      {saving ? t('profile.setting') : t('profile.setPassword')}
                    </ResponsiveButton>
                    <ResponsiveButton
                      variant="outlined"
                      onClick={() => {
                        setShowPassword(false);
                        setPasswordData({ password: '' });
                      }}
                      mobileText={t('profile.cancel')}
                      desktopText={t('profile.cancel')}
                    >
                      {t('profile.cancel')}
                    </ResponsiveButton>
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Box>
              <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('profile.changePasswordDescription')}
              </ResponsiveTypography>
              {!showChangePassword ? (
                <ResponsiveButton
                  variant="outlined"
                  icon={<LockIcon />}
                  onClick={() => setShowChangePassword(true)}
                  mobileText={t('profile.changePassword')}
                  desktopText={t('profile.changePassword')}
                >
                  {t('profile.changePassword')}
                </ResponsiveButton>
              ) : (
                <Box sx={{ maxWidth: 400 }}>
                  <TextField
                    fullWidth
                    label={t('profile.currentPassword')}
                    type="password"
                    value={changePasswordData.currentPassword}
                    onChange={(e) => setChangePasswordData({ ...changePasswordData, currentPassword: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label={t('profile.newPassword')}
                    type="password"
                    value={changePasswordData.newPassword}
                    onChange={(e) => setChangePasswordData({ ...changePasswordData, newPassword: e.target.value })}
                    helperText={t('profile.passwordHelper')}
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <ResponsiveButton
                      variant="contained"
                      onClick={handleChangePassword}
                      disabled={saving || !changePasswordData.currentPassword || !changePasswordData.newPassword}
                      icon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                      mobileText={saving ? t('profile.changing') : t('profile.changePassword')}
                      desktopText={saving ? t('profile.changing') : t('profile.changePassword')}
                    >
                      {saving ? t('profile.changing') : t('profile.changePassword')}
                    </ResponsiveButton>
                    <ResponsiveButton
                      variant="outlined"
                      onClick={() => {
                        setShowChangePassword(false);
                        setChangePasswordData({ currentPassword: '', newPassword: '' });
                      }}
                      mobileText={t('profile.cancel')}
                      desktopText={t('profile.cancel')}
                    >
                      {t('profile.cancel')}
                    </ResponsiveButton>
                  </Box>
                </Box>
              )}
            </Box>
          )}

        </CardContent>
      </Card>
    </Container>
  );
};

export default Profile;
