import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  CompanySettings, 
  defaultSettings, 
  getEffectiveSettings, 
  saveCompanySettings, 
  saveUserOverrides, 
  loadUserOverrides,
  loadCompanySettings,
  resetSection,
  SettingsSection
} from '../utils/companySettings';
import { useAuth } from '../components/auth/AuthContext';

// Define the context type
interface CompanySettingsContextType {
  settings: CompanySettings;
  updateSettings: (newSettings: Partial<CompanySettings>, applyToCompany?: boolean) => void;
  isCompanyAdmin: boolean;
  applyCompanySettings: () => void;
  resetSettingsSection: (section: string) => void;
  userOverrides: Partial<CompanySettings>;
  companySettings: CompanySettings;
}

// Create the context
const CompanySettingsContext = createContext<CompanySettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  isCompanyAdmin: false,
  applyCompanySettings: () => {},
  resetSettingsSection: () => {},
  userOverrides: {},
  companySettings: defaultSettings,
});

interface CompanySettingsProviderProps {
  children: ReactNode;
}

export const CompanySettingsProvider: React.FC<CompanySettingsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultSettings);
  const [userOverrides, setUserOverrides] = useState<Partial<CompanySettings>>({});
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);  // Function to load settings on initialization or refresh
  const loadUserSettings = () => {
    if (user && user.userId) {
      // Determine if user is a company admin
      setIsCompanyAdmin(user.role === 'admin');
      
      // Load company settings
      const company = loadCompanySettings(user.companyId);
      setCompanySettings(company);
      
      // Load user overrides
      const overrides = loadUserOverrides(user.userId);
      setUserOverrides(overrides);
      
      // Load effective settings (company + user overrides)
      const effectiveSettings = getEffectiveSettings(user.companyId, user.userId);
      setSettings(effectiveSettings);
    }
  };

  // Initialize settings when user info becomes available
  useEffect(() => {
    loadUserSettings();
  }, [user]);
  // Update settings
  const updateSettings = (newSettings: Partial<CompanySettings>, applyToCompany = false) => {
    // Create updated settings object using deep merge
    const updatedSettings = {
      ...settings,
      ...newSettings,
      appearance: {
        ...settings.appearance,
        ...(newSettings.appearance || {}),
      },
      notifications: {
        ...settings.notifications,
        ...(newSettings.notifications || {}),
      },
      integrations: {
        ...settings.integrations,
        ...(newSettings.integrations || {}),
      },
    };

    // Update state
    setSettings(updatedSettings);

    // Save to storage
    if (user) {      
      if (applyToCompany && isCompanyAdmin) {
        // Save as company settings
        saveCompanySettings(user.companyId, updatedSettings);
        
        // Update company settings state
        setCompanySettings(updatedSettings);
      } else {
        // Save as user overrides
        saveUserOverrides(user.userId, updatedSettings);
        
        // Refresh user overrides
        const overrides = loadUserOverrides(user.userId);
        setUserOverrides(overrides);
      }
    }
  };  // Apply company settings by clearing user overrides
  const applyCompanySettings = () => {
    if (user) {
      // Clear user overrides
      saveUserOverrides(user.userId, {});
      
      // Load fresh effective settings
      const effectiveSettings = getEffectiveSettings(user.companyId, user.userId);
      setSettings(effectiveSettings);
      
      // Update user overrides state
      setUserOverrides({});
    }
  };// Function to reset a specific section
  const resetSettingsSection = (section: string) => {
    if (user && user.userId) {
      // Reset the specified section
      const updatedSettings = resetSection(user.userId, user.companyId, section as SettingsSection);
      
      // Update state
      setSettings(updatedSettings);
      
      // Refresh user overrides
      const overrides = loadUserOverrides(user.userId);
      setUserOverrides(overrides);
    }
  };

  return (
    <CompanySettingsContext.Provider 
      value={{ 
        settings, 
        updateSettings, 
        isCompanyAdmin,
        applyCompanySettings,
        resetSettingsSection,
        userOverrides,
        companySettings 
      }}
    >
      {children}
    </CompanySettingsContext.Provider>
  );
};

// Custom hook for using company settings
export const useCompanySettings = () => useContext(CompanySettingsContext);

export default CompanySettingsContext;
