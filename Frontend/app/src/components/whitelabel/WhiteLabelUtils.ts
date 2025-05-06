import { Theme } from '../../contexts/ThemeContext';

// Default tenant configuration
const DEFAULT_TENANT_ID = 'tubex-default';

// Function to load tenant configuration from API or localStorage
export const loadTenantConfig = async (tenantId: string = DEFAULT_TENANT_ID): Promise<Partial<Theme>> => {
  // In a real application, this would make an API call to fetch tenant configuration
  // For now, we'll use a simple switch case for demonstration
  
  // Check localStorage first
  const storedConfig = localStorage.getItem(`tenant-config-${tenantId}`);
  if (storedConfig) {
    try {
      return JSON.parse(storedConfig) as Partial<Theme>;
    } catch (e) {
      console.error('Failed to parse stored tenant config', e);
    }
  }
  
  // Fallback to hard-coded configs (in real app, this would be an API call)
  switch (tenantId) {
    case 'tenant-a':
      return {
        primaryColor: '#2196f3',
        secondaryColor: '#ff9800',
        companyName: 'Company A',
        logoUrl: '/assets/tenant-a-logo.png',
      };
    case 'tenant-b':
      return {
        primaryColor: '#4caf50',
        secondaryColor: '#ff5722',
        companyName: 'Company B',
        logoUrl: '/assets/tenant-b-logo.png',
      };
    default:
      return {}; // Use default theme
  }
};

// Function to save tenant configuration
export const saveTenantConfig = (tenantId: string, config: Partial<Theme>): void => {
  localStorage.setItem(`tenant-config-${tenantId}`, JSON.stringify(config));
};

// Function to detect tenant from URL or subdomain
export const detectTenant = (): string => {
  // In a real application, you might detect the tenant from:
  // 1. Subdomain (tenant-a.tubex.com)
  // 2. URL path (/tenant-a/dashboard)
  // 3. Query parameter (?tenant=tenant-a)
  
  // Check for tenant in subdomain
  const hostname = window.location.hostname;
  const subdomainMatch = hostname.match(/^([^.]+)\.tubex\.com$/);
  if (subdomainMatch && subdomainMatch[1] !== 'www') {
    return subdomainMatch[1];
  }
  
  // Check for tenant in path
  const pathMatch = window.location.pathname.match(/^\/([\w-]+)\//);
  if (pathMatch) {
    return pathMatch[1];
  }
  
  // Check for tenant in query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const tenantParam = urlParams.get('tenant');
  if (tenantParam) {
    return tenantParam;
  }
  
  // Default tenant
  return DEFAULT_TENANT_ID;
};

// Function to generate CSS variables based on theme
export const generateCssVariables = (theme: Theme): Record<string, string> => {
  const variables: Record<string, string> = {
    '--primary-color': theme.primaryColor,
    '--secondary-color': theme.secondaryColor,
    '--background-color': theme.backgroundColor,
    '--text-color': theme.textColor,
  };
  
  return variables;
};