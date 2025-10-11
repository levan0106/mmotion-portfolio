import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Container,
  Avatar,
  Divider,
  Chip,
  Collapse,
  Grid,
} from '@mui/material';
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
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { authService, User, UpdateProfileRequest, SetPasswordRequest, ChangePasswordRequest } from '../services/authService';
import { useAccount } from '../contexts/AccountContext';
import { userHistoryService } from '../services/userHistoryService';

export const Profile: React.FC = () => {
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
      setError('Failed to load profile');
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
      setError('Please complete your profile before canceling');
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
      setSuccess('Profile updated successfully');
      
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
      setError(err.response?.data?.message || 'Failed to update profile');
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
      setSuccess('Password set successfully');
      
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
      setError(err.response?.data?.message || 'Failed to set password');
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
      setSuccess('Password changed successfully');
      
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
      
      // Xử lý các loại lỗi khác nhau với thông báo rõ ràng
      let errorMessage = 'Không thể thay đổi mật khẩu. Vui lòng thử lại.';
      
      if (err.response?.status === 401) {
        if (err.response?.data?.message?.includes('Current password is incorrect')) {
          errorMessage = 'Mật khẩu hiện tại không đúng. Vui lòng kiểm tra lại mật khẩu hiện tại.';
        } else if (err.response?.data?.message?.includes('User has no password set')) {
          errorMessage = 'Tài khoản chưa có mật khẩu. Vui lòng đặt mật khẩu trước.';
        } else {
          errorMessage = 'Xác thực thất bại. Vui lòng đăng nhập lại.';
        }
      } else if (err.response?.status === 400) {
        if (err.response?.data?.message?.includes('Password must be at least 6 characters')) {
          errorMessage = 'Mật khẩu mới không hợp lệ. Mật khẩu phải có ít nhất 6 ký tự.';
        } else {
          errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
        }
      } else if (err.response?.status === 404) {
        errorMessage = 'Không tìm thấy tài khoản. Vui lòng đăng nhập lại.';
      } else if (err.response?.data?.message) {
        // Sử dụng thông báo lỗi từ backend và dịch sang tiếng Việt
        const backendMessage = err.response.data.message;
        if (backendMessage.includes('Current password is incorrect')) {
          errorMessage = 'Mật khẩu hiện tại không đúng. Vui lòng kiểm tra lại mật khẩu hiện tại.';
        } else if (backendMessage.includes('User has no password set')) {
          errorMessage = 'Tài khoản chưa có mật khẩu. Vui lòng đặt mật khẩu trước.';
        } else if (backendMessage.includes('Password must be at least 6 characters')) {
          errorMessage = 'Mật khẩu mới không hợp lệ. Mật khẩu phải có ít nhất 6 ký tự.';
        } else if (backendMessage.includes('User not found')) {
          errorMessage = 'Không tìm thấy tài khoản. Vui lòng đăng nhập lại.';
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

  const getAuthStateColor = (state: string) => {
    switch (state) {
      case 'COMPLETE':
        return 'success';
      case 'PARTIAL':
        return 'warning';
      case 'DEMO':
        return 'info';
      default:
        return 'default';
    }
  };

  const getAuthStateText = (state: string) => {
    switch (state) {
      case 'COMPLETE':
        return 'Secure Account';
      case 'PARTIAL':
        return 'Profile Complete';
      case 'DEMO':
        return 'Demo Account';
      default:
        return 'Unknown';
    }
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
        <Alert severity="error">User not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
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
              <Typography variant="h4" component="h1" gutterBottom>
                {user.fullName || user.username}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip
                  label={getAuthStateText(user.authState)}
                  color={getAuthStateColor(user.authState)}
                  size="small"
                />
                {user.isEmailVerified && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Email Verified"
                    color="success"
                    size="small"
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                @{user.username}
              </Typography>
            </Box>
            {!isEditing && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
              >
                Edit Profile
              </Button>
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
              <Typography variant="body2">
                <strong>Complete your profile</strong> - Please fill in your information to access all features. 
                This page is in edit mode to help you get started.
              </Typography>
            </Alert>
          )}

          {/* Basic Information */}
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Basic Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                value={user.username}
                disabled
                helperText="Username cannot be changed"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
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
                label="Email"
                value={isEditing ? formData.email : user.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
                InputProps={{
                  startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                helperText={user.isEmailVerified ? 'Email verified' : 'Email verification required'}
              />
            </Grid>
          </Grid>

          {/* Advanced Information */}
          <Box sx={{ mt: 3 }}>
            <Button
              onClick={() => setShowAdvanced(!showAdvanced)}
              endIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ mb: 2 }}
            >
              Advanced Information
            </Button>
            <Collapse in={showAdvanced}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
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
                    label="Date of Birth"
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
                    label="Address"
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
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={saving || (user && !user.isProfileComplete)}
                startIcon={<CancelIcon />}
              >
                Cancel
              </Button>
            </Box>
          )}

          {/* Security Section */}
          <Divider sx={{ my: 4 }} />
          <Typography variant="h6" gutterBottom>
            Security
          </Typography>

          {!user.isPasswordSet ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Set a password to secure your account
              </Typography>
              {!showPassword ? (
                <Button
                  variant="outlined"
                  startIcon={<LockIcon />}
                  onClick={() => setShowPassword(true)}
                >
                  Set Password
                </Button>
              ) : (
                <Box sx={{ maxWidth: 400 }}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    value={passwordData.password}
                    onChange={(e) => setPasswordData({ password: e.target.value })}
                    helperText="Password must be at least 6 characters (letters, numbers, or special characters)"
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={handleSetPassword}
                      disabled={saving || !passwordData.password}
                      startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    >
                      {saving ? 'Setting...' : 'Set Password'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setShowPassword(false);
                        setPasswordData({ password: '' });
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Password is set. You can change it below.
              </Typography>
              {!showChangePassword ? (
                <Button
                  variant="outlined"
                  startIcon={<LockIcon />}
                  onClick={() => setShowChangePassword(true)}
                >
                  Change Password
                </Button>
              ) : (
                <Box sx={{ maxWidth: 400 }}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type="password"
                    value={changePasswordData.currentPassword}
                    onChange={(e) => setChangePasswordData({ ...changePasswordData, currentPassword: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    value={changePasswordData.newPassword}
                    onChange={(e) => setChangePasswordData({ ...changePasswordData, newPassword: e.target.value })}
                    helperText="Password must be at least 6 characters (letters, numbers, or special characters)"
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={handleChangePassword}
                      disabled={saving || !changePasswordData.currentPassword || !changePasswordData.newPassword}
                      startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    >
                      {saving ? 'Changing...' : 'Change Password'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setShowChangePassword(false);
                        setChangePasswordData({ currentPassword: '', newPassword: '' });
                      }}
                    >
                      Cancel
                    </Button>
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
