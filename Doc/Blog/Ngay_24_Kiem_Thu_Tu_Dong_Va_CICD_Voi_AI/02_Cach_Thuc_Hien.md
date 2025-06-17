# Cách Thức Hiện: Kiểm Thử Tự Động và CI/CD với AI

## Phương Pháp Prompt Hiệu Quả

### 1. Thiết Kế Chiến Lược Kiểm Thử

**Prompt cho việc chọn framework kiểm thử:**
```
"Tôi cần thiết lập chiến lược kiểm thử cho nền tảng B2B SaaS Tubex:
- Frontend: React + TypeScript + Material-UI
- Backend: Node.js + Express + TypeScript + PostgreSQL
- Kiến trúc Microservices với Docker
- Các module quan trọng: Xác thực, Quản lý tồn kho, Đơn hàng, Thanh toán

Hãy đề xuất:
1. Chiến lược kim tự tháp kiểm thử với tỷ lệ unit/integration/e2e
2. Lựa chọn framework cho mỗi loại kiểm thử
3. Mục tiêu độ phủ mã
4. Cấu trúc tổ chức kiểm thử
5. Cách tiếp cận tích hợp CI/CD"
```

**Mô Hình Phản Hồi của AI:**
- Kiểm Thử Đơn Vị (70%): Jest + React Testing Library
- Kiểm Thử Tích Hợp (20%): Supertest + Test Containers
- Kiểm Thử E2E (10%): Playwright + Docker Compose
- Kiểm Thử Hiệu Suất: Artillery + Kịch bản kiểm tra tải

### 2. Triển Khai Kiểm Thử Đơn Vị

**Prompt cho việc kiểm thử component:**
```
"Generate comprehensive unit tests cho React components sau:
1. WhiteLabelHeader với authentication states
2. ProductForm với validation logic
3. InventoryList với data filtering
4. OrderManagement với status updates

Yêu cầu:
- Hỗ trợ TypeScript
- Giả lập các cuộc gọi API với MSW
- Kiểm tra khả năng tiếp cận
- Kiểm tra biên lỗi
- Kiểm tra hiệu suất với react-testing-library/jest-dom"
```

**Mô Hình Triển Khai Kiểm Thử:**
```tsx
// Ví dụ: WhiteLabelHeader.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import WhiteLabelHeader from '../WhiteLabelHeader';
import { AuthContext } from '../../contexts/AuthContext';
import { defaultTheme } from '../../config/theme';

const renderWithProviders = (component: React.ReactElement, authValue: any) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={defaultTheme}>
        <AuthContext.Provider value={authValue}>
          {component}
        </AuthContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('WhiteLabelHeader', () => {
  const mockAuthValue = {
    isAuthenticated: true,
    user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    logout: jest.fn(),
    loading: false
  };

  it('should render company name and logo', () => {
    renderWithProviders(<WhiteLabelHeader />, mockAuthValue);
    expect(screen.getByText('Tubex')).toBeInTheDocument();
  });

  it('should show user menu when authenticated', async () => {
    renderWithProviders(<WhiteLabelHeader />, mockAuthValue);
    
    const userButton = screen.getByRole('button', { name: /user menu/i });
    fireEvent.click(userButton);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  it('should handle logout flow', async () => {
    renderWithProviders(<WhiteLabelHeader />, mockAuthValue);
    
    const userButton = screen.getByRole('button', { name: /user menu/i });
    fireEvent.click(userButton);
    
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);
    
    await waitFor(() => {
      expect(mockAuthValue.logout).toHaveBeenCalled();
    });
  });
});
```

### 3. Chiến Lược Kiểm Thử Tích Hợp

**Prompt cho việc kiểm thử API:**
```
"Create integration test suite cho Tubex backend APIs:
- Authentication endpoints (/login, /register, /refresh)
- Inventory management (/inventory CRUD operations)
- Order processing (/orders lifecycle)
- User management (/users with RBAC)

Bao gồm:
- Thiết lập/giải phóng cơ sở dữ liệu với Test Containers
- Kiểm thử middleware xác thực
- Các kịch bản xử lý lỗi
- Kiểm tra xác thực đầu vào
- Các khẳng định về hiệu suất"
```

**Mô Hình Kiểm Thử Tích Hợp:**
```typescript
// Ví dụ: inventory.integration.test.ts
import request from 'supertest';
import { app } from '../app';
import { setupTestDatabase, cleanupTestDatabase } from './helpers/database';
import { createTestUser, generateAuthToken } from './helpers/auth';

describe('Inventory API Integration Tests', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    await setupTestDatabase();
    const testUser = await createTestUser({
      email: 'test@tubex.com',
      role: 'admin'
    });
    testUserId = testUser.id;
    authToken = generateAuthToken(testUser);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/inventory', () => {
    it('should create new inventory item', async () => {
      const inventoryData = {
        productId: 'test-product-id',
        warehouseId: 'test-warehouse-id',
        quantity: 100,
        minThreshold: 10
      };

      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send(inventoryData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        quantity: 100,
        minThreshold: 10
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.errors).toContain('productId is required');
    });
  });
});
```

### 4. Triển Khai Kiểm Thử E2E

**Prompt cho các kịch bản E2E:**
```
"Design comprehensive E2E test scenarios cho Tubex platform:

Critical User Journeys:
1. User Registration → Email Verification → First Login
2. Supplier Onboarding → Product Catalog Setup
3. Dealer Registration → Order Placement → Payment
4. Inventory Management → Stock Alerts → Reordering
5. Analytics Dashboard → Report Generation → Export

Technical Requirements:
- Playwright với TypeScript
- Page Object Model pattern
- Quản lý dữ liệu kiểm tra
- Chụp ảnh màn hình khi thất bại
- Khả năng thực thi song song
- Tích hợp CI/CD"
```

**Mô Hình Kiểm Thử E2E:**
```typescript
// Ví dụ: order-placement.e2e.test.ts
import { test, expect, Page } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { OrdersPage } from './pages/OrdersPage';

test.describe('Order Placement Flow', () => {
  let page: Page;
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let productsPage: ProductsPage;
  let ordersPage: OrdersPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    productsPage = new ProductsPage(page);
    ordersPage = new OrdersPage(page);
  });

  test('dealer can place order successfully', async () => {
    // Đăng nhập với tư cách là đại lý
    await loginPage.goto();
    await loginPage.login('dealer@tubex.com', 'password123');
    
    // Điều hướng đến trang sản phẩm
    await dashboardPage.navigateToProducts();
    
    // Thêm sản phẩm vào giỏ hàng
    await productsPage.addProductToCart('Steel Rod 12mm', 50);
    await productsPage.addProductToCart('Cement Bag 50kg', 20);
    
    // Đi đến giỏ hàng và đặt hàng
    await productsPage.goToCart();
    await ordersPage.fillShippingDetails({
      address: '123 Construction Site',
      city: 'Ho Chi Minh City',
      phone: '0901234567'
    });
    
    await ordersPage.selectPaymentMethod('bank_transfer');
    await ordersPage.placeOrder();
    
    // Xác nhận đơn hàng
    await expect(page.locator('.order-success')).toBeVisible();
    const orderNumber = await page.locator('.order-number').textContent();
    expect(orderNumber).toMatch(/ORD-\d{8}/);
  });

  test('should handle out of stock scenarios', async () => {
    await loginPage.goto();
    await loginPage.login('dealer@tubex.com', 'password123');
    
    await dashboardPage.navigateToProducts();
    
    // Thử thêm sản phẩm hết hàng
    await productsPage.addProductToCart('Out of Stock Item', 1);
    
    // Nên hiển thị thông báo lỗi
    await expect(page.locator('.error-message')).toContainText('Item is out of stock');
  });
});
```

### 5. Cấu Hình Pipeline CI/CD

**Prompt cho thiết lập GitHub Actions:**
```
"Create comprehensive GitHub Actions workflow cho Tubex project:

Repository Structure:
- /Frontend (React + TypeScript)
- /Backend (Node.js + TypeScript)
- /Docker (containers và compose files)

Pipeline Requirements:
1. PR workflows: Lint, Test, Build
2. Main branch: Test, Build, Deploy to staging
3. Release tags: Deploy to production
4. Parallel job execution
5. Artifact caching
6. Environment secrets management
7. Deployment rollback capability
8. Slack notifications

Include staging và production environments với different configurations."
```

**Workflow GitHub Actions:**
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  release:
    types: [published]

env:
  NODE_VERSION: '18'
  POSTGRES_VERSION: '14'

jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: Frontend/app/package-lock.json
      
      - name: Install dependencies
        working-directory: Frontend/app
        run: npm ci
      
      - name: Run linting
        working-directory: Frontend/app
        run: npm run lint
      
      - name: Run type checking
        working-directory: Frontend/app
        run: npm run type-check
      
      - name: Run unit tests
        working-directory: Frontend/app
        run: npm run test:coverage
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          directory: Frontend/app/coverage
          flags: frontend
  
  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: tubex_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: Backend/package-lock.json
      
      - name: Install dependencies
        working-directory: Backend
        run: npm ci
      
      - name: Run database migrations
        working-directory: Backend
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/tubex_test
      
      - name: Run unit tests
        working-directory: Backend
        run: npm run test:unit
      
      - name: Run integration tests
        working-directory: Backend
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/tubex_test

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [test-frontend, test-backend]
    if: github.event_name == 'pull_request'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Start application with Docker Compose
        run: |
          docker-compose -f docker-compose.test.yml up -d
          sleep 30
      
      - name: Install Playwright
        run: npx playwright install
      
      - name: Run E2E tests
        run: npx playwright test
        
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  build-and-deploy:
    runs-on: ubuntu-latest
    needs: [test-frontend, test-backend]
    if: github.ref == 'refs/heads/main' || github.event_name == 'release'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: |
          docker build -t tubex-frontend:${{ github.sha }} ./Frontend
          docker build -t tubex-backend:${{ github.sha }} ./Backend
      
      - name: Deploy to staging
        if: github.ref == 'refs/heads/main'
        run: |
          echo "Deploying to staging environment"
          # Add deployment script here
      
      - name: Deploy to production
        if: github.event_name == 'release'
        run: |
          echo "Deploying to production environment"
          # Add production deployment script here
      
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Triển Khai Các Thực Hành Tốt Nhất Về Kiểm Thử

### 1. Quản Lý Dữ Liệu Kiểm Thử
- Mẫu factory cho việc tạo dữ liệu kiểm thử
- Các tập tin cố định cơ sở dữ liệu với dữ liệu thực tế
- Tách biệt môi trường với các container Docker
- Các kịch bản dữ liệu khởi tạo cho việc kiểm thử nhất quán

### 2. Kiểm Thử Hiệu Suất
- Kiểm tra tải với Artillery
- Giám sát hiệu suất truy vấn cơ sở dữ liệu
- Theo dõi kích thước gói frontend
- Khẳng định thời gian phản hồi API

### 3. Kiểm Thử Bảo Mật
- Quét lỗ hổng phụ thuộc
- Kiểm thử bảo mật OWASP
- Kiểm tra luồng xác thực
- Kiểm tra ranh giới ủy quyền

## Quy Trình Thực Hiện

### Giai Đoạn 1: Nền Tảng (1 ngày)
1. Thiết lập các framework và cấu hình kiểm thử
2. Tạo cấu trúc kiểm thử cơ bản và các trợ giúp
3. Triển khai nền tảng pipeline CI
4. Thiết lập cơ sở dữ liệu và môi trường

### Giai Đoạn 2: Triển Khai Kiểm Thử (1.5 ngày)
1. Viết các bài kiểm thử đơn vị toàn diện
2. Triển khai bộ kiểm thử tích hợp
3. Tạo các kịch bản kiểm thử E2E
4. Thiết lập kiểm thử hiệu suất

### Giai Đoạn 3: Tăng Cường CI/CD (0.5 ngày)
1. Tối ưu hóa hiệu suất pipeline
2. Thêm giám sát và thông báo
3. Tích hợp quét bảo mật
4. Tài liệu và đào tạo

## Mẹo Để Prompt Hiệu Quả

1. **Xác định công nghệ sử dụng:** Luôn đề cập đến các phiên bản và framework cụ thể
2. **Bao gồm ngữ cảnh kinh doanh:** Giải thích logic miền để AI hiểu các kịch bản kiểm thử
3. **Yêu cầu các thực hành tốt nhất:** Hỏi về các tiêu chuẩn ngành và mẹo tối ưu hóa
4. **Yêu cầu về hiệu suất:** Xác định thời gian thực hiện và mục tiêu độ phủ
5. **Cân nhắc bảo trì:** Yêu cầu các mẫu kiểm thử bền vững
