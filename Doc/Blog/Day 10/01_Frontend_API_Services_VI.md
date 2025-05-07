# Triển Khai Dịch Vụ API Frontend An Toàn Kiểu với GitHub Copilot: Phương Pháp của Tubex

## Giới Thiệu

Sau khi thiết lập thư viện component của chúng tôi, chúng tôi cần một cách mạnh mẽ để kết nối frontend React với các dịch vụ backend. Bài viết này mô tả chi tiết cách chúng tôi tận dụng GitHub Copilot để xây dựng dịch vụ API hiệu quả, an toàn kiểu cho frontend Tubex, đảm bảo giao tiếp liền mạch giữa các lớp frontend và backend.

## Vai Trò của GitHub Copilot trong Phát Triển Dịch Vụ API

### 1. Kiến Trúc API Client
Chúng tôi bắt đầu bằng cách yêu cầu Copilot giúp thiết kế kiến trúc API client của chúng tôi:

**Ví Dụ Prompt:**
```
"Thiết kế một kiến trúc API client có khả năng mở rộng cho ứng dụng React có:
- Cung cấp an toàn kiểu cho request và response
- Xử lý xác thực và quản lý token
- Triển khai interceptor request/response
- Quản lý xử lý lỗi nhất quán
- Hỗ trợ hủy request
Bao gồm interface TypeScript và cấu trúc dịch vụ."
```

Copilot đã tạo ra một đề xuất kiến trúc toàn diện bao gồm:
- Cấu hình API client cơ sở
- Quản lý token xác thực
- Xử lý request/response an toàn kiểu
- Chiến lược phân loại lỗi
- Mẫu hủy request

### 2. Triển Khai Dịch Vụ An Toàn Kiểu
Đối với mỗi dịch vụ backend, chúng tôi sử dụng các prompt có mục tiêu:

**Ví Dụ - User Service:**
```
"Tạo một UserService an toàn kiểu trong TypeScript có:
- Xử lý xác thực (đăng nhập, đăng ký, đặt lại mật khẩu)
- Quản lý hồ sơ người dùng
- Hỗ trợ tìm kiếm và lọc người dùng
- Triển khai các hoạt động quản lý vai trò
- Cung cấp quản lý người dùng công ty

Sử dụng axios với kiểu TypeScript phù hợp cho request và response."
```

Copilot đã tạo ra các triển khai dịch vụ đầy đủ với:
- Phương thức API an toàn kiểu
- Xử lý lỗi phù hợp
- Kiểu request/response
- Tài liệu và ví dụ sử dụng

### 3. Xử Lý Lỗi & Logic Thử Lại
Chúng tôi đã sử dụng Copilot để triển khai xử lý lỗi tinh vi:

**Ví Dụ Prompt:**
```
"Triển khai một hệ thống xử lý lỗi API toàn diện với:
- Phân loại lỗi (network, auth, validation, server)
- Tự động làm mới token khi gặp lỗi 401
- Logic thử lại cho lỗi mạng
- Định dạng lỗi nhất quán để hiển thị UI
- Phát hiện offline và khôi phục
Bao gồm triển khai TypeScript với Axios."
```

## Các Thành Phần Chính Được Xây Dựng với Sự Hỗ Trợ AI

### 1. API Client Cốt Lõi
GitHub Copilot giúp triển khai một API client cơ sở mạnh mẽ:

```typescript
// API client cơ sở với TypeScript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { TokenService } from './tokenService';

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class ApiClient {
  private axiosInstance: AxiosInstance;
  private tokenService: TokenService;

  constructor(config: ApiClientConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    this.tokenService = new TokenService();
    
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Interceptor request cho header xác thực
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.tokenService.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor response cho xử lý lỗi
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Xử lý làm mới token cho lỗi 401
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await this.tokenService.refreshToken();
            const token = this.tokenService.getAccessToken();
            this.axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            // Làm mới token thất bại, chuyển hướng đến đăng nhập
            this.tokenService.clearTokens();
            // Logic chuyển hướng tại đây
            return Promise.reject(refreshError);
          }
        }
        
        // Chuyển đổi lỗi để xử lý nhất quán
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private handleApiError(error: AxiosError): ApiError {
    // Logic chuyển đổi lỗi API
    // Được tạo bởi GitHub Copilot
  }

  // Phương thức request an toàn kiểu
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  async post<T, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  async put<T, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }
}
```

### 2. Dịch Vụ Theo Miền Cụ Thể
Copilot giúp tạo các module dịch vụ cho từng miền:

```typescript
// Ví dụ về dịch vụ sản phẩm
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  supplierId: string;
  status: 'active' | 'archived' | 'draft';
  // Các thuộc tính sản phẩm khác
}

export interface ProductFilter {
  search?: string;
  category?: string;
  supplier?: string;
  status?: 'active' | 'archived' | 'draft';
  priceMin?: number;
  priceMax?: number;
  page?: number;
  pageSize?: number;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class ProductService {
  private apiClient: ApiClient;
  
  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }
  
  async getProducts(filter: ProductFilter): Promise<ProductListResponse> {
    return this.apiClient.get<ProductListResponse>('/products', { 
      params: filter 
    });
  }
  
  async getProductById(id: string): Promise<Product> {
    return this.apiClient.get<Product>(`/products/${id}`);
  }
  
  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    return this.apiClient.post<Product>('/products', product);
  }
  
  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    return this.apiClient.put<Product>(`/products/${id}`, product);
  }
  
  async deleteProduct(id: string): Promise<void> {
    return this.apiClient.delete<void>(`/products/${id}`);
  }
}
```

### 3. Tích Hợp React Query
Chúng tôi đã sử dụng Copilot để tích hợp React Query cho quản lý trạng thái:

```typescript
// Hooks cho dịch vụ sản phẩm với React Query
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ProductService, Product, ProductFilter } from './productService';

export const useProducts = (filter: ProductFilter) => {
  const productService = new ProductService(apiClient);
  
  return useQuery(
    ['products', filter],
    () => productService.getProducts(filter),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 phút
    }
  );
};

export const useProduct = (id: string) => {
  const productService = new ProductService(apiClient);
  
  return useQuery(
    ['product', id],
    () => productService.getProductById(id),
    {
      enabled: !!id,
    }
  );
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const productService = new ProductService(apiClient);
  
  return useMutation(
    (product: Omit<Product, 'id'>) => productService.createProduct(product),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
      },
    }
  );
};

// Hooks bổ sung cho các hoạt động cập nhật và xóa
```

## Chiến Lược Prompt Hiệu Quả cho Dịch Vụ API

### 1. Tạo Định Nghĩa Kiểu

**Prompt Hiệu Quả:**
```
"Tạo interface TypeScript cho response API dựa trên các mẫu JSON response này:
[Bao gồm mẫu JSON response từ API của bạn]

Tạo interface mà:
- Sử dụng các kiểu TypeScript phù hợp
- Bao gồm thuộc tính tùy chọn khi thích hợp
- Thêm comment JSDoc giải thích từng thuộc tính
- Xử lý đối tượng lồng nhau và mảng
- Sử dụng quy ước đặt tên nhất quán"
```

Điều này đã tạo ra các định nghĩa kiểu toàn diện khớp hoàn hảo với response API của chúng tôi, cải thiện an toàn kiểu trên toàn bộ ứng dụng.

### 2. Cơ Sở Hạ Tầng Xử Lý Lỗi

**Prompt Hiệu Quả:**
```
"Tạo một hệ thống xử lý lỗi toàn diện cho các request API có:
- Phân loại lỗi (mạng, xác thực, ủy quyền, xác thực, máy chủ)
- Chuyển đổi response lỗi thành thông báo thân thiện với người dùng
- Cung cấp đối tượng lỗi có kiểu với bối cảnh bổ sung
- Bao gồm logic thử lại cho lỗi tạm thời
- Xử lý kịch bản ngoại tuyến

Sử dụng TypeScript với union phân biệt cho kiểu lỗi."
```

Copilot đã tạo ra một hệ thống xử lý lỗi mạnh mẽ cải thiện đáng kể trải nghiệm người dùng khi xử lý lỗi API.

### 3. Tích Hợp Luồng Xác Thực

**Prompt Hiệu Quả:**
```
"Triển khai một luồng xác thực hoàn chỉnh với:
- Chức năng đăng nhập/đăng xuất
- Lưu trữ token trong cookie bảo mật
- Làm mới token tự động
- Xử lý hết hạn phiên
- Xử lý route được bảo vệ trong React Router

Bao gồm kiểu TypeScript và triển khai React context."
```

## Điểm Nổi Bật của Triển Khai

### 1. Tổ Chức Lớp API
Copilot giúp chúng tôi cấu trúc lớp API để dễ bảo trì:

```
src/
  services/
    api/
      apiClient.ts         # API client cơ sở
      tokenService.ts      # Quản lý token
      errorHandling.ts     # Xử lý lỗi
      apiTypes.ts          # Định nghĩa kiểu chung
      auth/                # Dịch vụ xác thực
        authService.ts
        authHooks.ts
      products/            # Dịch vụ sản phẩm
        productService.ts
        productHooks.ts
      orders/              # Dịch vụ đơn hàng
        orderService.ts
        orderHooks.ts
      // Các dịch vụ miền khác
```

### 2. Hủy Request
Chúng tôi đã triển khai hủy request tự động với sự hướng dẫn của Copilot:

```typescript
// Hook cho request có thể hủy
export function useCancellableQuery<T>(
  queryKey: string | unknown[],
  queryFn: (signal: AbortSignal) => Promise<T>,
  options?: UseQueryOptions<T>
) {
  return useQuery<T>(
    queryKey,
    ({ signal }) => queryFn(signal),
    options
  );
}

// Ví dụ sử dụng
const { data, isLoading } = useCancellableQuery(
  ['products', filter],
  (signal) => productService.getProducts(filter, { signal })
);
```

### 3. Hệ Thống Mock API cho Phát Triển
Copilot đã giúp tạo một hệ thống mock tinh vi cho phát triển:

```typescript
// Ví dụ mock dịch vụ
export class MockProductService implements IProductService {
  private products: Product[] = [/* Dữ liệu mock ban đầu */];
  
  async getProducts(filter: ProductFilter): Promise<ProductListResponse> {
    // Lọc, phân trang và trả về dữ liệu mock
    // Triển khai được tạo bởi GitHub Copilot
  }
  
  // Các phương thức CRUD khác với triển khai mock
}

// Provider dịch vụ mock
export const ApiServiceContext = createContext<ApiServices | null>(null);

export const ApiServiceProvider: React.FC<{
  children: React.ReactNode;
  useMocks?: boolean;
}> = ({ children, useMocks = false }) => {
  // Tạo dịch vụ thực hoặc mock dựa trên cờ useMocks
  // Triển khai được tạo bởi GitHub Copilot
};
```

## Thách Thức và Giải Pháp Hỗ Trợ AI

### 1. Suy Luận Kiểu Response API
**Thách thức**: Duy trì kiểu nhất quán giữa response API và model frontend.
**Giải pháp**: Copilot đề xuất một phương pháp tạo code:

```typescript
// Tiện ích tạo kiểu tạo interface TypeScript từ response API
const generateTypesFromResponse = (response: any, name: string): string => {
  // Logic tạo kiểu
  // Được tạo bởi GitHub Copilot
};
```

### 2. Định Tuyến API Đa Người Thuê
**Thách thức**: Hỗ trợ các điểm cuối API khác nhau cho các người thuê khác nhau.
**Giải pháp**: Copilot triển khai một API client nhận biết người thuê:

```typescript
// Factory API client nhận biết người thuê
export const createApiClient = (tenantId: string): ApiClient => {
  const config: ApiClientConfig = {
    baseURL: `${API_BASE_URL}/api/v1/${tenantId}`,
    // Cấu hình khác
  };
  
  return new ApiClient(config);
};
```

### 3. Hỗ Trợ Offline
**Thách thức**: Xử lý kịch bản offline một cách nhẹ nhàng.
**Giải pháp**: Copilot tạo một hệ thống hàng đợi offline:

```typescript
// Hàng đợi request offline
export class OfflineRequestQueue {
  private queue: OfflineRequest[] = [];
  
  addRequest(request: OfflineRequest): void {
    this.queue.push(request);
    this.persistQueue();
  }
  
  async processQueue(): Promise<ProcessResult> {
    // Xử lý request trong hàng đợi khi trở lại online
    // Triển khai được tạo bởi GitHub Copilot
  }
  
  // Các phương thức quản lý hàng đợi khác
}
```

## Kết Quả và Tác Động

### 1. Hiệu Quả Phát Triển
- Tích hợp API nhanh hơn 65%
- An toàn kiểu trên toàn bộ lớp API
- Mẫu xử lý lỗi nhất quán
- Độ bao phủ kiểm thử tự động cho dịch vụ API

### 2. Hiệu Suất Runtime
- Fetch dữ liệu được tối ưu hóa với bộ nhớ đệm
- Giảm re-render không cần thiết
- Cải thiện khôi phục lỗi
- Trải nghiệm offline tốt hơn

### 3. Khả Năng Bảo Trì
- Mẫu dịch vụ nhất quán trên các miền
- Tách biệt rõ ràng các mối quan tâm
- Interface API được tài liệu hóa tốt
- Triển khai dịch vụ có thể kiểm thử

## Bài Học Kinh Nghiệm

### 1. Cộng Tác Hiệu Quả với Copilot
- Cung cấp mẫu response API cho việc tạo kiểu chính xác
- Chia nhỏ luồng API phức tạp thành các phần có thể quản lý
- Chỉ định rõ ràng yêu cầu xử lý lỗi
- Bao gồm trường hợp biên thực tế trong prompt của bạn

### 2. Thực Hành Tốt Nhất cho Dịch Vụ API
- Sử dụng interface TypeScript cho tất cả hợp đồng API
- Triển khai xử lý lỗi nhất quán trên tất cả dịch vụ
- Tập trung xác thực và chuẩn bị request
- Thiết kế cho offline-first khi thích hợp

## Cải Tiến Trong Tương Lai

Với sự hỗ trợ liên tục của GitHub Copilot, chúng tôi dự định:
1. Triển khai cập nhật thời gian thực với WebSockets
2. Cải thiện chiến lược bộ nhớ đệm response
3. Thêm theo dõi phân tích và hiệu suất
4. Nâng cao khả năng offline

## Kết Luận

GitHub Copilot đã đẩy nhanh đáng kể việc phát triển dịch vụ API frontend của chúng tôi, cho phép chúng tôi tạo ra một lớp giao tiếp mạnh mẽ, an toàn kiểu giữa frontend React và dịch vụ backend của chúng tôi. Bằng cách sử dụng sự hỗ trợ AI trong suốt quá trình phát triển, chúng tôi đã xây dựng một lớp API:
- Hoàn toàn an toàn kiểu với hỗ trợ TypeScript toàn diện
- Linh hoạt với xử lý lỗi tinh vi
- Hiệu suất với bộ nhớ đệm và tối ưu hóa request phù hợp
- Dễ bảo trì với các mẫu nhất quán trên tất cả các miền

Lớp dịch vụ API này hiện cung cấp một nền tảng vững chắc cho tất cả giao tiếp frontend-to-backend trong nền tảng Tubex của chúng tôi.