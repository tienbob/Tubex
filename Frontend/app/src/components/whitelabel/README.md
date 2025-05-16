# Tubex White Label Module

## Overview

The White Label module provides a complete solution for creating multi-tenant, customizable UI in the Tubex B2B SaaS Platform. This module allows different tenants to have their own branded look and feel while retaining the core functionality of the Tubex platform.

## Features

- **Dynamic Theming**: Customize colors, fonts, and UI elements for each tenant
- **Tenant Detection**: Automatically detect tenants from URL, path, or query parameters
- **Theme Persistence**: Save and load tenant configurations
- **Admin Interface**: GUI for managing tenant configurations
- **Component Library**: Pre-styled components that automatically use tenant branding

## Usage

### Basic Setup

To white-label your application, wrap your components with the `WhiteLabelProvider`:

```tsx
import { WhiteLabelProvider } from './components/whitelabel';

const App = () => {
  return (
    <WhiteLabelProvider>
      {/* Your application components */}
    </WhiteLabelProvider>
  );
};
```

### Using White Label Components

The module provides pre-styled components that automatically adapt to tenant branding:

```tsx
import { 
  WhiteLabelLayout,
  WhiteLabelButton,
  WhiteLabelHeader,
  WhiteLabelFooter
} from './components/whitelabel';

const MyPage = () => {
  return (
    <WhiteLabelLayout>
      <WhiteLabelHeader />
      <main>
        <h1>Welcome to Your Application</h1>
        <WhiteLabelButton>Click Me</WhiteLabelButton>
      </main>
      <WhiteLabelFooter />
    </WhiteLabelLayout>
  );
};
```

### Admin Configuration

To allow configuration of tenant branding, use the `AdminPage` component:

```tsx
import { AdminPage } from './components/whitelabel';

const WhiteLabelAdmin = () => {
  return <AdminPage />;
};
```

### CSS Variables

The module exposes CSS variables that can be used in your custom components:

```css
.my-custom-component {
  background-color: var(--primary-color);
  color: white;
  font-family: var(--font-family);
  border-radius: var(--button-radius);
}
```

## Configuration Options

Each tenant can be configured with the following options:

- `primaryColor`: Main brand color
- `secondaryColor`: Secondary brand color
- `logoUrl`: URL to tenant logo
- `companyName`: Tenant company name
- `fontFamily`: Font family for UI
- `buttonRadius`: Border radius for buttons and UI elements

## Tenant Detection

By default, tenants are detected from:
1. Subdomain (e.g., tenant-a.tubex.com)
2. URL path (e.g., /tenant-a/dashboard)
3. Query parameter (e.g., ?tenant=tenant-a)

You can customize this by modifying the `detectTenant` function in `WhiteLabelUtils.ts`.

## Best Practices

1. Use the provided white label components whenever possible
2. Apply white label CSS classes to custom components
3. Always test your UI with multiple tenant configurations
4. Keep tenant-specific logic separate from core application logic

## Limitations

- This module only covers the frontend white labeling
- Backend services must handle tenant isolation separately
- CSS variables may not be supported in older browsers

## Future Enhancements

- More white-labeled UI components
- Improved theme editor with visual previews
- Theme export/import functionality
- Advanced tenant management features

## Component Library

The whitelabel module provides the following UI components, all designed to use tenant-specific branding:

### Core Components
- `WhiteLabelProvider` - Context provider for tenant theming
- `WhiteLabelLayout` - Page layout with header and footer
- `WhiteLabelHeader` - App header with navigation, user menu, notifications and dark mode toggle
- `WhiteLabelFooter` - App footer with navigation links and copyright
- `WhiteLabelButton` - Branded button component
- `WhiteLabelStyleInjector` - Injects dynamic CSS based on tenant theme

### UI Components
- `DashboardCard` - Card component for dashboard panels and widgets
- `ConfirmationDialog` - Dialog for confirming user actions
- `SearchBar` - Global search component with result suggestions
- `DataTable` - Table component for displaying data with sorting and pagination

### Admin Components
- `TenantConfigPanel` - Admin interface for managing tenant configurations
- `AdminPage` - Base layout for admin interfaces

## Recent Updates (May 2025)

1. **Component Organization**: 
   - Moved UI components from common folder to whitelabel folder
   - Enhanced components with branding capabilities
   - Improved TypeScript definitions and prop interfaces

2. **Feature Enhancements**:
   - Added notification support to WhiteLabelHeader
   - Added dark mode toggle to WhiteLabelHeader
   - Enhanced WhiteLabelFooter with categorized links
   - Improved responsiveness across all components

3. **API Improvements**:
   - Added simpleFooter option to WhiteLabelFooter
   - Added showLinks option to WhiteLabelFooter
   - Enhanced WhiteLabelHeader with notification badge support