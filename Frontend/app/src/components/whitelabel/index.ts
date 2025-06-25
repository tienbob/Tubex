// Export all white label components for easier imports
export { default as WhiteLabelProvider } from './WhiteLabelProvider';
export { default as WhiteLabelLayout } from './WhiteLabelLayout';
export { default as WhiteLabelHeader } from './WhiteLabelHeader';
export { default as WhiteLabelFooter } from './WhiteLabelFooter';
export { default as WhiteLabelButton } from './WhiteLabelButton';
export { default as WhiteLabelStyleInjector } from './WhiteLabelStyleInjector';
export { default as TenantConfigPanel } from './TenantConfigPanel';
export { default as ConfirmationDialog } from '../shared/ConfirmationDialog';
export { default as DashboardCard } from '../shared/DashboardCard';

// Export utility functions
export * from './WhiteLabelUtils';

// Common UI components
export { default as DataTable } from '../shared/DataTable';
export { default as FormContainer } from '../shared/FormContainer';
export { default as FormButtons } from '../shared/FormButtons';

// Products
export { default as ProductList } from '../products/ProductList';
export { default as ProductForm } from '../products/ProductForm';

// Inventory
export { default as InventoryList } from '../inventory/InventoryList';
export { default as InventoryAdjustForm } from '../inventory/forms/InventoryAdjustForm';

// Orders
export { default as OrderList } from '../orders/OrderList';

// Invoices
export { InvoiceList, InvoiceDetail, InvoiceForm } from '../invoices';

// Users
export { default as UserForm } from '../user-management/UserForm';

// Re-export types
export type { Column } from '../shared/DataTable';