import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Autocomplete,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common/ResponsiveButton';
import {
  Send as SendIcon,
  People as PeopleIcon,
  Message as MessageIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';

interface User {
  userId: string;
  email: string;
  fullName?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  role?: string; // Optional since API might not include role
}

interface MessageFormData {
  title: string;
  message: string;
  targetUsers: string[];
  targetRole: string;
  sendToAll: boolean;
  actionUrl?: string;
  priority: 'low' | 'normal' | 'high';
}

export const AdminMessageSender: React.FC = () => {
  const { t } = useTranslation();
  const { hasRole } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<MessageFormData>({
    title: '',
    message: '',
    targetUsers: [],
    targetRole: '',
    sendToAll: false,
    actionUrl: '',
    priority: 'normal',
  });

  // Check if user has admin role
  const isAdmin = hasRole('admin') || hasRole('super_admin');

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiService.getUsers();
      
      // Ensure response is an array
      if (Array.isArray(response)) {
        setUsers(response);
      } else if (response && typeof response === 'object' && 'users' in response && Array.isArray((response as any).users)) {
        setUsers((response as any).users);
      } else {
        // Unexpected response format
        setUsers([]);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(t('adminMessage.error.loadUsers') + ': ' + (err.message || t('common.unknownError')));
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof MessageFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSendMessage = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      setError(t('adminMessage.validation.titleAndMessageRequired'));
      return;
    }

    if (!formData.sendToAll && formData.targetUsers.length === 0 && !formData.targetRole) {
      setError(t('adminMessage.validation.selectTarget'));
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const messageData = {
        title: formData.title,
        message: formData.message,
        type: 'system',
        actionUrl: formData.actionUrl || undefined,
        priority: formData.priority,
        targetUsers: formData.sendToAll ? undefined : formData.targetUsers,
        targetRole: formData.sendToAll ? undefined : formData.targetRole,
        sendToAll: formData.sendToAll,
      };

      await apiService.broadcastNotification(messageData);
      
      setSuccess(t('adminMessage.success.sent', { 
        target: formData.sendToAll ? t('adminMessage.allUsers') : t('adminMessage.usersCount', { count: formData.targetUsers.length })
      }));
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        targetUsers: [],
        targetRole: '',
        sendToAll: false,
        actionUrl: '',
        priority: 'normal',
      });
    } catch (err: any) {
      setError(t('adminMessage.error.sendFailed') + ': ' + (err.message || t('common.unknownError')));
    } finally {
      setSending(false);
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return 'error';
      case 'admin':
        return 'warning';
      case 'user':
        return 'primary';
      default:
        return 'default';
    }
  };

  if (!isAdmin) {
    return (
      <Alert severity="error">
        {t('adminMessage.error.noPermission')}
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <ResponsiveTypography variant="pageTitle" component="h2" gutterBottom>
          {t('adminMessage.title')}
        </ResponsiveTypography>
        <ResponsiveTypography variant="pageSubtitle" color="text.secondary">
          {t('adminMessage.subtitle')}
        </ResponsiveTypography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title={t('adminMessage.messageDetails.title')}
              avatar={<MessageIcon />}
            />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label={t('adminMessage.messageDetails.titleLabel')}
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder={t('adminMessage.messageDetails.titlePlaceholder')}
                  required
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label={t('adminMessage.messageDetails.contentLabel')}
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder={t('adminMessage.messageDetails.contentPlaceholder')}
                  required
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label={t('adminMessage.messageDetails.actionUrlLabel')}
                  value={formData.actionUrl}
                  onChange={(e) => handleInputChange('actionUrl', e.target.value)}
                  placeholder={t('adminMessage.messageDetails.actionUrlPlaceholder')}
                  helperText={t('adminMessage.messageDetails.actionUrlHelper')}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>{t('adminMessage.messageDetails.priorityLabel')}</InputLabel>
                  <Select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    label={t('adminMessage.messageDetails.priorityLabel')}
                  >
                    <MenuItem value="low">{t('adminMessage.priority.low')}</MenuItem>
                    <MenuItem value="normal">{t('adminMessage.priority.normal')}</MenuItem>
                    <MenuItem value="high">{t('adminMessage.priority.high')}</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title={t('adminMessage.targetUsers.title')}
              avatar={<PeopleIcon />}
            />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.sendToAll}
                      onChange={(e) => handleInputChange('sendToAll', e.target.checked)}
                    />
                  }
                  label={t('adminMessage.targetUsers.sendToAll')}
                />
              </Box>

              {!formData.sendToAll && (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Autocomplete
                      multiple
                      options={Array.isArray(users) ? users : []}
                      getOptionLabel={(option) => {
                        const name = option.displayName || option.fullName || option.email;
                        return `${name}`;
                      }}
                      value={Array.isArray(users) ? users.filter(user => formData.targetUsers.includes(user.userId)) : []}
                      onChange={(_, selectedUsers) => {
                        handleInputChange('targetUsers', selectedUsers.map(u => u.userId));
                      }}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            {...getTagProps({ index })}
                            key={option.userId}
                            label={option.displayName || option.fullName || option.email}
                            color={getRoleColor(option.role) as any}
                            size="small"
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t('adminMessage.targetUsers.selectUsers')}
                          placeholder={t('adminMessage.targetUsers.searchUsers')}
                        />
                      )}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>{t('adminMessage.targetUsers.selectByRole')}</InputLabel>
                      <Select
                        value={formData.targetRole}
                        onChange={(e) => handleInputChange('targetRole', e.target.value)}
                        label={t('adminMessage.targetUsers.selectByRole')}
                      >
                        <MenuItem value="">{t('adminMessage.targetUsers.selectRole')}</MenuItem>
                        <MenuItem value="user">{t('adminMessage.roles.user')}</MenuItem>
                        <MenuItem value="admin">{t('adminMessage.roles.admin')}</MenuItem>
                        <MenuItem value="super_admin">{t('adminMessage.roles.superAdmin')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              <ResponsiveButton
                fullWidth
                variant="contained"
                icon={<SendIcon />}
                onClick={handleSendMessage}
                disabled={sending || !formData.title.trim() || !formData.message.trim()}
                sx={{ mt: 2 }}
                mobileText={sending ? t('adminMessage.sending') : t('adminMessage.send')}
                desktopText={sending ? t('adminMessage.sending') : t('adminMessage.sendMessage')}
              >
                {sending ? t('adminMessage.sending') : t('adminMessage.sendMessage')}
              </ResponsiveButton>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
