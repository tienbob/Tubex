// Updated: May 9, 2025
const systemStatusData = {
    name: 'System Status',
    icon: 'fa-heartbeat',
    lastUpdated: 'May 9, 2025',
    version: '1.2.0',
    children: [
        {
            name: 'Server Configuration',
            icon: 'fa-gear',
            children: [
                {
                    name: 'server.ts',
                    icon: 'fa-file-code',
                    description: 'Main server entry point. Configures Express app, middleware, and routes.',
                    path: '/src/server.ts',
                    maintainInfo: 'The server entry point handles all initial setup. Check this file when:\n- Adding new middleware\n- Configuring global settings\n- Troubleshooting startup issues'
                },
                {
                    name: 'app.ts',
                    icon: 'fa-file-code',
                    description: 'Express application configuration and setup.',
                    path: '/src/app.ts',
                    maintainInfo: 'Contains core Express app configuration. Update when:\n- Adding new routes\n- Configuring middleware\n- Setting up error handling'
                }
            ]
        },
        {
            name: 'Configuration',
            icon: 'fa-wrench',
            children: [
                {
                    name: 'Environment',
                    icon: 'fa-file-code',
                    path: '/src/config/index.ts',
                    description: 'Environment configuration and variables.',
                    maintainInfo: 'Contains all environment variables and configuration. Update when:\n- Adding new environment variables\n- Changing configuration structure\n- Adding new external service integrations'
                },
                {
                    name: 'Authentication',
                    icon: 'fa-shield',
                    path: '/src/config/passport.ts',
                    description: 'Passport.js authentication configuration.',
                    maintainInfo: 'Handles authentication strategies. Modify when:\n- Adding new auth providers\n- Updating authentication flow\n- Changing user verification process'
                },
                {
                    name: 'API Documentation',
                    icon: 'fa-book',
                    path: '/src/config/swagger.ts',
                    description: 'Swagger API documentation setup.',
                    maintainInfo: 'API documentation configuration. Update when:\n- Adding new endpoints\n- Modifying existing endpoints\n- Updating API documentation'
                }
            ]
        },
        {
            name: 'Database',
            icon: 'fa-database',
            children: [
                {
                    name: 'Connection',
                    icon: 'fa-plug',
                    path: '/src/database/index.ts',
                    description: 'Database connection configuration.',
                    maintainInfo: 'Database connection setup. Check when:\n- Troubleshooting connection issues\n- Modifying database configuration\n- Adding new database connections'
                },
                {
                    name: 'ORM Config',
                    icon: 'fa-cogs',
                    path: '/src/database/ormconfig.ts',
                    description: 'TypeORM configuration.',
                    maintainInfo: 'ORM configuration file. Update when:\n- Changing database settings\n- Modifying entity configurations\n- Updating migration settings'
                },
                {
                    name: 'Migrations',
                    icon: 'fa-code-branch',
                    path: '/src/database/migrations',
                    description: 'Database schema migrations.',
                    maintainInfo: 'Database migrations folder. Relevant when:\n- Adding new database tables\n- Modifying existing schemas\n- Troubleshooting migration issues'
                },
                {
                    name: 'Models',
                    icon: 'fa-cubes',
                    children: [
                        {
                            name: 'SQL Models',
                            icon: 'fa-table',
                            path: '/src/database/models/sql',
                            description: 'SQL database models.',
                            maintainInfo: 'SQL database entities. Modify when:\n- Adding new database tables\n- Updating table structures\n- Adding relationships'
                        },
                        {
                            name: 'MongoDB Models',
                            icon: 'fa-leaf',
                            path: '/src/database/models/mongo',
                            description: 'MongoDB schemas and models.',
                            maintainInfo: 'MongoDB schemas. Update when:\n- Adding new collections\n- Modifying document structures\n- Updating indexes'
                        }
                    ]
                }
            ]
        },
        {
            name: 'Services',
            icon: 'fa-cube',
            children: [
                {
                    name: 'Authentication',
                    icon: 'fa-key',
                    path: '/src/services/auth',
                    description: 'Authentication service and routes.',
                    maintainInfo: 'Authentication service. Maintain when:\n- Modifying login/signup flow\n- Updating password policies\n- Adding new auth features'
                },
                {
                    name: 'Cache',
                    icon: 'fa-memory',
                    path: '/src/services/cache',
                    description: 'Caching service implementation.',
                    maintainInfo: 'Caching service. Update when:\n- Modifying cache strategies\n- Changing TTL settings\n- Troubleshooting performance issues'
                },
                {
                    name: 'Company Verification',
                    icon: 'fa-building',
                    path: '/src/services/company-verification',
                    description: 'Company verification and validation service.',
                    maintainInfo: 'Company verification service. Check when:\n- Updating validation rules\n- Adding new verification methods\n- Modifying verification workflow'
                },
                {
                    name: 'Email',
                    icon: 'fa-envelope',
                    path: '/src/services/email',
                    description: 'Email service implementation.',
                    maintainInfo: 'Email service. Update when:\n- Changing email templates\n- Modifying email providers\n- Adding new email notifications'
                },
                {
                    name: 'Inventory',
                    icon: 'fa-box',
                    path: '/src/services/inventory',
                    description: 'Inventory management service.',
                    maintainInfo: 'Inventory management. Check when:\n- Modifying stock management\n- Updating inventory rules\n- Adding new inventory features'
                },
                {
                    name: 'Order',
                    icon: 'fa-shopping-cart',
                    path: '/src/services/order',
                    description: 'Order processing service.',
                    maintainInfo: 'Order processing. Maintain when:\n- Updating order workflow\n- Modifying payment integration\n- Adding new order features'
                },
                {
                    name: 'Product',
                    icon: 'fa-tag',
                    path: '/src/services/product',
                    description: 'Product management service.',
                    maintainInfo: 'Product management. Update when:\n- Adding product features\n- Modifying product structure\n- Updating product validation'
                },
                {
                    name: 'User',
                    icon: 'fa-user',
                    path: '/src/services/user',
                    description: 'User management service.',
                    maintainInfo: 'User service. Check when:\n- Modifying user profiles\n- Updating user permissions\n- Adding new user features'
                },
                {
                    name: 'User Management',
                    icon: 'fa-users-cog',
                    path: '/src/services/user-management',
                    description: 'Advanced user management features.',
                    maintainInfo: 'User management service. Update when:\n- Modifying role management\n- Updating team structures\n- Adding new organizational features'
                }
            ]
        },
        {
            name: 'Middleware',
            icon: 'fa-filter',
            children: [
                {
                    name: 'Admin Authentication',
                    icon: 'fa-user-shield',
                    path: '/src/middleware/adminAuth.ts',
                    description: 'Admin-specific authentication middleware.',
                    maintainInfo: 'Admin authentication. Modify when:\n- Changing admin access controls\n- Updating admin roles\n- Adding new admin features'
                },
                {
                    name: 'Authentication',
                    icon: 'fa-lock',
                    path: '/src/middleware/auth.ts',
                    description: 'Authentication middleware.',
                    maintainInfo: 'Auth middleware. Check when:\n- Modifying authentication flow\n- Adding new auth checks\n- Updating permissions'
                },
                {
                    name: 'Caching',
                    icon: 'fa-bolt',
                    path: '/src/middleware/cache.ts',
                    description: 'Request/response caching middleware.',
                    maintainInfo: 'Caching middleware. Update when:\n- Modifying cache strategies\n- Changing cache keys\n- Updating TTL settings'
                },
                {
                    name: 'Error Handler',
                    icon: 'fa-exclamation-triangle',
                    path: '/src/middleware/errorHandler.ts',
                    description: 'Global error handling middleware.',
                    maintainInfo: 'Error handling. Update when:\n- Adding new error types\n- Modifying error responses\n- Updating error logging'
                },
                {
                    name: 'Rate Limiter',
                    icon: 'fa-tachometer-alt',
                    path: '/src/middleware/rateLimiter.ts',
                    description: 'API rate limiting middleware.',
                    maintainInfo: 'Rate limiting. Modify when:\n- Updating rate limits\n- Changing limiting rules\n- Adding endpoint-specific limits'
                },
                {
                    name: 'Validation',
                    icon: 'fa-check-circle',
                    path: '/src/middleware/validation.ts',
                    description: 'Request validation middleware.',
                    maintainInfo: 'Input validation. Update when:\n- Adding new validators\n- Modifying validation rules\n- Adding new request schemas'
                }
            ]
        },
        {
            name: 'Testing',
            icon: 'fa-vial',
            children: [
                {
                    name: 'Unit Tests',
                    icon: 'fa-microscope',
                    path: '/tests/unit',
                    description: 'Unit tests for individual components.',
                    maintainInfo: 'Unit tests. Update when:\n- Adding new components\n- Modifying existing functionality\n- Fixing bugs'
                },
                {
                    name: 'Integration Tests',
                    icon: 'fa-puzzle-piece',
                    path: '/tests/integration',
                    description: 'Integration tests for API endpoints.',
                    maintainInfo: 'Integration tests. Maintain when:\n- Adding new endpoints\n- Modifying existing endpoints\n- Testing complex workflows'
                },
                {
                    name: 'E2E Tests',
                    icon: 'fa-project-diagram',
                    path: '/tests/e2e',
                    description: 'End-to-end tests for complete workflows.',
                    maintainInfo: 'E2E tests. Check when:\n- Testing complete user journeys\n- Validating critical business flows\n- Performing regression tests'
                }
            ]
        }
    ]
};

const frontendData = {
    name: 'Frontend',
    icon: 'fa-laptop-code',
    children: [
        {
            name: 'Core App Structure',
            icon: 'fa-sitemap',
            description: 'Core application setup and configuration',
            path: '/Frontend/app/src',
            maintainInfo: 'Main application structure. Review when adding new major features or changing app architecture.',
            children: [
                {
                    name: 'Entry Point',
                    icon: 'fa-door-open',
                    path: '/Frontend/app/src/index.tsx',
                    description: 'Main application entry point',
                    maintainInfo: 'Application initialization. Update when:\n- Adding new providers\n- Changing app initialization\n- Updating global error handling'
                },
                {
                    name: 'App Component',
                    icon: 'fa-mobile-alt',
                    path: '/Frontend/app/src/App.tsx',
                    description: 'Root application component',
                    maintainInfo: 'Root component that defines app layout and routes. Modify when:\n- Adding new routes\n- Changing layout structure\n- Updating route guards'
                },
                {
                    name: 'Global Styles',
                    icon: 'fa-palette',
                    path: '/Frontend/app/src/styles',
                    description: 'Global style definitions',
                    maintainInfo: 'Global styling. Update when:\n- Changing theme variables\n- Adding new global styles\n- Updating style utilities'
                }
            ]
        },
        {
            name: 'White Label Module',
            icon: 'fa-palette',
            description: 'Multi-tenant white labeling solution for Tubex',
            path: '/Frontend/app/src/components/whitelabel',
            maintainInfo: 'The white label module provides customization for different tenants. Key focus: only white label scope, no advanced features.',
            children: [
                {
                    name: 'Theme Context',
                    icon: 'fa-brush',
                    path: '/Frontend/app/src/contexts/ThemeContext.tsx',
                    description: 'Theme context for white label customization',
                    maintainInfo: 'Contains theme configuration interface and context providers. Update when:\n- Adding new theme properties\n- Modifying theme behavior\n- Changing default themes'
                },
                {
                    name: 'White Label Provider',
                    icon: 'fa-object-group',
                    path: '/Frontend/app/src/components/whitelabel/WhiteLabelProvider.tsx',
                    description: 'Main provider component for white labeling',
                    maintainInfo: 'Main entry point for white labeling. Modify when:\n- Changing theme initialization\n- Modifying tenant detection\n- Updating Material UI theme integration'
                },
                {
                    name: 'White Label Components',
                    icon: 'fa-puzzle-piece',
                    path: '/Frontend/app/src/components/whitelabel',
                    description: 'Reusable white label UI components',
                    maintainInfo: 'Includes Header, Footer, Layout, and Button components. Update when:\n- Adding new white label components\n- Modifying component styling\n- Changing component behavior'
                },
                {
                    name: 'White Label Utils',
                    icon: 'fa-tools',
                    path: '/Frontend/app/src/components/whitelabel/WhiteLabelUtils.ts',
                    description: 'Utility functions for white labeling',
                    maintainInfo: 'Contains tenant detection and theme utilities. Modify when:\n- Changing tenant detection logic\n- Adding new utility functions\n- Updating theme configuration loading'
                },
                {
                    name: 'Tenant Config Panel',
                    icon: 'fa-sliders-h',
                    path: '/Frontend/app/src/components/whitelabel/TenantConfigPanel.tsx',
                    description: 'Admin interface for tenant configuration',
                    maintainInfo: 'UI for configuring tenant branding. Update when:\n- Adding new configuration options\n- Changing form layout\n- Modifying save behavior'
                },
                {
                    name: 'Admin Page',
                    icon: 'fa-user-cog',
                    path: '/Frontend/app/src/components/whitelabel/AdminPage.tsx',
                    description: 'Admin interface for managing tenant white labels',
                    maintainInfo: 'Main admin interface for white label management. Modify when:\n- Adding tenant management features\n- Changing tenant list behavior\n- Updating admin UI'
                }
            ]
        },
        {
            name: 'Authentication Components',
            icon: 'fa-user-shield',
            description: 'Authentication UI components for Tubex application',
            path: '/Frontend/app/src/components/auth',
            maintainInfo: 'These components handle the user authentication experience. Update when:\n- Modifying login/signup flows\n- Adding new authentication methods\n- Changing user registration fields',
            children: [
                {
                    name: 'Login Form',
                    icon: 'fa-sign-in-alt',
                    path: '/Frontend/app/src/components/auth/LoginForm.tsx',
                    description: 'User login form component',
                    maintainInfo: 'Handles user authentication. Update when:\n- Adding new login methods\n- Modifying validation rules\n- Changing UI elements'
                },
                {
                    name: 'Register Form',
                    icon: 'fa-user-plus',
                    path: '/Frontend/app/src/components/auth/RegisterForm.tsx',
                    description: 'User registration form component',
                    maintainInfo: 'Processes new user registration. Update when:\n- Adding/removing registration fields\n- Modifying validation rules\n- Changing user roles (dealer/supplier/admin)'
                },
                {
                    name: 'Password Reset',
                    icon: 'fa-key',
                    path: '/Frontend/app/src/components/auth/PasswordReset.tsx',
                    description: 'Password reset component',
                    maintainInfo: 'Handles password recovery flow. Update when:\n- Modifying reset process\n- Changing validation rules\n- Updating security measures'
                },
                {
                    name: 'Auth Context',
                    icon: 'fa-lock',
                    path: '/Frontend/app/src/contexts/AuthContext.tsx',
                    description: 'Authentication context provider',
                    maintainInfo: 'Core authentication state management. Update when:\n- Adding new auth methods\n- Changing token handling\n- Modifying user session behavior'
                }
            ]
        },
        {
            name: 'Service Integrations',
            icon: 'fa-plug',
            description: 'Frontend service integrations for API communication',
            path: '/Frontend/app/src/services',
            maintainInfo: 'API service integrations. Update when adding new API endpoints or modifying existing ones.',
            children: [
                {
                    name: 'API Client',
                    icon: 'fa-exchange-alt',
                    path: '/Frontend/app/src/services/api.ts',
                    description: 'Core API client with Axios',
                    maintainInfo: 'Base API client configuration. Modify when:\n- Changing API base URL\n- Updating request interceptors\n- Modifying response handling'
                },
                {
                    name: 'Authentication Service',
                    icon: 'fa-key',
                    path: '/Frontend/app/src/services/auth.service.ts',
                    description: 'Authentication API integration',
                    maintainInfo: 'Auth service integration. Update when:\n- Adding new auth endpoints\n- Modifying token handling\n- Changing authentication flow'
                },
                {
                    name: 'User Service',
                    icon: 'fa-user',
                    path: '/Frontend/app/src/services/user.service.ts',
                    description: 'User API integration',
                    maintainInfo: 'User service integration. Update when:\n- Adding new user endpoints\n- Modifying user data handling\n- Changing profile management'
                }
            ]
        },
        {
            name: 'Custom Hooks',
            icon: 'fa-link',
            description: 'Custom React hooks for shared functionality',
            path: '/Frontend/app/src/hooks',
            maintainInfo: 'Reusable hooks for common patterns. Update when adding new shared functionality.',
            children: [
                {
                    name: 'Authentication Hooks',
                    icon: 'fa-user-shield',
                    path: '/Frontend/app/src/hooks/useAuth.ts',
                    description: 'Authentication-related hooks',
                    maintainInfo: 'Authentication hooks. Modify when:\n- Changing auth flow\n- Adding new auth features\n- Updating permission checking'
                },
                {
                    name: 'Form Hooks',
                    icon: 'fa-wpforms',
                    path: '/Frontend/app/src/hooks/useForm.ts',
                    description: 'Form handling hooks',
                    maintainInfo: 'Form management hooks. Update when:\n- Improving form validation\n- Adding new form features\n- Optimizing form performance'
                }
            ]
        }
    ]
};

// Combine backend and frontend data for the full system documentation
const systemData = {
    name: 'Tubex System',
    icon: 'fa-sitemap',
    children: [frontendData, backendData]
};