/**
 * Role-Based Access Control (RBAC) Utility
 * Defines access permissions based on user roles and company types
 */

export type UserRole = 'admin' | 'manager' | 'staff';
export type CompanyType = 'supplier' | 'dealer';

// Role hierarchy: admin > manager > staff
export const roleHierarchy: Record<UserRole, number> = {
  admin: 3,
  manager: 2,
  staff: 1
};

export const canManageUser = (managerRole: UserRole, targetRole: UserRole): boolean => {
  return roleHierarchy[managerRole] > roleHierarchy[targetRole];
};

export const canAssignRole = (managerRole: UserRole, targetRole: UserRole): boolean => {
  return roleHierarchy[managerRole] >= roleHierarchy[targetRole];
};

export interface User {
  userId: string;
  role: string;
  companyId: string;
  companyType?: CompanyType;
}

export interface AccessPermissions {
  // Dashboard Access
  dashboard: boolean;
  analytics: boolean;
  
  // Product Management
  productView: boolean;
  productCreate: boolean;
  productEdit: boolean;
  productDelete: boolean;
  
  // Inventory Management
  inventoryView: boolean;
  inventoryCreate: boolean;
  inventoryEdit: boolean;
  inventoryDelete: boolean;
  
  // Warehouse Management
  warehouseView: boolean;
  warehouseCreate: boolean;
  warehouseEdit: boolean;
  warehouseDelete: boolean;
  
  // Order Management
  orderView: boolean;
  orderCreate: boolean;
  orderEdit: boolean;
  orderDelete: boolean;
  orderApprove: boolean;
  
  // Quote Management
  quoteView: boolean;
  quoteCreate: boolean;
  quoteEdit: boolean;
  quoteDelete: boolean;
  quoteApprove: boolean;
  
  // Invoice Management
  invoiceView: boolean;
  invoiceCreate: boolean;
  invoiceEdit: boolean;
  invoiceDelete: boolean;
  
  // Payment Management
  paymentView: boolean;
  paymentCreate: boolean;
  paymentEdit: boolean;
  paymentDelete: boolean;
  
  // User Management
  userView: boolean;
  userCreate: boolean;
  userEdit: boolean;
  userDelete: boolean;
  
  // Price List Management
  priceListView: boolean;
  priceListCreate: boolean;
  priceListEdit: boolean;
  priceListDelete: boolean;
  
  // Reports
  reportView: boolean;
  reportCreate: boolean;
  reportExport: boolean;
  
  // Settings
  settingsView: boolean;
  settingsEdit: boolean;
  companySettings: boolean;
}

/**
 * Define permissions for each role and company type combination
 */
const ROLE_PERMISSIONS: Record<string, AccessPermissions> = {
  // SUPPLIER PERMISSIONS
  'supplier-admin': {
    dashboard: true,
    analytics: true,
    
    productView: true,
    productCreate: true,
    productEdit: true,
    productDelete: true,
    
    inventoryView: true,
    inventoryCreate: true,
    inventoryEdit: true,
    inventoryDelete: true,
    
    warehouseView: true,
    warehouseCreate: true,
    warehouseEdit: true,
    warehouseDelete: true,
    
    orderView: true,
    orderCreate: false, // Suppliers receive orders, don't create them
    orderEdit: true,
    orderDelete: false,
    orderApprove: true,
    
    quoteView: true,
    quoteCreate: true,
    quoteEdit: true,
    quoteDelete: true,
    quoteApprove: true,
    
    invoiceView: true,
    invoiceCreate: true,
    invoiceEdit: true,
    invoiceDelete: true,
    
    paymentView: true,
    paymentCreate: false, // Suppliers receive payments
    paymentEdit: true,
    paymentDelete: false,
    
    userView: true,
    userCreate: true,
    userEdit: true,
    userDelete: true,
    
    priceListView: true,
    priceListCreate: true,
    priceListEdit: true,
    priceListDelete: true,
    
    reportView: true,
    reportCreate: true,
    reportExport: true,
    
    settingsView: true,
    settingsEdit: true,
    companySettings: true,
  },
  
  'supplier-manager': {
    dashboard: true,
    analytics: true,
    
    productView: true,
    productCreate: true,
    productEdit: true,
    productDelete: false,
    
    inventoryView: true,
    inventoryCreate: true,
    inventoryEdit: true,
    inventoryDelete: false,
    
    warehouseView: true,
    warehouseCreate: false,
    warehouseEdit: true,
    warehouseDelete: false,
    
    orderView: true,
    orderCreate: false,
    orderEdit: true,
    orderDelete: false,
    orderApprove: true,
    
    quoteView: true,
    quoteCreate: true,
    quoteEdit: true,
    quoteDelete: false,
    quoteApprove: false,
    
    invoiceView: true,
    invoiceCreate: true,
    invoiceEdit: true,
    invoiceDelete: false,
    
    paymentView: true,
    paymentCreate: false,
    paymentEdit: false,
    paymentDelete: false,
    
    userView: true,
    userCreate: false,
    userEdit: false,
    userDelete: false,
    
    priceListView: true,
    priceListCreate: false,
    priceListEdit: true,
    priceListDelete: false,
    
    reportView: true,
    reportCreate: true,
    reportExport: true,
    
    settingsView: true,
    settingsEdit: false,
    companySettings: false,
  },
    'supplier-staff': {
    dashboard: true,
    analytics: false,
    
    productView: true,
    productCreate: false,
    productEdit: false,
    productDelete: false,
    
    inventoryView: true,
    inventoryCreate: false,
    inventoryEdit: true,
    inventoryDelete: false,
    
    warehouseView: true,
    warehouseCreate: false,
    warehouseEdit: false,
    warehouseDelete: false,
    
    orderView: false,
    orderCreate: false,
    orderEdit: false,
    orderDelete: false,
    orderApprove: false,
    
    quoteView: true,
    quoteCreate: false,
    quoteEdit: false,
    quoteDelete: false,
    quoteApprove: false,
    
    invoiceView: true,
    invoiceCreate: false,
    invoiceEdit: false,
    invoiceDelete: false,
    
    paymentView: true,
    paymentCreate: false,
    paymentEdit: false,
    paymentDelete: false,
    
    userView: false,
    userCreate: false,
    userEdit: false,
    userDelete: false,
    
    priceListView: true,
    priceListCreate: false,
    priceListEdit: false,
    priceListDelete: false,
    
    reportView: false,
    reportCreate: false,
    reportExport: false,
    
    settingsView: true,
    settingsEdit: false,
    companySettings: false,
  },
  
  // DEALER PERMISSIONS
  'dealer-admin': {
    dashboard: true,
    analytics: true,
    
    productView: true,
    productCreate: false, // Dealers don't create products, they order from suppliers
    productEdit: false,
    productDelete: false,
    
    inventoryView: true,
    inventoryCreate: false, // Inventory comes from orders
    inventoryEdit: true, // Can adjust received inventory
    inventoryDelete: false,
    
    warehouseView: true,
    warehouseCreate: true,
    warehouseEdit: true,
    warehouseDelete: true,
    
    orderView: true,
    orderCreate: true, // Dealers create orders to suppliers
    orderEdit: true,
    orderDelete: true,
    orderApprove: true,
    
    quoteView: true,
    quoteCreate: false, // Dealers request quotes, don't create them
    quoteEdit: false,
    quoteDelete: false,
    quoteApprove: false,
    
    invoiceView: true,
    invoiceCreate: false, // Dealers receive invoices
    invoiceEdit: false,
    invoiceDelete: false,
    
    paymentView: true,
    paymentCreate: true, // Dealers make payments
    paymentEdit: true,
    paymentDelete: true,
    
    userView: true,
    userCreate: true,
    userEdit: true,
    userDelete: true,
    
    priceListView: true,
    priceListCreate: false, // Dealers view supplier price lists
    priceListEdit: false,
    priceListDelete: false,
    
    reportView: true,
    reportCreate: true,
    reportExport: true,
    
    settingsView: true,
    settingsEdit: true,
    companySettings: true,
  },
  
  'dealer-manager': {
    dashboard: true,
    analytics: true,
    
    productView: true,
    productCreate: false,
    productEdit: false,
    productDelete: false,
    
    inventoryView: true,
    inventoryCreate: false,
    inventoryEdit: true,
    inventoryDelete: false,
    
    warehouseView: true,
    warehouseCreate: false,
    warehouseEdit: true,
    warehouseDelete: false,
    
    orderView: true,
    orderCreate: true,
    orderEdit: true,
    orderDelete: false,
    orderApprove: false,
    
    quoteView: true,
    quoteCreate: false,
    quoteEdit: false,
    quoteDelete: false,
    quoteApprove: false,
    
    invoiceView: true,
    invoiceCreate: false,
    invoiceEdit: false,
    invoiceDelete: false,
    
    paymentView: true,
    paymentCreate: false,
    paymentEdit: false,
    paymentDelete: false,
    
    userView: true,
    userCreate: false,
    userEdit: false,
    userDelete: false,
    
    priceListView: true,
    priceListCreate: false,
    priceListEdit: false,
    priceListDelete: false,
    
    reportView: true,
    reportCreate: true,
    reportExport: true,
    
    settingsView: true,
    settingsEdit: false,
    companySettings: false,
  },
  
  'dealer-staff': {
    dashboard: true,
    analytics: false,
    
    productView: true,
    productCreate: false,
    productEdit: false,
    productDelete: false,
    
    inventoryView: true,
    inventoryCreate: false,
    inventoryEdit: false,
    inventoryDelete: false,
    
    warehouseView: true,
    warehouseCreate: false,
    warehouseEdit: false,
    warehouseDelete: false,
    
    orderView: true,
    orderCreate: false,
    orderEdit: false,
    orderDelete: false,
    orderApprove: false,
    
    quoteView: true,
    quoteCreate: false,
    quoteEdit: false,
    quoteDelete: false,
    quoteApprove: false,
    
    invoiceView: true,
    invoiceCreate: false,
    invoiceEdit: false,
    invoiceDelete: false,
    
    paymentView: false,
    paymentCreate: false,
    paymentEdit: false,
    paymentDelete: false,
    
    userView: false,
    userCreate: false,
    userEdit: false,
    userDelete: false,
    
    priceListView: true,
    priceListCreate: false,
    priceListEdit: false,
    priceListDelete: false,
    
    reportView: false,
    reportCreate: false,
    reportExport: false,
    
    settingsView: true,
    settingsEdit: false,
    companySettings: false,
  },
};

/**
 * Get user permissions based on role and company type
 */
export const getUserPermissions = (user: User): AccessPermissions => {
  const companyType = user.companyType || 'supplier'; // Default to supplier
  const key = `${companyType}-${user.role}`;
  
  return ROLE_PERMISSIONS[key] || ROLE_PERMISSIONS['supplier-staff']; // Default to most restrictive
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (user: User, permission: keyof AccessPermissions): boolean => {
  const permissions = getUserPermissions(user);
  return permissions[permission];
};

/**
 * Check if user can access a specific page/route
 */
export const canAccessPage = (user: User, page: string): boolean => {
  const permissions = getUserPermissions(user);
  
  switch (page) {
    case '/dashboard':
      return permissions.dashboard;
    case '/analytics':
      return permissions.analytics;
    case '/products':
      return permissions.productView;
    case '/inventory':
      return permissions.inventoryView;
    case '/warehouses':
      return permissions.warehouseView;
    case '/orders':
      return permissions.orderView;
    case '/quotes':
      return permissions.quoteView;
    case '/invoices':
      return permissions.invoiceView;
    case '/payments':
      return permissions.paymentView;
    case '/users':
      return permissions.userView;
    case '/price-lists':
      return permissions.priceListView;
    case '/reports':
      return permissions.reportView;    case '/settings':
      return permissions.settingsView;
    case '/profile':
      return true; // All authenticated users should have access to their own profile
    default:
      return false;
  }
};

/**
 * Get available navigation items for user
 */
export const getAvailableNavItems = (user: User) => {
  const permissions = getUserPermissions(user);
  const navItems = [];
  
  if (permissions.dashboard) {
    navItems.push({
      path: '/dashboard',
      label: 'Dashboard',
      icon: 'dashboard'
    });
  }
  
  if (permissions.analytics) {
    navItems.push({
      path: '/analytics',
      label: 'Analytics',
      icon: 'analytics'
    });
  }
  
  if (permissions.productView) {
    navItems.push({
      path: '/products',
      label: 'Products',
      icon: 'inventory'
    });
  }
  
  if (permissions.inventoryView) {
    navItems.push({
      path: '/inventory',
      label: 'Inventory',
      icon: 'storage'
    });
  }
  
  if (permissions.warehouseView) {
    navItems.push({
      path: '/warehouses',
      label: 'Warehouses',
      icon: 'warehouse'
    });
  }
  
  if (permissions.orderView) {
    navItems.push({
      path: '/orders',
      label: 'Orders',
      icon: 'shopping_cart'
    });
  }
  
  if (permissions.quoteView) {
    navItems.push({
      path: '/quotes',
      label: 'Quotes',
      icon: 'request_quote'
    });
  }
  
  if (permissions.invoiceView) {
    navItems.push({
      path: '/invoices',
      label: 'Invoices',
      icon: 'receipt'
    });
  }
  
  if (permissions.paymentView) {
    navItems.push({
      path: '/payments',
      label: 'Payments',
      icon: 'payment'
    });
  }
  
  if (permissions.userView) {
    navItems.push({
      path: '/users',
      label: 'Users',
      icon: 'people'
    });
  }
  
  if (permissions.priceListView) {
    navItems.push({
      path: '/price-lists',
      label: 'Price Lists',
      icon: 'price_list'
    });
  }
  
  if (permissions.reportView) {
    navItems.push({
      path: '/reports',
      label: 'Reports',
      icon: 'assessment'
    });
  }
  
  if (permissions.settingsView) {
    navItems.push({
      path: '/settings',
      label: 'Settings',
      icon: 'settings'
    });
  }
  
  return navItems;
};
