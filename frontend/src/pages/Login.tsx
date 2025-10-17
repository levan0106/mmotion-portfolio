import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Container,
  Avatar,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Paper,
} from '@mui/material';
import {
  AccountBalance as AccountIcon,
  Login as LoginIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
  ArrowBack,
} from '@mui/icons-material';
import { ResponsiveButton } from '../components/Common';
import ResponsiveTypography from '../components/Common/ResponsiveTypography';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAccount } from '../contexts/AccountContext';
import { userHistoryService, UserHistory } from '../services/userHistoryService';

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateAuthState } = useAccount();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userState, setUserState] = useState<'UNKNOWN' | 'DEMO' | 'PARTIAL' | 'COMPLETE'>('UNKNOWN');
  const [userHistory, setUserHistory] = useState<UserHistory[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [currentStep, setCurrentStep] = useState<'username' | 'password'>('username');

  // Get redirect URL from query parameters
  const getRedirectUrl = () => {
    const redirect = searchParams.get('redirect');
    return redirect || '/';
  };

  // Load user history on component mount
  useEffect(() => {
    const history = userHistoryService.getUserHistory();
    setUserHistory(history);
  }, []);

  // Simple logic: reset to username step when username changes
  useEffect(() => {
    if (username.length >= 3) {
      setCurrentStep('username');
      setUserState('UNKNOWN');
    }
  }, [username]);

  const handleLogin = async () => {
    if (!username.trim()) {
      setError(t('login.errors.usernameRequired'));
      return;
    }

    // Normalize username: lowercase, trim, and remove all spaces
    const normalizedUsername = username.toLowerCase().trim().replace(/\s+/g, '');

    // Validate username format (letters, numbers, hyphens, and underscores only)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(normalizedUsername)) {
      setError(t('login.errors.usernameFormat'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // If we're in username step, check user status first
      if (currentStep === 'username') {
        const userStatus = await authService.checkUserStatus(normalizedUsername);
        
        if (!userStatus.exists) {
          // User doesn't exist, try to create new user
          const authResponse = await authService.loginOrRegister(normalizedUsername, '');
          authService.saveUserSession(authResponse);
          await updateAuthState();
          navigate('/welcome');
          return;
        }
        
        if (userStatus.requiresPassword) {
          // User exists and needs password, move to password step
          setCurrentStep('password');
          //setError('Please enter your password to continue');
          setLoading(false);
          return;
        } else {
          // User exists but doesn't need password, login directly
          const authResponse = await authService.loginOrRegister(normalizedUsername, '');
          authService.saveUserSession(authResponse);
          await updateAuthState();
          navigate(getRedirectUrl());
          return;
        }
      }
      
      // If we're in password step, try to login with password
      if (currentStep === 'password') {
        if (!password.trim()) {
          setError(t('login.errors.passwordRequired'));
          setLoading(false);
          return;
        }
        
        try {
          const authResponse = await authService.loginOrRegister(normalizedUsername, password);
          
          // Double check: if user requires password but we got here, something is wrong
          if (authResponse.user?.isPasswordSet && !password) {
            setError(t('login.errors.passwordRequired'));
            setLoading(false);
            return;
          }
          
          authService.saveUserSession(authResponse);
          await updateAuthState();
          navigate(getRedirectUrl());
        } catch (passwordError: any) {
          const errorMessage = passwordError.response?.data?.message || passwordError.message || t('login.errors.loginFailed');
          
          if (errorMessage.toLowerCase().includes('password') || errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('unauthorized')) {
            setError(t('login.errors.incorrectPassword'));
            setPassword(''); // Clear password field for retry
          } else {
            setError(errorMessage);
          }
          setLoading(false);
          return;
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || t('login.errors.loginFailed');
      
      // If we're in password step and there's an error, provide more specific feedback
      if (currentStep === 'password') {
        if (errorMessage.toLowerCase().includes('password') || errorMessage.toLowerCase().includes('invalid')) {
          setError(t('login.errors.incorrectPassword'));
          setPassword(''); // Clear password field for retry
        } else {
          setError(errorMessage);
        }
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !loading) {
      event.preventDefault();
      handleLogin();
    }
  };

  const handleBackToUsername = () => {
    setCurrentStep('username');
    setPassword('');
    setError(null);
  };

  const handleQuickLogin = async (user: UserHistory) => {
    setUsername(user.username);
    setPassword('');
    setShowHistory(false);
    setError(null);
    setLoading(true);
    
    // Normalize username: lowercase, trim, and remove all spaces
    const normalizedUsername = user.username.toLowerCase().trim().replace(/\s+/g, '');
    
    try {
      // Check user status first
      const userStatus = await authService.checkUserStatus(normalizedUsername);
      
      if (!userStatus.exists) {
        // User doesn't exist, try to create new user
        const authResponse = await authService.loginOrRegister(normalizedUsername, '');
        authService.saveUserSession(authResponse);
        await updateAuthState();
        navigate('/welcome');
        return;
      }
      
      if (userStatus.requiresPassword) {
        // User exists and needs password, move to password step
        setCurrentStep('password');
        //setError('Please enter your password to continue');
        setLoading(false);
        return;
      } else {
        // User exists but doesn't need password, login directly
        try {
          const authResponse = await authService.loginOrRegister(normalizedUsername, '');
          authService.saveUserSession(authResponse);
          await updateAuthState();
          navigate(getRedirectUrl());
          return;
        } catch (loginError: any) {
          console.error('Quick login error:', loginError);
          const errorMessage = loginError.response?.data?.message || 'Login failed. Please try again.';
          setError(errorMessage);
          setLoading(false);
          return;
        }
      }
    } catch (err: any) {
      console.error('Quick login error:', err);
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      
      // If we're in password step and there's an error, provide more specific feedback
      if (currentStep === 'password') {
        if (errorMessage.toLowerCase().includes('password') || errorMessage.toLowerCase().includes('invalid')) {
          setError('Incorrect password. Please try again.');
          setPassword(''); // Clear password field for retry
        } else {
          setError(errorMessage);
        }
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = (username: string) => {
    userHistoryService.removeUserFromHistory(username);
    const updatedHistory = userHistoryService.getUserHistory();
    setUserHistory(updatedHistory);
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const getFormTitle = () => {
    switch (userState) {
      case 'COMPLETE':
        return t('login.buttons.signIn');
      case 'PARTIAL':
        return t('login.buttons.welcomeBack');
      case 'DEMO':
        return t('login.buttons.continue');
      default:
        return t('login.buttons.enterUsername');
    }
  };

  const getFormDescription = () => {
    switch (userState) {
      case 'COMPLETE':
        return t('login.subtitle.signIn');
      case 'PARTIAL':
        return t('login.subtitle.welcomeBack');
      case 'DEMO':
        return t('login.subtitle.continue');
      default:
        return t('login.subtitle.enterUsername');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  mb: 2,
                  background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                }}
              >
                <AccountIcon sx={{ fontSize: 32, color: 'white' }} />
              </Avatar>
              <ResponsiveTypography variant="pageTitle" gutterBottom>
                {t('login.title')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="pageSubtitle" color="text.secondary">
                {getFormDescription()}
              </ResponsiveTypography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Step 1: Username */}
            {currentStep === 'username' && (
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label={t('login.form.username')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            )}

            {/* Step 2: Password */}
            {currentStep === 'password' && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <IconButton onClick={handleBackToUsername} sx={{ mr: 1 }}>
                    <ArrowBack />
                  </IconButton>
                  <ResponsiveTypography variant="tableCell" color="text.secondary" component="div">
                    {t('login.messages.welcomeBack', { username })}
                  </ResponsiveTypography>
                </Box>
                
                <TextField
                  fullWidth
                  label={t('login.form.password')}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  margin="normal"
                  error={!!error}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText={error ? t('login.form.passwordHelperError') : t('login.form.passwordHelper')}
                />
              </Box>
            )}

            {/* Back to Welcome Button */}
            {/* <ResponsiveButton
              type="button"
              fullWidth
              variant="outlined"
              size="medium"
              onClick={() => navigate('/welcome')}
              icon={<ArrowBack />}
              sx={{
                mb: 2,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: 'primary.light',
                  color: 'primary.dark',
                },
              }}
            >
              {t('login.buttons.backToWelcome')}
            </ResponsiveButton> */}

            <ResponsiveButton
              type="button"
              fullWidth
              variant="contained"
              size="large"
              onClick={handleLogin}
              disabled={(!username.trim() || loading) || (currentStep === 'password' && !password.trim())}
              icon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
              mobileText={loading ? t('login.buttons.signingIn') : (currentStep === 'password' ? t('login.buttons.signIn') : getFormTitle())}
              desktopText={loading ? t('login.buttons.signingIn') : (currentStep === 'password' ? t('login.buttons.signIn') : getFormTitle())}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderRadius: 2,
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                  boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
                },
                '&:disabled': {
                  background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                  color: '#94a3b8',
                  cursor: 'not-allowed',
                  boxShadow: 'none',
                },
              }}
            >
              {loading ? t('login.buttons.signingIn') : (currentStep === 'password' ? t('login.buttons.signIn') : getFormTitle())}
            </ResponsiveButton>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <ResponsiveTypography variant="formHelper" color="text.secondary">
                {currentStep === 'password' 
                  ? t('login.messages.enterPassword')
                  : userState === 'COMPLETE' 
                  ? t('login.messages.userHasPassword')
                  : userState === 'PARTIAL'
                  ? t('login.messages.userIncomplete')
                  : t('login.messages.easyStart')
                }
              </ResponsiveTypography>
            </Box>

            {/* User History Section */}
            {userHistory.length > 0 && currentStep === 'username' && (
              <Box sx={{ mt: 4 }}>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon fontSize="small" />
                    <ResponsiveTypography variant="cardTitle">
                      {t('login.history.title')}
                    </ResponsiveTypography>
                  </Box>
                  <ResponsiveButton
                    size="small"
                    onClick={toggleHistory}
                    mobileText={showHistory ? t('login.buttons.hide') : t('login.buttons.show')}
                    desktopText={`${showHistory ? t('login.buttons.hide') : t('login.buttons.show')} (${userHistory.length})`}
                    sx={{ textTransform: 'none' }}
                  >
                    {showHistory ? t('login.buttons.hide') : t('login.buttons.show')} ({userHistory.length})
                  </ResponsiveButton>
                </Box>

                {showHistory && (
                  <Paper sx={{ maxHeight: 200, overflow: 'auto' }}>
                    <List dense>
                      {userHistory.map((user) => (
                        <ListItem key={user.username} disablePadding>
                          <ListItemButton
                            onClick={() => handleQuickLogin(user)}
                            sx={{ 
                              borderRadius: 1,
                              mb: 0.5,
                              //border: '1px solid',
                              borderColor: 'divider',
                              backgroundColor: 'background.paper',
                              '&:hover': {
                                backgroundColor: 'action.hover',
                                borderColor: 'primary.main',
                                boxShadow: 1,
                              }
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                                {user.avatarText || user.username.charAt(0).toUpperCase()}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                  <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 500 }}>
                                    {user.fullName || user.username}
                                  </ResponsiveTypography>
                                  <ResponsiveTypography 
                                    variant="formHelper" 
                                    color="text.secondary"
                                  >
                                    @{user.username}
                                  </ResponsiveTypography>
                                  {user.isProfileComplete && (
                                    <Chip
                                      label={t('login.history.secure')}
                                      size="small"
                                      color="success"
                                      sx={{ height: 16, fontSize: '0.7rem' }}
                                    />
                                  )}
                                </Box>
                              }
                            />
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveUser(user.username);
                              }}
                              sx={{ 
                                opacity: 0.6,
                                '&:hover': { opacity: 1, color: 'error.main' }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;

