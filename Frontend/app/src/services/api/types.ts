export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  product?: {
    id: string;
    name: string;
    description: string;
    base_price: number;
  };
}

export interface Order {
  id: string;
  customerId: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  metadata?: {
    lastUpdated?: string;
    updatedBy?: string;
    previousStatus?: string;
    notes?: string;
  };
}

export interface Inventory {
  id: string;
  product_id: string;
  warehouse_id: string;
  company_id: string;
  quantity: number;
  unit: string;
  min_threshold?: number;
  max_threshold?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  auto_reorder: boolean;
  last_reorder_date?: string;
  status: 'active' | 'inactive';
  product?: {
    id: string;
    name: string;
    description: string;
    base_price: number;
  };
  warehouse?: {
    id: string;
    name: string;
    location: string;
  };
  batches?: {
    id: string;
    batchNumber: string;
    quantity: number;
    expiryDate?: string;
  }[];
  stockStatus?: {
    isLow: boolean;
    currentQuantity: number;
    threshold: number;
  };
}