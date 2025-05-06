import { get, post, put, del } from './apiClient';

interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  unit: string;
  supplier_id: string;
  status: 'active' | 'inactive';
  supplier?: {
    id: string;
    name: string;
  };
}

interface ProductResponse {
  status: string;
  data: Product;
}

interface ProductsListResponse {
  products: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ProductCreateRequest {
  name: string;
  description: string;
  base_price: number;
  unit: string;
  supplier_id: string;
  status?: 'active' | 'inactive';
}

interface ProductUpdateRequest {
  name?: string;
  description?: string;
  base_price?: number;
  unit?: string;
  status?: 'active' | 'inactive';
}

/**
 * Service for handling product-related API calls
 */
const productService = {
  /**
   * Get all products with pagination and filtering
   */
  getProducts: async (
    params: {
      page?: number;
      limit?: number;
      supplier_id?: string;
      status?: string;
    } = {}
  ): Promise<ProductsListResponse> => {
    const response = await get<ProductsListResponse>('/products', { params });
    return response.data;
  },

  /**
   * Get a single product by ID
   */
  getProductById: async (id: string): Promise<ProductResponse> => {
    const response = await get<ProductResponse>(`/products/${id}`);
    return response.data;
  },

  /**
   * Create a new product (suppliers only)
   */
  createProduct: async (productData: ProductCreateRequest): Promise<ProductResponse> => {
    const response = await post<ProductResponse>('/products', productData);
    return response.data;
  },

  /**
   * Update an existing product (suppliers only)
   */
  updateProduct: async (id: string, productData: ProductUpdateRequest): Promise<ProductResponse> => {
    const response = await put<ProductResponse>(`/products/${id}`, productData);
    return response.data;
  },

  /**
   * Delete a product (suppliers only)
   */
  deleteProduct: async (id: string): Promise<any> => {
    const response = await del<any>(`/products/${id}`);
    return response.data;
  }
};

export default productService;