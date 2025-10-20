import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  Container,
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
import { Profile } from './Profile';

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
  const { t } = useTranslation();
  const [value, setValue] = useState(0);
  const { hasRole } = usePermissions();
  const isAdmin = hasRole('admin') || hasRole('super_admin');
  
  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
      <Box>
        <Box sx={{ mb: 4 }}>
          <ResponsiveTypography variant="pageHeader" gutterBottom>
            {t('settings.title')}
          </ResponsiveTypography>
          <ResponsiveTypography variant="pageSubtitle" color="text.secondary">
            {t('settings.subtitle')}
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
              label={t('settings.tabs.accountManagement')}
              iconPosition="start"
              {...a11yProps(0)}
            />
            <Tab
              icon={<SecurityIcon />}
              label={t('settings.tabs.profile')}
              iconPosition="start"
              {...a11yProps(1)}
            />
            <Tab
              icon={<NotificationsIcon />}
              label={t('settings.tabs.notifications')}
              iconPosition="start"
              {...a11yProps(2)}
            />
            <Tab
              icon={<ThemeIcon />}
              label={t('settings.tabs.appearance')}
              iconPosition="start"
              {...a11yProps(3)}
            />
            {isAdmin && (
              <Tab
                icon={<AdminIcon />}
                label={t('settings.tabs.adminMessages')}
                iconPosition="start"
                {...a11yProps(4)}
              />
            )}
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <Box sx={{ m: 0, p: 0 }}>
            <ResponsiveTypography variant="pageTitle" component="h2" gutterBottom>
              {t('accountManagement.title')}
            </ResponsiveTypography>
            <ResponsiveTypography variant="pageSubtitle" color="text.secondary" sx={{ mb: 3 }} desktopOnly>
              {t('accountManagement.subtitle')}
            </ResponsiveTypography>
          </Box>
            <AccountManagement />
        </TabPanel>

        <TabPanel value={value} index={1}>
          <Profile embedded={true} maxWidth="md" />
        </TabPanel>

        <TabPanel value={value} index={2}>
          <Box sx={{ mb: 3 }}> 
            <ResponsiveTypography variant="pageTitle" component="h2" gutterBottom>
              {t('settings.notifications.title')}
            </ResponsiveTypography>
            <ResponsiveTypography variant="pageSubtitle" color="text.secondary" sx={{ mb: 3 }}>
              {t('settings.notifications.subtitle')}
            </ResponsiveTypography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}> 
              <Card sx={{ height: '100%', p: 3 }}>
                <ResponsiveTypography variant="cardTitle" component="h3" gutterBottom>
                  {t('settings.notifications.email.title')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="cardSubtitle" sx={{ mb: 3 ,color:"text.secondary"}}>
                  {t('settings.notifications.email.subtitle')}
                </ResponsiveTypography>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>              
              <Card sx={{ height: '100%', p: 3 }}>
                <ResponsiveTypography variant="cardTitle" component="h3" gutterBottom>
                  {t('settings.notifications.push.title')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="cardSubtitle" sx={{ mb: 3 ,color:"text.secondary"}}>
                  {t('settings.notifications.push.subtitle')}
                </ResponsiveTypography>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={value} index={3}>
          <Box sx={{ mb: 3 }}>
            <ResponsiveTypography variant="pageTitle" component="h2" gutterBottom>
              {t('settings.appearance.title')}
            </ResponsiveTypography>
            <ResponsiveTypography variant="pageSubtitle" color="text.secondary" sx={{ mb: 3 }}>
              {t('settings.appearance.subtitle')}
            </ResponsiveTypography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', p: 3 }}>
                <ResponsiveTypography variant="cardTitle" component="h3" gutterBottom>
                  {t('settings.appearance.theme.title')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="cardSubtitle" sx={{ mb: 3 ,color:"text.secondary"}}>
                  {t('settings.appearance.theme.subtitle')}
                </ResponsiveTypography>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', p: 3 }}>
                <ResponsiveTypography variant="cardTitle" component="h3" gutterBottom>
                  {t('settings.appearance.language.title')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="cardSubtitle" sx={{ mb: 3 ,color:"text.secondary"}}>
                  {t('settings.appearance.language.subtitle')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="cardSubtitle" sx={{ mb: 3 ,color:"text.secondary"}}>
                  {t('settings.appearance.language.description')}
                </ResponsiveTypography>
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
    </Container>
  );
};

export default Settings;
