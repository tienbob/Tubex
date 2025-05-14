import React from 'react';
import { Box, Typography, Chip, Card, CardContent, Stack, IconButton, Tooltip } from '@mui/material';
import { 
  Palette as ThemeIcon, 
  Notifications as NotificationIcon,
  Storage as IntegrationIcon,
  Refresh as ResetIcon
} from '@mui/icons-material';
import { CompanySettings } from '../../utils/companySettings';

interface SettingsOverrideProps {
  companySettings: Partial<CompanySettings>;
  userSettings: Partial<CompanySettings>;
  onResetToCompany: (section: string) => void;
}

/**
 * Component to display which settings are overridden for the current user
 * with options to reset to company-wide defaults
 */
const SettingsOverrideDisplay: React.FC<SettingsOverrideProps> = ({
  companySettings,
  userSettings,
  onResetToCompany
}) => {
  // Check which sections have overrides
  const hasAppearanceOverrides = userSettings.appearance && 
    Object.keys(userSettings.appearance).length > 0;

  const hasNotificationOverrides = userSettings.notifications && 
    Object.keys(userSettings.notifications).length > 0;

  const hasIntegrationOverrides = userSettings.integrations && 
    Object.keys(userSettings.integrations).length > 0;

  // If no overrides, don't render the component
  if (!hasAppearanceOverrides && !hasNotificationOverrides && !hasIntegrationOverrides) {
    return null;
  }

  return (
    <Card variant="outlined" sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Your Custom Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          The following settings are customized for your account and differ from company-wide defaults.
        </Typography>

        <Stack spacing={2}>
          {hasAppearanceOverrides && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ThemeIcon color="primary" fontSize="small" />
                <Typography>Appearance Settings</Typography>
                {userSettings.appearance?.darkMode !== undefined && (
                  <Chip size="small" label="Dark Mode" />
                )}
                {userSettings.appearance?.fontSize !== undefined && (
                  <Chip size="small" label="Font Size" />
                )}
                {userSettings.appearance?.language !== undefined && (
                  <Chip size="small" label="Language" />
                )}
              </Stack>
              <Tooltip title="Reset to company defaults">
                <IconButton 
                  size="small" 
                  onClick={() => onResetToCompany('appearance')}
                  color="primary"
                >
                  <ResetIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          {hasNotificationOverrides && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <NotificationIcon color="primary" fontSize="small" />
                <Typography>Notification Preferences</Typography>
                <Chip size="small" label="Custom Notifications" />
              </Stack>
              <Tooltip title="Reset to company defaults">
                <IconButton 
                  size="small" 
                  onClick={() => onResetToCompany('notifications')}
                  color="primary"
                >
                  <ResetIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          {hasIntegrationOverrides && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <IntegrationIcon color="primary" fontSize="small" />
                <Typography>Integration Settings</Typography>
                {userSettings.integrations?.apiKey && (
                  <Chip size="small" label="API Key" />
                )}
                {userSettings.integrations?.connectedServices && (
                  <Chip size="small" label="Connected Services" />
                )}
              </Stack>
              <Tooltip title="Reset to company defaults">
                <IconButton 
                  size="small" 
                  onClick={() => onResetToCompany('integrations')}
                  color="primary"
                >
                  <ResetIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default SettingsOverrideDisplay;
