import { AxiosInstance } from 'axios';
import mockData from './mockData';
import './types'; // Import the type definitions

// Global toggle flag for enabling/disabling mock API
// Default to false to use the real API
let isMockEnabled = false;

// Function to toggle mock API
export const toggleMockApi = (enable: boolean): void => {
  isMockEnabled = enable;
  console.log(`Mock API is now ${enable ? 'enabled' : 'disabled'}`);
};

// Create a mock interceptor for Axios
export const setupMockApi = (apiClient: AxiosInstance): void => {
  // Setup request interceptor for mocking
  apiClient.interceptors.request.use(
    async (config) => {
      if (!isMockEnabled) {
        return config;
      }
      
      // Clone the config for mock processing
      const mockConfig = { ...config };
      
      console.log(`[MOCK] Request: ${config.method?.toUpperCase()} ${config.url}`);
      
      // Remove the adapter so that the request doesn't actually get sent
      mockConfig.adapter = async () => {
        // Parse the request URL to get the endpoint
        const url = config.url || '';
        const method = config.method?.toLowerCase() || 'get';
        
        // Add debug log to confirm interception
        console.log(`[MOCK] Intercepted request: ${method.toUpperCase()} ${url}`);

        // Mock response based on the URL and method
        try {
          const response = await handleMockRequest(url, method, config.data, config.params);
          console.log(`[MOCK] Response for ${method.toUpperCase()} ${url}:`, response);
          
          // Return a mock Axios response
          return {
            data: response,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: mockConfig,
            request: {}
          };        } catch (error: any) {
          const errorResponse = {
            status: error.status || 500,
            data: {
              status: 'error',
              message: error.message || 'Mock API Error',
              data: error.data || null
            }
          };
          
          console.error(`[MOCK] Error for ${method.toUpperCase()} ${url}:`, errorResponse);
          
          return Promise.reject({
            response: errorResponse,
            config: mockConfig,
            request: {}
          });
        }
      };
      
      return mockConfig;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  
  // Function to handle mock requests and return appropriate responses
  const handleMockRequest = async (url: string, method: string, data: any, params: any): Promise<any> => {
    // Auth endpoints
    if (url.includes('/login') && method === 'post') {
      // Add debug log for login mock response
      console.log(`[MOCK] Handling login request with data:`, data);
      const { email, password } = data;
      if (email && password) {
        console.log(`[MOCK] Returning mock login response`);
        return mockData.auth.login;
      } else {        console.error(`[MOCK] Login request missing email or password`);
        throw new Error('Email and password are required');
      }
    }
      if (url.includes('/auth/register') && method === 'post') {
      console.log(`[MOCK] Handling registration request with data:`, data);
      // Generate unique IDs for the user and company
      const userId = `user-${Date.now()}`;
      const companyId = `company-${Date.now()}`;
      
      // Create a more realistic response based on the input data
      const response = {
        status: "success",
        data: {
          userId: userId,
          companyId: companyId,
          accessToken: "mock-access-token-" + Date.now(),
          refreshToken: "mock-refresh-token-" + Date.now(),
          message: "Registration successful",
          email: data.email || "demo@example.com",
          firstName: data.firstName || "Demo",
          lastName: data.lastName || "User"
        }
      };
      
      // Store the mock company and user data in memory
      // This would be lost on page refresh but works for the current session
      if (!window.mockDatabase) {
        window.mockDatabase = { users: [], companies: [] };
      }
      
      // Create mock company record
      if (data.company) {
        window.mockDatabase.companies.push({
          id: companyId,
          ...data.company,
          created_at: new Date().toISOString(),
          status: 'pending_verification'
        });
      }
      
      // Create mock user record
      window.mockDatabase.users.push({
        id: userId,
        email: data.email,
        companyId: companyId,
        role: 'admin',
        status: 'pending',
        firstName: data.firstName,
        lastName: data.lastName,
        created_at: new Date().toISOString()
      });
      
      console.log(`[MOCK] Created mock user and company:`, window.mockDatabase);
      return response;
    }
    
    if (url.includes('/auth/refresh-token') && method === 'post') {
      return mockData.auth.refreshToken;
    }
    
    if (url.includes('/auth/me') && method === 'get') {
      return { status: 'success', data: mockData.auth.currentUser };
    }
    
    // Products endpoints
    if (url.includes('/products') && !url.includes('/products/')) {
      if (method === 'get') {
        const page = parseInt(params?.page || '1');
        const limit = parseInt(params?.limit || '10');        const search = params?.search;
        const status = params?.status;
        
        let filteredProducts = [...mockData.products.products];
        
        // Apply filters
        if (search) {
          const searchLower = search.toLowerCase();
          filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchLower) || 
            p.description.toLowerCase().includes(searchLower)
          );
        }
        
        if (status) {
          filteredProducts = filteredProducts.filter(p => p.status === status);
        }
        
        // Paginate results
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedProducts = filteredProducts.slice(start, end);
        
        return {
          status: 'success',
          data: {
            products: paginatedProducts,
            pagination: {
              total: filteredProducts.length,
              page,
              limit,
              pages: Math.ceil(filteredProducts.length / limit)
            }
          }
        };
      }
      
      if (method === 'post') {
        // Create new product
        const newProduct = {
          id: `product-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'active',
          ...data
        };
        
        return { status: 'success', data: newProduct };
      }
    }
    
    if (url.match(/\/products\/[^/]+$/) && method === 'get') {
      const productId = url.split('/').pop();
      const product = mockData.products.products.find(p => p.id === productId);
        if (product) {
        return { status: 'success', data: product };
      } else {
        throw new Error('Product not found');
      }
    }
    
    if (url.match(/\/products\/[^/]+$/) && method === 'put') {
      const productId = url.split('/').pop();
      const productIndex = mockData.products.products.findIndex(p => p.id === productId);
      
      if (productIndex !== -1) {
        const updatedProduct = {
          ...mockData.products.products[productIndex],
          ...data,
          updated_at: new Date().toISOString()
        };
          return { status: 'success', data: updatedProduct };
      } else {
        throw new Error('Product not found');
      }
    }
    
    if (url.match(/\/products\/[^/]+$/) && method === 'delete') {
      const productId = url.split('/').pop();
      const productExists = mockData.products.products.some(p => p.id === productId);
        if (productExists) {
        return { status: 'success', data: { message: 'Product deleted successfully' } };
      } else {
        throw new Error('Product not found');
      }
    }
    
    // Orders endpoints
    if (url.includes('/orders') && !url.includes('/orders/')) {
      if (method === 'get') {
        const page = parseInt(params?.page || '1');
        const limit = parseInt(params?.limit || '10');
        const status = params?.status;
        
        let filteredOrders = [...mockData.orders.orders];
        
        // Apply filters
        if (status) {
          filteredOrders = filteredOrders.filter(o => o.status === status);
        }
        
        // Paginate results
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedOrders = filteredOrders.slice(start, end);
        
        return {
          status: 'success',
          data: {
            orders: paginatedOrders,
            pagination: {
              total: filteredOrders.length,
              page,
              limit,
              pages: Math.ceil(filteredOrders.length / limit)
            }
          }
        };
      }
      
      if (method === 'post') {
        // Create new order
        const newOrder = {
          id: `order-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'pending',
          ...data
        };
        
        return { status: 'success', data: newOrder };
      }
    }
    
    if (url.match(/\/orders\/[^/]+$/) && method === 'get') {
      const orderId = url.split('/').pop();
      const order = mockData.orders.orders.find(o => o.id === orderId);
        if (order) {
        return { status: 'success', data: order };
      } else {
        throw new Error('Order not found');
      }
    }
    
    if (url.match(/\/orders\/[^/]+$/) && method === 'patch') {
      const orderId = url.split('/').pop();
      const orderIndex = mockData.orders.orders.findIndex(o => o.id === orderId);
      
      if (orderIndex !== -1) {
        const updatedOrder = {
          ...mockData.orders.orders[orderIndex],
          ...data,
          updatedAt: new Date().toISOString()
        };
          return { status: 'success', data: updatedOrder };
      } else {
        throw new Error('Order not found');
      }
    }
    
    // Inventory endpoints
    if (url.includes('/inventory') && !url.includes('/inventory/')) {
      if (method === 'get') {
        const page = parseInt(params?.page || '1');
        const limit = parseInt(params?.limit || '10');
        const warehouseId = params?.warehouseId;
        
        let filteredItems = [...mockData.inventory.inventoryItems];
        
        // Apply filters
        if (warehouseId) {
          filteredItems = filteredItems.filter(item => item.warehouseId === warehouseId);
        }
        
        // Paginate results
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedItems = filteredItems.slice(start, end);
        
        return {
          status: 'success',
          data: {
            inventoryItems: paginatedItems,
            pagination: {
              total: filteredItems.length,
              page,
              limit,
              pages: Math.ceil(filteredItems.length / limit)
            }
          }
        };
      }
    }
    
    // Warehouse endpoints
    if (url.includes('/warehouses') && !url.includes('/warehouses/')) {
      if (method === 'get') {
        return { 
          status: 'success', 
          data: { 
            warehouses: mockData.warehouses.warehouses 
          } 
        };
      }
    }
    
    // User management endpoints
    if (url.includes('/users') && !url.includes('/users/')) {
      if (method === 'get') {
        const page = parseInt(params?.page || '1');
        const limit = parseInt(params?.limit || '10');
        
        let filteredUsers = [...mockData.users.users];
        
        // Paginate results
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedUsers = filteredUsers.slice(start, end);
        
        return {
          status: 'success',
          data: {
            users: paginatedUsers,
            pagination: {
              total: filteredUsers.length,
              page,
              limit,
              pages: Math.ceil(filteredUsers.length / limit)
            }
          }
        };
      }
    }
    
    // Reports endpoints
    if (url.includes('/reports/sales')) {
      return { status: 'success', data: mockData.reports.salesReport };
    }
    
    if (url.includes('/reports/inventory')) {
      return { status: 'success', data: mockData.reports.inventoryReport };
    }
      // Default case - endpoint not mocked
    throw new Error(`Mock API endpoint not found: ${method.toUpperCase()} ${url}`);
  };
};

// Export a function that will enable the mock API
export const enableMockApi = (apiClient: AxiosInstance): void => {
  setupMockApi(apiClient);
  console.log('Mock API has been initialized and enabled');
};

// Export a toggle function for the mock API
export let isMockApiEnabled = false;

// Using the previously defined toggleMockApi function
