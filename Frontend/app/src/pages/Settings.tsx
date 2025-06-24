import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  FormGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  Slider,
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  ListItemText,
  List,
  ListItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Palette as PaletteIcon,
  AddCircleOutline as AddIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import TenantConfigPanel from '../components/whitelabel/TenantConfigPanel';
import { useAuth } from '../components/auth/AuthContext';
import { useCompanySettings } from '../contexts/CompanySettingsContext';
import SettingsOverrideDisplay from '../components/settings/SettingsOverrideDisplay';
import { useAccessControl } from '../hooks/useAccessControl';
import RoleGuard from '../components/auth/RoleGuard';

// Define interface for integration objects
interface Integration {
  id: number;
  name: string;
  connected: boolean;
}

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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { canPerform } = useAccessControl();
  const { theme, updateTheme } = useTheme();
  const { 
    settings, 
    updateSettings, 
    isCompanyAdmin, 
    applyCompanySettings, 
    resetSettingsSection,
    userOverrides,
    companySettings 
  } = useCompanySettings();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Extract appearance settings
  const [darkMode, setDarkMode] = useState(() => settings.appearance.darkMode);
  const [language, setLanguage] = useState(() => settings.appearance.language);
  const [fontSize, setFontSize] = useState(() => settings.appearance.fontSize);
  
  // Extract notification settings
  const [emailNotifications, setEmailNotifications] = useState(() => settings.notifications.email);
  const [pushNotifications, setPushNotifications] = useState(() => settings.notifications.push);
  const [newOrderNotifications, setNewOrderNotifications] = useState(() => settings.notifications.newOrders);
  const [inventoryAlerts, setInventoryAlerts] = useState(() => settings.notifications.inventory);
  
  // Extract integration settings
  const [apiKey, setApiKey] = useState(() => settings.integrations.apiKey);
  const [integrations, setIntegrations] = useState<Integration[]>(() => 
    settings.integrations.connectedServices || [
      { id: 1, name: 'Warehouse System', connected: true },
      { id: 2, name: 'Accounting Software', connected: false },
      { id: 3, name: 'CRM System', connected: false }
    ]
  );
  
  // Update local state when settings change
  useEffect(() => {
    setDarkMode(settings.appearance.darkMode);
    setLanguage(settings.appearance.language);
    setFontSize(settings.appearance.fontSize);
    setEmailNotifications(settings.notifications.email);
    setPushNotifications(settings.notifications.push);
    setNewOrderNotifications(settings.notifications.newOrders);
    setInventoryAlerts(settings.notifications.inventory);
    setApiKey(settings.integrations.apiKey);
    if (settings.integrations.connectedServices) {
      setIntegrations(settings.integrations.connectedServices);
    }
  }, [settings]);
  
  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  const handleSaveAppSettings = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Determine if we should apply settings company-wide
      const applyToCompany = isCompanyAdmin && document.getElementById('applyCompanyWide')?.getAttribute('data-checked') === 'true';
      
      // Update company settings context
      updateSettings({
        appearance: {
          darkMode,
          language,
          fontSize
        }
      }, applyToCompany);
      
      // Update theme with proper dark mode colors
      if (darkMode) {
        updateTheme({
          backgroundColor: '#121212',
          textColor: '#ffffff'
        });
      } else {
        updateTheme({
          backgroundColor: '#fafafa',
          textColor: '#333333'
        });
      }
      
      // Simulate API call (so users see the loading state)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSuccess(`Application settings saved successfully${applyToCompany ? ' and applied company-wide' : ''}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };
  const handleSaveNotificationSettings = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Determine if we should apply settings company-wide
      const applyToCompany = isCompanyAdmin && document.getElementById('notificationsApplyCompanyWide')?.getAttribute('data-checked') === 'true';
      
      // Update company settings context
      updateSettings({
        notifications: {
          email: emailNotifications,
          push: pushNotifications,
          newOrders: newOrderNotifications,
          inventory: inventoryAlerts
        }
      }, applyToCompany);
      
      // Simulate API call (so users see the loading state)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSuccess(`Notification settings saved successfully${applyToCompany ? ' and applied company-wide' : ''}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };
    const handleGenerateApiKey = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate a random API key for demo purposes
      const newApiKey = `api_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;
      
      // Determine if we should apply settings company-wide
      const applyToCompany = isCompanyAdmin && document.getElementById('integrationsApplyCompanyWide')?.getAttribute('data-checked') === 'true';
      
      // Update company settings context
      updateSettings({
        integrations: {
          ...settings.integrations, // Spread existing integrations to keep all properties
          apiKey: newApiKey
        }
      }, applyToCompany);
      
      // Update local state
      setApiKey(newApiKey);
      
      setSuccess(`New API key generated successfully${applyToCompany ? ' and applied company-wide' : ''}`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate API key');
    } finally {
      setLoading(false);
    }
  };
    const handleConnectIntegration = async (integrationId: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Update local state
      const updatedIntegrations = integrations.map(integration =>
        integration.id === integrationId
          ? { ...integration, connected: !integration.connected }
          : integration
      );
      
      // Determine if we should apply settings company-wide
      const applyToCompany = isCompanyAdmin && document.getElementById('integrationsApplyCompanyWide')?.getAttribute('data-checked') === 'true';
      
      // Update company settings context
      updateSettings({
        integrations: {
          ...settings.integrations, // Spread existing integrations to keep all properties
          connectedServices: updatedIntegrations
        }
      }, applyToCompany);
      
      // Update local state
      setIntegrations(updatedIntegrations);
      
      setSuccess(`Integration updated successfully${applyToCompany ? ' and applied company-wide' : ''}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update integration');
    } finally {
      setLoading(false);
    }
  };

  // Apply font size changes immediately
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    return () => {
      // Reset font size when component unmounts
      document.documentElement.style.fontSize = ''; 
    };
  }, [fontSize]);
  
  // Apply dark mode immediately for better visual feedback
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      // Apply immediate theme changes for dark mode
      updateTheme({
        backgroundColor: '#121212',
        textColor: '#ffffff'
      });
    } else {
      document.body.classList.remove('dark-mode');
      // Apply immediate theme changes for light mode
      updateTheme({
        backgroundColor: '#fafafa',
        textColor: '#333333'
      });
    }
  }, [darkMode]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Settings
          </Typography>
          
          {isCompanyAdmin ? (
            <Typography variant="subtitle1" color="primary">
              Company Admin
            </Typography>
          ) : (
            <Button 
              variant="outlined" 
              size="small"
              onClick={applyCompanySettings}
              startIcon={<PaletteIcon />}
            >
              Use Company Defaults
            </Button>
          )}
        </Box>
        
        {/* Display customized settings */}
        {!isCompanyAdmin && Object.keys(userOverrides).length > 0 && (
          <SettingsOverrideDisplay 
            companySettings={companySettings}
            userSettings={userOverrides}
            onResetToCompany={resetSettingsSection}
          />
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
            <Tab icon={<PaletteIcon />} iconPosition="start" label="Appearance" />
            <Tab icon={<NotificationsIcon />} iconPosition="start" label="Notifications" />
            <Tab icon={<StorageIcon />} iconPosition="start" label="Integrations" />
            <Tab icon={<SecurityIcon />} iconPosition="start" label="Privacy & Data" />
          </Tabs>
        </Box>
        
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ maxWidth: 800 }}>
            <Typography variant="h6" gutterBottom>
              Theme Settings
            </Typography>
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {darkMode ? <DarkModeIcon sx={{ mr: 1 }} /> : <LightModeIcon sx={{ mr: 1 }} />}
                    {darkMode ? 'Dark Mode' : 'Light Mode'}
                  </Box>
                }
              />
            </FormGroup>
            
            <Typography id="font-size-slider" gutterBottom>
              Font Size
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Slider
                  value={fontSize}
                  min={12}
                  max={24}
                  step={1}
                  onChange={(e: Event, newValue: number | number[]) => setFontSize(newValue as number)}
                  aria-labelledby="font-size-slider"
                />
              </Box>
              <Box>
                <Typography>{fontSize}px</Typography>
              </Box>
            </Box>
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="language-select-label">Language</InputLabel>
              <Select
                labelId="language-select-label"
                value={language}
                label="Language"
                onChange={(e) => setLanguage(e.target.value as string)}
                startAdornment={<LanguageIcon sx={{ mr: 1, ml: -0.5 }} />}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="vi">Vietnamese</MenuItem>
                <MenuItem value="ja">Japanese</MenuItem>
                <MenuItem value="ko">Korean</MenuItem>
                <MenuItem value="zh">Chinese</MenuItem>
              </Select>
            </FormControl>
            
            {isCompanyAdmin && (
              <FormControlLabel
                control={
                  <Switch
                    id="applyCompanyWide"
                    onChange={(e) => e.target.setAttribute('data-checked', e.target.checked.toString())}
                  />
                }
                label="Apply to all company users"
                sx={{ mt: 2, display: 'block' }}
              />
            )}
            
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 3 }}
              onClick={handleSaveAppSettings}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Save Appearance Settings
            </Button>
            
            <Divider sx={{ my: 4 }} />
            
            {user?.role === 'admin' && (
              <>
                <Typography variant="h6" gutterBottom>
                  White Label Settings
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  Customize your company's branding and appearance. These settings apply to all users in your organization.
                </Typography>
                
                <TenantConfigPanel tenantId={user.companyId} />
              </>
            )}
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ maxWidth: 800 }}>
            <Typography variant="h6" gutterBottom>
              Notification Preferences
            </Typography>
            <FormGroup>
              <Typography variant="subtitle1" sx={{ mt: 3 }}>
                Channels
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={pushNotifications}
                    onChange={(e) => setPushNotifications(e.target.checked)}
                  />
                }
                label="Push Notifications"
              />
            </FormGroup>
            <FormGroup>
              <Typography variant="subtitle1" sx={{ mt: 3 }}>
                Events
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={newOrderNotifications}
                    onChange={(e) => setNewOrderNotifications(e.target.checked)}
                  />
                }
                label="New Orders"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={inventoryAlerts}
                    onChange={(e) => setInventoryAlerts(e.target.checked)}
                  />
                }
                label="Low Inventory Alerts"
              />
            </FormGroup>
            
            {isCompanyAdmin && (
              <FormControlLabel
                control={
                  <Switch
                    id="notificationsApplyCompanyWide"
                    onChange={(e) => e.target.setAttribute('data-checked', e.target.checked.toString())}
                  />
                }
                label="Apply to all company users"
                sx={{ mt: 2, display: 'block' }}
              />
            )}
            
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 3 }}
              onClick={handleSaveNotificationSettings}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Save Notification Settings
            </Button>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ maxWidth: 800 }}>
            <Typography variant="h6" gutterBottom>
              API Configuration
            </Typography>
            <Card variant="outlined" sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Your API Key
                </Typography>
                <TextField
                  fullWidth
                  value={apiKey || '•••••••••••••••••••••••••'}
                  InputProps={{
                    readOnly: true
                  }}
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                {isCompanyAdmin && (
                  <FormControlLabel
                    control={
                      <Switch
                        id="integrationsApplyCompanyWide"
                        onChange={(e) => e.target.setAttribute('data-checked', e.target.checked.toString())}
                      />
                    }
                    label="Apply to all company users"
                  />
                )}
                <Button
                  variant="contained"
                  onClick={handleGenerateApiKey}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  Generate New API Key
                </Button>
              </CardContent>
            </Card>
            
            <Typography variant="h6" gutterBottom>
              Connected Systems
            </Typography>
            <List>
              {integrations.map((integration) => (
                <ListItem
                  key={integration.id}
                  secondaryAction={
                    <Button
                      variant={integration.connected ? "outlined" : "contained"}
                      color={integration.connected ? "error" : "primary"}
                      onClick={() => handleConnectIntegration(integration.id)}
                      size="small"
                    >
                      {integration.connected ? 'Disconnect' : 'Connect'}
                    </Button>
                  }
                  disablePadding
                  sx={{ mb: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                >
                  <Box sx={{ p: 2, width: '100%', display: 'flex', alignItems: 'center' }}>
                    {integration.connected && (
                      <CheckIcon color="success" sx={{ mr: 1 }} />
                    )}
                    <ListItemText
                      primary={integration.name}
                      secondary={integration.connected ? 'Connected' : 'Not connected'}
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              sx={{ mt: 2 }}
            >
              Add New Integration
            </Button>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ maxWidth: 800 }}>
            <Typography variant="h6" gutterBottom>
              Data Management
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 calc(50% - 12px)' } }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Export Your Data
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Download a copy of all your data in CSV or JSON format.
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => setExportDialogOpen(true)}
                    >
                      Export Data
                    </Button>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 calc(50% - 12px)' } }}>
                <Card variant="outlined" sx={{ borderColor: 'error.light' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="error" gutterBottom>
                      Delete Account
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Permanently delete your account and all associated data.
                    </Typography>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      Delete Account
                    </Button>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </Box>
        </TabPanel>
      </Paper>
      
      {/* Export Data Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
      >
        <DialogTitle>Export Your Data</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Choose the format you want to export your data in:
          </DialogContentText>
          <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
            <Button variant="outlined">
              CSV Format
            </Button>
            <Button variant="outlined">
              JSON Format
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Account Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          <Typography color="error">Delete Account</Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="confirmation"
            label="Type 'DELETE' to confirm"
            fullWidth
            variant="outlined"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error">
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings;