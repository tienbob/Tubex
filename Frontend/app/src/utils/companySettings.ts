// Company settings utilities
import { Theme } from '../contexts/ThemeContext';

// Define the settings structure
export interface CompanySettings {
  appearance: {
    darkMode: boolean;
    fontSize: number;
    language: string;
    theme?: Partial<Theme>;
  };
  notifications: {
    email: boolean;
    push: boolean;
    newOrders: boolean;
    inventory: boolean;
  };
  integrations: {
    apiKey: string;
    connectedServices: Array<{
      id: number;
      name: string;
      connected: boolean;
    }>;
  };
}

// Define a type for specific section resets
export type SettingsSection = 'appearance' | 'notifications' | 'integrations';

// Default settings template
export const defaultSettings: CompanySettings = {
  appearance: {
    darkMode: false,
    fontSize: 16,
    language: 'en',
  },
  notifications: {
    email: true,
    push: true,
    newOrders: true,
    inventory: true,
  },
  integrations: {
    apiKey: '',
    connectedServices: [
      { id: 1, name: 'Warehouse System', connected: false },
      { id: 2, name: 'Accounting Software', connected: false },
      { id: 3, name: 'CRM System', connected: false }
    ],
  },
};

// Keys for storage
const SETTINGS_KEY_PREFIX = 'tubex_company_';
const USER_OVERRIDE_KEY_PREFIX = 'tubex_user_';

// Save company settings to localStorage
export const saveCompanySettings = (companyId: string, settings: CompanySettings): void => {
  localStorage.setItem(`${SETTINGS_KEY_PREFIX}${companyId}`, JSON.stringify(settings));
};

// Load company settings from localStorage
export const loadCompanySettings = (companyId: string): CompanySettings => {
  const savedSettings = localStorage.getItem(`${SETTINGS_KEY_PREFIX}${companyId}`);
  
  try {
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      return { ...defaultSettings, ...parsedSettings };
    }
  } catch (e) {
    console.error('Failed to parse company settings', e);
  }
  
  return { ...defaultSettings };
};

// Save user-specific overrides
export const saveUserOverrides = (userId: string, overrides: Partial<CompanySettings>): void => {
  localStorage.setItem(`${USER_OVERRIDE_KEY_PREFIX}${userId}`, JSON.stringify(overrides));
};

// Load user-specific overrides
export const loadUserOverrides = (userId: string): Partial<CompanySettings> => {
  const savedOverrides = localStorage.getItem(`${USER_OVERRIDE_KEY_PREFIX}${userId}`);
  
  try {
    if (savedOverrides) {
      return JSON.parse(savedOverrides);
    }
  } catch (e) {
    console.error('Failed to parse user overrides', e);
  }
  
  return {};
};

// Get effective settings by combining company settings with user overrides
export const getEffectiveSettings = (companyId: string, userId: string): CompanySettings => {
  const companySettings = loadCompanySettings(companyId);
  const userOverrides = loadUserOverrides(userId);
  
  // Deep merge the settings
  return deepMerge(companySettings, userOverrides);
};

// Helper function for deep merging objects
const deepMerge = (target: any, source: any): any => {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
};

// Helper to check if value is an object
const isObject = (item: any): boolean => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

// Get just the user overrides by comparing with company settings
export const extractUserOverrides = (companySettings: CompanySettings, userSettings: CompanySettings): Partial<CompanySettings> => {
  const overrides: Partial<CompanySettings> = {};
  
  // Check appearance settings
  const appearanceOverrides = getDifferingKeys(companySettings.appearance, userSettings.appearance);
  if (Object.keys(appearanceOverrides).length > 0) {
    overrides.appearance = appearanceOverrides;
  }
  
  // Check notification settings
  const notificationOverrides = getDifferingKeys(companySettings.notifications, userSettings.notifications);
  if (Object.keys(notificationOverrides).length > 0) {
    overrides.notifications = notificationOverrides;
  }
  
  // Check integration settings
  const integrationOverrides = getDifferingKeys(companySettings.integrations, userSettings.integrations);
  if (Object.keys(integrationOverrides).length > 0) {
    overrides.integrations = integrationOverrides;
  }
  
  return overrides;
};

// Get differing keys between two objects
const getDifferingKeys = (base: any, compare: any): any => {
  const result: any = {};
  
  Object.keys(compare).forEach(key => {
    // If values are objects, recursively compare
    if (isObject(base[key]) && isObject(compare[key])) {
      const nestedDiffs = getDifferingKeys(base[key], compare[key]);
      if (Object.keys(nestedDiffs).length > 0) {
        result[key] = nestedDiffs;
      }
    }
    // Otherwise, check if values are different
    else if (JSON.stringify(base[key]) !== JSON.stringify(compare[key])) {
      result[key] = compare[key];
    }
  });
  
  return result;
};

// Reset a specific section of user settings to company defaults
export const resetSection = (userId: string, companyId: string, section: SettingsSection): CompanySettings => {
  const companySettings = loadCompanySettings(companyId);
  const userOverrides = loadUserOverrides(userId);
  
  if (userOverrides[section]) {
    delete userOverrides[section];
    saveUserOverrides(userId, userOverrides);
  }
  
  return getEffectiveSettings(companyId, userId);
};
