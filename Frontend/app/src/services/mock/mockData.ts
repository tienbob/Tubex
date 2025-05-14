import { v4 as uuidv4 } from 'uuid';

// Helper functions
const randomDate = (start = new Date(2023, 0, 1), end = new Date()) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
};

const randomStatus = <T extends string>(statuses: T[]): T => {
  return statuses[Math.floor(Math.random() * statuses.length)];
};

const randomPrice = (min = 10, max = 1000) => {
  return Math.floor(Math.random() * (max - min + 1) + min) / 100;
};

const randomInteger = (min = 1, max = 100) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

// Auth Mock Data
export const authMockData = {
  currentUser: {
    userId: "user-1234",
    companyId: "company-5678",
    email: "demo@example.com",
    role: "admin",
    status: "active",
    firstName: "Demo",
    lastName: "User"
  },
  login: {
    status: "success",
    data: {
      userId: "user-1234",
      companyId: "company-5678",
      accessToken: "mock-access-token-very-long-string",
      refreshToken: "mock-refresh-token-very-long-string",
      email: "demo@example.com",
      role: "admin",
      status: "active",
      firstName: "Demo",
      lastName: "User"
    }
  },
  register: {
    status: "success",
    data: {
      userId: "user-1234",
      companyId: "company-5678",
      accessToken: "mock-access-token-very-long-string",
      refreshToken: "mock-refresh-token-very-long-string",
      message: "Registration successful",
      email: "demo@example.com"
    }
  },
  refreshToken: {
    status: "success",
    data: {
      accessToken: "mock-new-access-token-very-long-string",
      refreshToken: "mock-new-refresh-token-very-long-string"
    }
  }
};

// Product Mock Data
export const productMockData = {
  products: Array(30).fill(null).map((_, index) => ({
    id: uuidv4(),
    name: `Product ${index + 1}`,
    description: `Description for product ${index + 1}. This is a mock product description.`,
    base_price: randomPrice(1000, 100000),
    unit: randomStatus(['pcs', 'kg', 'box', 'set']),
    supplier_id: `supplier-${randomInteger(1, 5)}`,
    status: randomStatus(['active', 'inactive', 'out_of_stock']),
    created_at: randomDate(),
    updated_at: randomDate(),
    sku: `SKU-${index + 1000}`,
    dimensions: {
      length: randomInteger(1, 100),
      width: randomInteger(1, 50),
      height: randomInteger(1, 30)
    },
    inventory: {
      quantity: randomInteger(0, 200),
      lowStockThreshold: 10
    },
    images: [
      `https://picsum.photos/id/${index + 10}/200/200`,
      `https://picsum.photos/id/${index + 20}/200/200`
    ],
    specifications: {
      color: randomStatus(['Red', 'Blue', 'Green', 'Black', 'White']),
      material: randomStatus(['Plastic', 'Metal', 'Wood', 'Fabric', 'Composite']),
      weight: `${randomInteger(1, 50)} kg`
    }
  })),
  categories: [
    { id: "cat-1", name: "Electronics" },
    { id: "cat-2", name: "Furniture" },
    { id: "cat-3", name: "Clothing" },
    { id: "cat-4", name: "Tools" },
    { id: "cat-5", name: "Office Supplies" }
  ],
  suppliers: [
    { id: "supplier-1", name: "Tech Supplies Co.", email: "contact@techsupplies.com" },
    { id: "supplier-2", name: "Office Essentials", email: "info@officeessentials.com" },
    { id: "supplier-3", name: "Industrial Tools Ltd", email: "sales@industrialtools.com" },
    { id: "supplier-4", name: "Furniture Warehouse", email: "orders@furniturewarehouse.com" },
    { id: "supplier-5", name: "Fashion Distributors", email: "wholesale@fashiondist.com" }
  ]
};

// Order Mock Data
export const orderMockData = {
  orders: Array(20).fill(null).map((_, index) => {
    const itemCount = randomInteger(1, 5);
    const items = Array(itemCount).fill(null).map((_, itemIndex) => {
      const productId = productMockData.products[randomInteger(0, 29)].id;
      const quantity = randomInteger(1, 10);
      const unitPrice = randomPrice(1000, 10000);
      return {
        productId,
        quantity,
        unitPrice,
        discount: Math.random() > 0.7 ? randomInteger(5, 20) : 0,
        product: {
          id: productId,
          name: `Product ${itemIndex + 1}`,
          description: `Description for item ${itemIndex + 1}`,
          base_price: unitPrice
        }
      };
    });

    const totalAmount = items.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100)), 0);

    return {
      id: `order-${1000 + index}`,
      customerId: `customer-${randomInteger(1, 10)}`,
      status: randomStatus(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
      paymentStatus: randomStatus(['pending', 'paid', 'failed', 'refunded']),
      paymentMethod: randomStatus(['credit_card', 'bank_transfer', 'paypal', 'cash_on_delivery']),
      totalAmount,
      createdAt: randomDate(),
      updatedAt: randomDate(),
      items,
      deliveryAddress: {
        street: `${randomInteger(1, 999)} Main Street`,
        city: randomStatus(['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix']),
        state: randomStatus(['NY', 'CA', 'IL', 'TX', 'AZ']),
        zipCode: `${randomInteger(10000, 99999)}`,
        country: 'USA'
      },
      metadata: {
        lastUpdated: randomDate(),
        updatedBy: randomStatus(['system', 'user-1234', 'user-5678']),
        previousStatus: randomStatus(['pending', 'confirmed', 'processing', 'shipped']),
        notes: Math.random() > 0.7 ? 'Customer requested express shipping' : ''
      }
    };
  })
};

// Inventory Mock Data
export const inventoryMockData = {
  inventoryItems: productMockData.products.map(product => ({
    id: `inventory-${product.id}`,
    productId: product.id,
    warehouseId: `warehouse-${randomInteger(1, 3)}`,
    quantity: randomInteger(0, 200),
    locationCode: `AISLE-${randomInteger(1, 10)}-SHELF-${randomInteger(1, 20)}-BIN-${randomInteger(1, 5)}`,
    status: product.status,
    lastUpdated: randomDate(),
    lowStockThreshold: 10,
    optimumStock: randomInteger(50, 150),
    batchInfo: Array(randomInteger(1, 3)).fill(null).map((_, i) => ({
      batchId: `batch-${product.id}-${i}`,
      quantity: randomInteger(1, 50),
      expiryDate: randomDate(new Date(), new Date(2026, 11, 31)),
      receivedDate: randomDate(new Date(2022, 0, 1), new Date())
    }))
  }))
};

// Warehouse Mock Data
export const warehouseMockData = {
  warehouses: [
    {
      id: "warehouse-1",
      name: "Main Warehouse",
      location: {
        address: "123 Main Street",
        city: "Chicago",
        state: "IL",
        zipCode: "60007",
        country: "USA"
      },
      capacity: 10000,
      utilizationPercentage: 76,
      managerId: "user-5678",
      status: "active"
    },
    {
      id: "warehouse-2",
      name: "East Coast Distribution Center",
      location: {
        address: "456 Commerce Ave",
        city: "Boston",
        state: "MA",
        zipCode: "02108",
        country: "USA"
      },
      capacity: 8000,
      utilizationPercentage: 62,
      managerId: "user-9012",
      status: "active"
    },
    {
      id: "warehouse-3",
      name: "West Coast Fulfillment Center",
      location: {
        address: "789 Industry Blvd",
        city: "Los Angeles",
        state: "CA",
        zipCode: "90001",
        country: "USA"
      },
      capacity: 12000,
      utilizationPercentage: 45,
      managerId: "user-3456",
      status: "active"
    }
  ]
};

// User Management Mock Data
export const userMockData = {
  users: [
    {
      id: "user-1234",
      email: "demo@example.com",
      firstName: "Demo",
      lastName: "User",
      role: "admin",
      companyId: "company-5678",
      status: "active",
      createdAt: randomDate(new Date(2022, 0, 1)),
      lastLogin: randomDate(),
      permissions: ["all"]
    },
    {
      id: "user-5678",
      email: "manager@example.com",
      firstName: "Warehouse",
      lastName: "Manager",
      role: "manager",
      companyId: "company-5678",
      status: "active",
      createdAt: randomDate(new Date(2022, 0, 1)),
      lastLogin: randomDate(),
      permissions: ["inventory.read", "inventory.write", "orders.read", "orders.write"]
    },
    {
      id: "user-9012",
      email: "staff@example.com",
      firstName: "Staff",
      lastName: "Member",
      role: "staff",
      companyId: "company-5678",
      status: "active",
      createdAt: randomDate(new Date(2022, 0, 1)),
      lastLogin: randomDate(),
      permissions: ["inventory.read", "orders.read"]
    }
  ],
  companies: [
    {
      id: "company-5678",
      name: "Demo Company",
      type: "dealer",
      status: "active",
      taxId: "123456789",
      businessLicense: "BL123456",
      address: {
        street: "100 Corporate Drive",
        city: "New York",
        province: "NY",
        postalCode: "10001",
        country: "USA"
      },
      businessCategory: "Retail",
      employeeCount: 50,
      yearEstablished: 2010,
      contactPhone: "+1-123-456-7890",
      createdAt: randomDate(new Date(2020, 0, 1)),
      verificationStatus: "verified"
    }
  ]
};

// Report Mock Data
export const reportMockData = {
  salesReport: {
    timeRange: "last30Days",
    totalSales: 352845.75,
    totalOrders: 145,
    averageOrderValue: 2433.42,
    dailySales: Array(30).fill(null).map((_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      sales: randomInteger(5000, 20000),
      orders: randomInteger(2, 10)
    })),
    topProducts: Array(5).fill(null).map((_, i) => ({
      productId: productMockData.products[i].id,
      productName: productMockData.products[i].name,
      unitsSold: randomInteger(10, 100),
      revenue: randomInteger(5000, 50000)
    }))
  },
  inventoryReport: {
    totalItems: 3240,
    lowStockItems: 17,
    outOfStockItems: 5,
    valueOfInventory: 724560.50,
    inventoryTurnover: 4.2,
    averageDaysToSell: 24,
    warehouseUtilization: [
      {
        warehouseId: "warehouse-1",
        name: "Main Warehouse",
        utilizationPercentage: 76,
        itemCount: 1230
      },
      {
        warehouseId: "warehouse-2",
        name: "East Coast Distribution Center",
        utilizationPercentage: 62,
        itemCount: 980
      },
      {
        warehouseId: "warehouse-3",
        name: "West Coast Fulfillment Center",
        utilizationPercentage: 45,
        itemCount: 1030
      }
    ]
  }
};

// Combined mock data
export const mockData = {
  auth: authMockData,
  products: productMockData,
  orders: orderMockData,
  inventory: inventoryMockData,
  warehouses: warehouseMockData,
  users: userMockData,
  reports: reportMockData
};

export default mockData;
