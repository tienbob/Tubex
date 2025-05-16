// Export all white label components for easier imports
export { default as WhiteLabelProvider } from './WhiteLabelProvider';
export { default as WhiteLabelLayout } from './WhiteLabelLayout';
export { default as WhiteLabelHeader } from './WhiteLabelHeader';
export { default as WhiteLabelFooter } from './WhiteLabelFooter';
export { default as WhiteLabelButton } from './WhiteLabelButton';
export { default as WhiteLabelStyleInjector } from './WhiteLabelStyleInjector';
export { default as TenantConfigPanel } from './TenantConfigPanel';
export { default as AdminPage } from './AdminPage';
export { default as ConfirmationDialog } from './ConfirmationDialog';
export { default as DashboardCard } from './DashboardCard';

// Export utility functions
export * from './WhiteLabelUtils';

// Common UI components
export { default as DataTable } from './DataTable';
export { default as FormContainer } from './FormContainer';
export { default as FormButtons } from './FormButtons';

// Products
export { default as ProductList } from './products/ProductList';
export { default as ProductForm } from './products/ProductForm';

// Inventory
export { default as InventoryList } from './inventory/InventoryList';
export { default as InventoryAdjustForm } from './inventory/InventoryAdjustForm';

// Orders
export { default as OrderList } from './orders/OrderList';

// Users
export { default as UserList } from './users/UserList';
export { default as UserForm } from './users/UserForm';

// Verification
export { default as CompanyVerificationList } from './verification/CompanyVerificationList';

// Re-export types
export type { Column, PaginationProps } from './DataTable';