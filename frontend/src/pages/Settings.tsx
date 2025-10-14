import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import { ResponsiveTypography } from '../components/Common/ResponsiveTypography';
import {
  AccountBalance as AccountIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as ThemeIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { AccountManagement } from '../components/Account';
import { AdminMessageSender } from '../components/Admin/AdminMessageSender';
import { usePermissions } from '../hooks/usePermissions';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const Settings: React.FC = () => {
  const [value, setValue] = useState(0);
  const { hasRole } = usePermissions();
  const isAdmin = hasRole('admin') || hasRole('super_admin');
  
  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <ResponsiveTypography variant="pageTitle" component="h1" gutterBottom>
          Settings
        </ResponsiveTypography>
        <ResponsiveTypography variant="pageSubtitle" color="text.secondary">
          Manage your account settings and preferences
        </ResponsiveTypography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="settings tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              icon={<AccountIcon />}
              label="Account Management"
              iconPosition="start"
              {...a11yProps(0)}
            />
            <Tab
              icon={<SecurityIcon />}
              label="Security"
              iconPosition="start"
              {...a11yProps(1)}
            />
            <Tab
              icon={<NotificationsIcon />}
              label="Notifications"
              iconPosition="start"
              {...a11yProps(2)}
            />
            <Tab
              icon={<ThemeIcon />}
              label="Appearance"
              iconPosition="start"
              {...a11yProps(3)}
            />
            {isAdmin && (
              <Tab
                icon={<AdminIcon />}
                label="Admin Messages"
                iconPosition="start"
                {...a11yProps(4)}
              />
            )}
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <Box sx={{ mb: 3 }}>
            <ResponsiveTypography variant="pageTitle" component="h2" gutterBottom>
              Account Management
            </ResponsiveTypography>
            <ResponsiveTypography variant="pageSubtitle" color="text.secondary" sx={{ mb: 3 }}>
              Manage your accounts, create new accounts, and update account information.
            </ResponsiveTypography>
          </Box>
            <AccountManagement />
        </TabPanel>

        <TabPanel value={value} index={1}>
          <Box sx={{ mb: 3 }}>
            <ResponsiveTypography variant="pageTitle" component="h2" gutterBottom>
              Security Settings
            </ResponsiveTypography>
            <ResponsiveTypography variant="pageSubtitle" color="text.secondary" sx={{ mb: 3 }}>
              Manage your security preferences and authentication settings.
            </ResponsiveTypography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Password"
                  subheader="Change your password"
                />
                <CardContent>
                  <ResponsiveTypography variant="pageSubtitle" color="text.secondary">
                    Update your password to keep your account secure.
                  </ResponsiveTypography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Two-Factor Authentication"
                  subheader="Add an extra layer of security"
                />
                <CardContent>
                  <ResponsiveTypography variant="pageSubtitle" color="text.secondary">
                    Enable 2FA to protect your account with an additional security layer.
                  </ResponsiveTypography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={value} index={2}>
          <Box sx={{ mb: 3 }}>
            <ResponsiveTypography variant="pageTitle" component="h2" gutterBottom>
              Notification Settings
            </ResponsiveTypography>
            <ResponsiveTypography variant="pageSubtitle" color="text.secondary" sx={{ mb: 3 }}>
              Configure how you receive notifications and alerts.
            </ResponsiveTypography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Email Notifications"
                  subheader="Manage email alerts"
                />
                <CardContent>
                  <ResponsiveTypography variant="pageSubtitle" color="text.secondary">
                    Choose which email notifications you want to receive.
                  </ResponsiveTypography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Push Notifications"
                  subheader="Browser notifications"
                />
                <CardContent>
                  <ResponsiveTypography variant="pageSubtitle" color="text.secondary">
                    Control browser push notifications for real-time updates.
                  </ResponsiveTypography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={value} index={3}>
          <Box sx={{ mb: 3 }}>
            <ResponsiveTypography variant="pageTitle" component="h2" gutterBottom>
              Appearance Settings
            </ResponsiveTypography>
            <ResponsiveTypography variant="pageSubtitle" color="text.secondary" sx={{ mb: 3 }}>
              Customize the look and feel of your application.
            </ResponsiveTypography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Theme"
                  subheader="Choose your preferred theme"
                />
                <CardContent>
                  <ResponsiveTypography variant="pageSubtitle" color="text.secondary">
                    Switch between light and dark themes.
                  </ResponsiveTypography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Language"
                  subheader="Select your language"
                />
                <CardContent>
                  <ResponsiveTypography variant="pageSubtitle" color="text.secondary">
                    Choose your preferred language for the interface.
                  </ResponsiveTypography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {isAdmin && (
          <TabPanel value={value} index={4}>
            <AdminMessageSender />
          </TabPanel>
        )}
      </Paper>
    </Box>
  );
};

export default Settings;
