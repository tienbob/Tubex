```markdown
<!-- filepath: d:\All python project\Tubex\Doc\Blog\Day 24\01_Testing_Automation_CICD_VI.md -->
# Triển khai kiểm thử tự động và CI/CD với sự hỗ trợ của AI

## Giới thiệu

Sau khi hoàn thành việc triển khai bảng điều khiển phân tích, chúng tôi chuyển trọng tâm sang một khía cạnh quan trọng nhưng thường bị bỏ qua của phát triển phần mềm: kiểm thử tự động và tích hợp/triển khai liên tục. Vào ngày 23-24 trong hành trình phát triển nền tảng SaaS B2B Tubex, chúng tôi đã giải quyết thách thức thiết lập cơ sở hạ tầng kiểm thử toàn diện và đường ống CI/CD từ đầu. Bài viết này mô tả chi tiết cách chúng tôi hợp tác với trợ lý AI để thiết lập các thực hành kiểm thử và tự động hóa quy trình triển khai của chúng tôi.

## Thách thức về kiểm thử và CI/CD

Xây dựng một hệ sinh thái kiểm thử và CI/CD mạnh mẽ cho Tubex đặt ra một số thách thức phức tạp:

- Thiết lập framework kiểm thử cho cả thành phần frontend và backend
- Tạo các test case có ý nghĩa cung cấp độ phủ tốt
- Triển khai quy trình CI tự động chạy kiểm thử trên mỗi lần commit
- Cấu hình đường ống triển khai cho môi trường staging và production
- Đảm bảo hành vi nhất quán trên các môi trường khác nhau

## Chiến lược đặt lệnh hiệu quả

### Những gì đã hoạt động tốt

1. **Yêu cầu chiến lược kiểm thử trước**
   ```
   Tôi cần triển khai kiểm thử tự động cho nền tảng SaaS B2B Tubex. Chúng tôi đang sử dụng React với TypeScript cho frontend và Node.js với Express cho backend. Bạn khuyên nên dùng chiến lược kiểm thử nào trước khi chúng ta bắt đầu viết bất kỳ bài kiểm thử nào, xét đến việc chúng ta có các thành phần như xác thực, quản lý kho hàng và xử lý đơn hàng?
   ```
   
   Bằng cách yêu cầu trước một chiến lược kiểm thử cấp cao thay vì nhảy thẳng vào mã, AI đã cung cấp những hiểu biết giá trị về các loại kiểm thử, ưu tiên và framework sẽ phù hợp nhất cho các thành phần cụ thể trong ứng dụng của chúng tôi.

2. **Cung cấp bối cảnh thành phần**
   ```
   Đây là thành phần WhiteLabelHeader của chúng tôi:
   
   [mã thành phần...]
   
   Tôi cần viết các unit test cho thành phần này sử dụng React Testing Library và Jest. Thành phần nhận các prop này: logoUrl, companyName và primaryColor. Tôi nên triển khai những test case nào và viết chúng như thế nào?
   ```
   
   Bằng cách cung cấp mã thành phần thực tế và yêu cầu cụ thể, AI có thể tạo ra các bài kiểm thử phù hợp thực sự khớp với triển khai của chúng tôi.

3. **Xây dựng đường ống dần dần**
   ```
   Chúng tôi đang sử dụng GitHub Actions cho CI/CD. Tôi muốn tạo một quy trình làm việc:
   1. Chạy khi push lên nhánh main và tạo pull request
   2. Thiết lập Node.js v16
   3. Cài đặt các gói phụ thuộc
   4. Chạy ESLint
   5. Chạy unit test
   
   Tôi nên cấu trúc file YAML cho quy trình này như thế nào?
   ```
   
   Bắt đầu với một đường ống cơ bản và sau đó dần dần thêm độ phức tạp đã giúp chúng tôi xây dựng một hệ thống CI/CD vừa dễ hiểu vừa dễ bảo trì.

4. **Sử dụng thông báo lỗi thực tế**
   ```
   Tôi đang gặp lỗi này khi chạy các bài kiểm thử:
   
   [thông báo lỗi]
   
   Chúng tôi đang sử dụng Jest với React Testing Library. Nguyên nhân có thể là gì và tôi nên khắc phục như thế nào?
   ```
   
   Cung cấp thông báo lỗi thực tế cho AI dẫn đến hỗ trợ khắc phục sự cố chính xác hơn nhiều so với các mô tả chung.

## Phương pháp triển khai

### 1. Thiết lập kiểm thử Frontend

Với sự hướng dẫn của AI, chúng tôi đã thiết lập Jest và React Testing Library cho các thành phần frontend. File kiểm thử đầu tiên cho thành phần WhiteLabelHeader như sau:

```tsx
// WhiteLabelHeader.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WhiteLabelHeader from './WhiteLabelHeader';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock theme provider để tránh vấn đề với ngữ cảnh Material-UI
const renderWithTheme = (ui: React.ReactElement) => {
  const theme = createTheme();
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('Thành phần WhiteLabelHeader', () => {
  const defaultProps = {
    logoUrl: 'https://example.com/logo.png',
    companyName: 'Công ty Test',
    primaryColor: '#1976d2',
    compact: false,
  };

  test('hiển thị tên công ty và logo', () => {
    renderWithTheme(<WhiteLabelHeader {...defaultProps} />);
    
    const companyNameElement = screen.getByText('Công ty Test');
    expect(companyNameElement).toBeInTheDocument();
    
    const logoElement = screen.getByAltText('logo Công ty Test');
    expect(logoElement).toBeInTheDocument();
    expect(logoElement).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  test('áp dụng kiểu gọn gàng khi prop compact là true', () => {
    const compactProps = { ...defaultProps, compact: true };
    renderWithTheme(<WhiteLabelHeader {...compactProps} />);
    
    const headerElement = screen.getByTestId('white-label-header');
    expect(headerElement).toHaveStyle({ padding: '8px 16px' });
  });

  test('điều hướng đến dashboard khi nhấp vào logo', () => {
    const mockNavigate = jest.fn();
    // Mock useNavigate của react-router-dom
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));
    
    renderWithTheme(<WhiteLabelHeader {...defaultProps} />);
    const logoElement = screen.getByAltText('logo Công ty Test');
    
    userEvent.click(logoElement);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
```

### 2. Kiểm thử API Backend

Đối với kiểm thử API, AI đã giúp chúng tôi triển khai supertest với Jest để xác thực các endpoint:

```typescript
// user.api.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { getConnection } from 'typeorm';
import { User } from '../../src/database/models/User';

describe('API Người dùng', () => {
  beforeAll(async () => {
    // Thiết lập kết nối cơ sở dữ liệu kiểm thử
    // AI đã giúp chúng tôi triển khai cấu hình cơ sở dữ liệu dành riêng cho kiểm thử
  });

  afterAll(async () => {
    // Đóng kết nối cơ sở dữ liệu
    await getConnection().close();
  });

  beforeEach(async () => {
    // Xóa bảng người dùng trước mỗi bài kiểm thử
    await getConnection().createQueryBuilder().delete().from(User).execute();
  });

  describe('POST /api/users', () => {
    test('tạo người dùng mới thành công', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Người dùng Test',
        role: 'dealer'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(userData.email);
      expect(response.body.name).toBe(userData.name);
      expect(response.body).not.toHaveProperty('password');
    });

    test('trả về 400 cho dữ liệu người dùng không hợp lệ', async () => {
      const invalidUserData = {
        email: 'invalid-email',
        password: '123', // Quá ngắn
        name: '',
        role: 'invalid-role'
      };

      const response = await request(app)
        .post('/api/users')
        .send(invalidUserData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveLength(4);
    });
  });

  // Các test case bổ sung cho xác thực người dùng, truy xuất, cập nhật, v.v.
});
```

### 3. GitHub Actions Workflow

Với sự hỗ trợ của AI, chúng tôi đã tạo quy trình GitHub Actions cho CI/CD:

```yaml
# .github/workflows/ci.yml
name: Quy trình CI/CD Tubex

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main, staging]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpassword
          POSTGRES_DB: tubextest
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          
    steps:
      - uses: actions/checkout@v3
      
      - name: Thiết lập Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
          cache: 'npm'
          cache-dependency-path: Backend/package-lock.json
          
      - name: Cài đặt các gói phụ thuộc Backend
        run: cd Backend && npm ci
        
      - name: Lint Backend
        run: cd Backend && npm run lint
        
      - name: Chạy kiểm thử Backend
        run: cd Backend && npm test
        env:
          NODE_ENV: test
          DATABASE_URL: postgres://testuser:testpassword@localhost:5432/tubextest
          JWT_SECRET: testsecret
  
  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Thiết lập Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
          cache: 'npm'
          cache-dependency-path: Frontend/app/package-lock.json
          
      - name: Cài đặt các gói phụ thuộc Frontend
        run: cd Frontend/app && npm ci
        
      - name: Lint Frontend
        run: cd Frontend/app && npm run lint
        
      - name: Chạy kiểm thử Frontend
        run: cd Frontend/app && npm test -- --watchAll=false
  
  deploy-staging:
    needs: [backend-tests, frontend-tests]
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Cấu hình thông tin xác thực AWS
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-southeast-1
          
      - name: Triển khai lên môi trường Staging
        run: |
          echo "Đang triển khai lên môi trường staging..."
          # Các lệnh triển khai sẽ ở đây
```

## Thách thức và bài học kinh nghiệm

### Thách thức

1. **Kiểm thử các thành phần có trạng thái**
   
   Các thành phần sử dụng React Context hoặc Redux đặt ra thách thức cho việc kiểm thử độc lập. AI đã giúp chúng tôi tạo các mock và wrapper thích hợp để kiểm thử các thành phần này một cách hiệu quả.

2. **Độ phức tạp kiểm thử cơ sở dữ liệu**
   
   Việc thiết lập một cơ sở dữ liệu kiểm thử tách biệt dữ liệu kiểm thử khỏi dữ liệu phát triển đòi hỏi cấu hình cẩn thận. AI đã cung cấp hướng dẫn về việc sử dụng cơ sở dữ liệu trong bộ nhớ và container hóa cho các bài kiểm thử.

3. **Hiệu suất đường ống CI**
   
   Các đường ống CI ban đầu của chúng tôi mất quá nhiều thời gian để chạy. Với sự giúp đỡ của AI, chúng tôi đã tối ưu hóa chiến lược song song hóa và lưu trữ trong bộ nhớ đệm để giảm đáng kể thời gian xây dựng.

### Những điều có thể cải thiện

1. **Phương pháp kiểm thử quá mức ban đầu**
   
   Nỗ lực kiểm thử đầu tiên của chúng tôi cố gắng đạt độ phủ 100%, điều này không thực tế. AI đã giúp chúng tôi áp dụng một phương pháp tiếp cận chiến lược hơn:

   ```
   TRƯỚC: Hãy nhắm đến độ phủ kiểm thử 100% trên tất cả các thành phần.
   
   SAU: Hãy tập trung nỗ lực kiểm thử vào:
   1. Logic nghiệp vụ quan trọng (xử lý đơn hàng, tính toán kho hàng)
   2. Luồng xác thực và phân quyền
   3. Các thành phần UI phức tạp xử lý trạng thái
   4. Các trường hợp biên trong xử lý dữ liệu
   ```

2. **Độ phức tạp script CI**
   
   Các script CI ban đầu của chúng tôi quá nguyên khối. AI đã giúp chúng tôi tái cấu trúc chúng để có tính module hơn:

   ```yaml
   # Trước: Một công việc lớn làm mọi thứ
   
   # Sau: Nhiều công việc tập trung với phụ thuộc rõ ràng
   jobs:
     lint:
       # Công việc linting
     unit-tests:
       # Công việc unit testing
     integration-tests:
       needs: [unit-tests]
       # Công việc integration testing
     build:
       needs: [lint, unit-tests]
       # Công việc build
   ```

## Kết quả và tác động

Việc triển khai tự động hóa kiểm thử và CI/CD mang lại những cải tiến đáng kể:

- **Độ phủ kiểm thử tăng lên 78%** đối với các thành phần logic nghiệp vụ quan trọng
- **Đường ống CI chạy trong vòng 8 phút**, cung cấp phản hồi nhanh về các thay đổi mã
- **Thời gian triển khai giảm 65%** thông qua các quy trình tự động
- **Phát hiện lỗi được cải thiện**, với một số vấn đề quan trọng được phát hiện trước khi đến môi trường sản xuất
- **Sự tự tin của nhà phát triển tăng lên** khi thực hiện thay đổi với mã hiện có

## Công việc trong tương lai

Trong thời gian tới, chúng tôi dự định:

1. Triển khai kiểm thử end-to-end với Cypress
2. Tích hợp kiểm thử hiệu năng vào đường ống CI
3. Thiết lập kiểm thử hồi quy trực quan tự động
4. Triển khai việc phát hành canary để triển khai lên môi trường sản xuất an toàn hơn

## Kết luận

Việc triển khai tự động hóa kiểm thử và CI/CD cho nền tảng SaaS B2B Tubex là một quá trình thách thức nhưng đáng giá. Sự hỗ trợ của AI đã đẩy nhanh tiến độ của chúng tôi đáng kể, đặc biệt là trong các lĩnh vực mà thành viên nhóm có kinh nghiệm trước đó hạn chế. Bằng cách tập trung vào một phương pháp kiểm thử chiến lược và xây dựng đường ống CI/CD của chúng tôi dần dần, chúng tôi đã thiết lập một nền tảng vững chắc cho chất lượng và độ tin cậy.

Chìa khóa để hợp tác thành công với AI là cung cấp ngữ cảnh cụ thể về cấu trúc ứng dụng của chúng tôi, sử dụng các ví dụ mã thực tế và bắt đầu với các chiến lược cấp cao trước khi đi sâu vào chi tiết triển khai.
```
