import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import {
  AccountBalance as AccountIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as ThemeIcon,
} from '@mui/icons-material';
import { AccountManagement } from '../components/Account';

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

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account settings and preferences
        </Typography>
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
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Account Management
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Manage your accounts, create new accounts, and update account information.
            </Typography>
          </Box>
            <AccountManagement />
        </TabPanel>

        <TabPanel value={value} index={1}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Security Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Manage your security preferences and authentication settings.
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Password"
                  subheader="Change your password"
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Update your password to keep your account secure.
                  </Typography>
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
                  <Typography variant="body2" color="text.secondary">
                    Enable 2FA to protect your account with an additional security layer.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={value} index={2}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Notification Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure how you receive notifications and alerts.
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Email Notifications"
                  subheader="Manage email alerts"
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Choose which email notifications you want to receive.
                  </Typography>
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
                  <Typography variant="body2" color="text.secondary">
                    Control browser push notifications for real-time updates.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={value} index={3}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Appearance Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Customize the look and feel of your application.
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="Theme"
                  subheader="Choose your preferred theme"
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Switch between light and dark themes.
                  </Typography>
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
                  <Typography variant="body2" color="text.secondary">
                    Choose your preferred language for the interface.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Settings;
