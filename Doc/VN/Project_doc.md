# Tubex - Nền tảng SaaS B2B

## 1. Tổng quan dự án

### 1.1. Mục tiêu
- **Mô tả**: Hệ thống quản lý bán hàng thông minh được thiết kế để hỗ trợ chuyển đổi số cho các đại lý VLXD (tôn, ống hộp, phụ kiện)
- **Tính năng chính**: 
  - Tối ưu hóa quy trình bán hàng, kho, công nợ, và mua hàng
  - Tích hợp AI, Zalo Mini App, thanh toán trực tuyến
  - Kết nối chuỗi cung ứng từ nhà sản xuất đến đại lý và khách hàng cuối

### 1.2. Phạm vi

#### Đối tượng sử dụng
- Đại lý
- Nhân viên đại lý
- Nhân viên công ty (Kế toán, Admin vận hành)
- Admin hệ thống

#### Mô hình hệ thống
- **Kiểu**: Multi-tenant
- **Đặc điểm**: Một instance phục vụ nhiều đại lý và nhà cung cấp với dữ liệu cách ly

#### Mô hình kinh doanh
- **Gói đại lý**:
  - Gói miễn phí (tính năng cơ bản)
  - Gói trả phí (80,000–500,000 VNĐ/tháng)
- **Gói nhà cung cấp**: 
  - 1–2 triệu VNĐ/tháng (giai đoạn sau)

#### Công nghệ sử dụng
- **Backend**: NodeJS
- **Frontend**: ReactJS, React Native
- **Database**: PostgreSQL, MongoDB, Redis
- **Cloud**: AWS/Viettel Cloud
- **Tích hợp**: Zalo Mini App, VNPay/Momo, Google Firebase

#### Mục tiêu quy mô
- **Tổng thể**: 3,000–5,000 đại lý trong 2–3 năm
- **Năm đầu**: 500 đại lý

### 1.3. Giai đoạn triển khai

#### Giai đoạn 1: MVP (5–10/2025)
- Tính năng core cho đại lý
- Hỗ trợ một nhà cung cấp duy nhất

#### Giai đoạn 2 (11/2025–4/2026)
- Hỗ trợ đa nhà cung cấp

#### Giai đoạn 3 (2026–2028)
- Mở rộng hệ sinh thái (50 nhà cung cấp, 5,000 đại lý)

### 1.4. Mục tiêu nghiệp vụ

#### Đại lý
- Tăng hiệu quả quản lý bán hàng, kho, công nợ
- Đặt hàng dễ dàng từ nhà cung cấp
- Chi phí thấp (80,000 VNĐ/tháng)

#### Nhà cung cấp
- Quản lý đại lý, chiết khấu
- Cập nhật giá theo thời gian thực
- Tăng doanh thu qua hệ sinh thái

#### Admin hệ thống
- Đảm bảo hệ thống ổn định, bảo mật
- Dễ quản lý
- Hỗ trợ người dùng hiệu quả

## 2. Yêu cầu nghiệp vụ (Core Features)

### 2.1. Module quản lý bán hàng

#### 2.1.1. Quản lý bán hàng và hóa đơn (Ưu tiên cao)

##### Tính năng
- **Tạo báo giá nhanh**
  - Nhập số lượng (tấn, mét, đơn vị tùy chỉnh)
  - Tự động tính giá
  - Gửi qua Zalo, email, PDF

- **Quản lý hóa đơn**
  - Tùy chỉnh mẫu
  - Tự động tạo mã
  - Lưu trữ và chia sẻ

- **Quản lý đơn hàng đa kênh**
  - Đồng bộ từ nhiều nguồn
  - Theo dõi trạng thái
  - Quản lý thay đổi

##### KPI
- Tạo báo giá/hóa đơn: <30 giây
- Đồng bộ Zalo: <5 giây
- Độ hài lòng: 95%

#### 2.1.2. Quản lý hàng hóa và kho (Ưu tiên cao)

##### Tính năng
- **Quản lý lô**
  - Mã lô tự động
  - Theo dõi thông tin sản xuất

- **Quản lý sản phẩm**
  - Phân loại chi tiết
  - Cập nhật giá tự động

- **Quản lý kho**
  - Nhập/xuất Excel
  - Quét mã vạch
  - Cảnh báo tồn kho

##### KPI
- Cập nhật giá: <1 phút
- Nhập/xuất kho: <2 phút
- Độ chính xác: 99%

#### 2.1.3. Quản lý khách hàng

##### Tính năng
- **Lưu trữ thông tin**
  - Tên, số điện thoại, email
  - Lịch sử mua hàng, công nợ
  - Phân loại khách hàng

- **Gửi thông báo**
  - Tích hợp SMS/Zalo ZNS
  - Tùy chỉnh nội dung thông báo

- **Tích điểm/chiết khấu** (gói nâng cao)
  - Dựa trên doanh số
  - Áp dụng cho khách hàng thân thiết

##### KPI
- Lưu thông tin khách: <10 giây
- Gửi 1,000 thông báo Zalo: <5 phút
- Tăng doanh số từ khách thân thiết: 10%

#### 2.1.4. Quản lý nhân viên

##### Tính năng
- **Phân quyền**
  - Vai trò: Quản lý, kế toán, nhân viên kho, thu ngân
  - Gán quyền qua giao diện Admin

- **Theo dõi thao tác**
  - Lịch sử thao tác
  - Nhật ký hoạt động

- **Báo cáo doanh số**
  - Theo nhân viên
  - Biểu đồ trực quan

##### KPI
- Phân quyền: <1 phút
- Báo cáo doanh số: 99% chính xác

#### 2.1.5. Báo cáo và phân tích (Ưu tiên cao)

##### Tính năng
- **Báo cáo**
  - Doanh thu, lợi nhuận, công nợ
  - Xuất báo cáo Excel/PDF

- **Phân tích**
  - Sản phẩm bán chạy
  - Khách hàng tiềm năng

- **Giao diện**
  - Biểu đồ trực quan
  - Lọc dữ liệu theo thời gian, sản phẩm, khách hàng

##### KPI
- Tạo báo cáo: <10 giây
- Độ chính xác dữ liệu: 99%

### 2.2. Module quản lý mua hàng

#### 2.2.1. Quản lý đơn mua

##### Tính năng
- **Lên đơn nhanh**
  - Chọn sản phẩm, số lượng từ danh mục
  - Hệ thống tự đề xuất

- **Lên đơn thủ công**
  - Nhập quy cách và số lượng

- **Chiến dịch mua hàng**
  - Hỗ trợ mua chung
  - Mua riêng với chiết khấu cá nhân hóa

##### KPI
- Lên đơn trong <30 giây
- Nhận báo giá trong <1 phút

#### 2.2.2. Theo dõi đơn hàng

##### Tính năng
- **Theo dõi trạng thái**
  - Xem trạng thái đơn qua web/Zalo
  - Nhận thông báo đẩy

- **Bảo hành/đổi trả**
  - Gửi yêu cầu qua hệ thống
  - Theo dõi trạng thái xử lý

- **Phản ánh chất lượng**
  - Gửi đánh giá chất lượng sản phẩm
  - Nhà cung cấp xem đánh giá để cải thiện

##### KPI
- Xử lý yêu cầu bảo hành trong 48 giờ

### 2.3. Module quản lý công nợ

#### 2.3.1. Theo dõi công nợ

##### Tính năng
- **Hiển thị công nợ**
  - Nhà cung cấp và khách hàng
  - Phân loại công nợ

- **Cảnh báo và nhắc nợ**
  - Cảnh báo công nợ quá hạn
  - Gửi nhắc nợ qua SMS/Zalo ZNS

- **Báo cáo công nợ**
  - Chi tiết theo khách hàng, thời gian
  - Biểu đồ công nợ

##### KPI
- Cảnh báo công nợ chính xác 99%
- Gửi 1,000 nhắc nợ trong <5 phút

#### 2.3.2. Thanh toán

##### Tính năng
- **Tích hợp VNPay/Momo**
  - Thanh toán công nợ trực tuyến
  - Ghi nhận thanh toán thủ công

##### KPI
- Thanh toán trực tuyến hoàn tất trong <10 giây

### 2.4. Module AI thông minh

#### 2.4.1. Dự đoán nhu cầu

##### Tính năng
- **Phân tích dữ liệu lịch sử**
  - Dự đoán nhu cầu theo mùa vụ
  - Gợi ý số lượng đặt hàng tối ưu

- **Đề xuất chiết khấu/khuyến mãi**
  - Gợi ý cho khách hàng tiềm năng
  - Đề xuất chương trình khuyến mãi

- **Đặt hàng qua Zalo**
  - Chatbot AI hỗ trợ đặt hàng
  - Hiểu ngôn ngữ tự nhiên

##### KPI
- Dự đoán nhu cầu chính xác 85%
- Tăng 10% doanh số nhờ đề xuất AI
- Chatbot trả lời trong <5 giây

### 2.5. Module pre-order

#### 2.5.1. Đặt hàng trước

##### Tính năng
- **Chọn sản phẩm, số lượng, thời gian giao hàng**
  - Nhận chiết khấu cao
  - Xem tồn kho và năng lực sản xuất

- **Đặt hàng định kỳ**
  - Tự động tạo đơn hàng
  - Hủy/sửa đơn định kỳ

- **Theo dõi trạng thái**
  - Xem trạng thái đơn qua web/Zalo
  - Nhận thông báo đẩy khi trạng thái thay đổi

##### KPI
- Đặt hàng trong <30 giây
- Chiết khấu áp dụng chính xác 99%
- Thông báo trạng thái trong <5 giây

## 3. Yêu cầu phi chức năng

### 3.1. Hiệu suất
- Xử lý 1,000 người dùng đồng thời
- Tải trang <2 giây
- API phản hồi <500ms
- Cập nhật tồn kho/giá <1 phút

### 3.2. Bảo mật
- SSL, AES-256
- 2FA (Zalo/email)
- Cách ly dữ liệu tenant
- Audit logging

### 3.3. Khả năng mở rộng
- Auto-scaling trên cloud
- API mở cho tích hợp
- Hỗ trợ tăng trưởng người dùng

### 3.4. Giao diện
- Đơn giản, thân thiện
- Responsive (Web + Mobile)
- Tích hợp Zalo Mini App

### 3.5. Tính khả dụng
- Uptime 99.9%
- Backup hàng ngày
- Recovery <1 giờ

## 4. Kế hoạch triển khai

### 4.1. Giai đoạn 1: MVP
- **Thời gian**: 5–10/2025
- **Chi phí**: 700–1,000 triệu VNĐ
- **Mục tiêu**: 500 đại lý
- **Doanh thu**: 480 triệu VNĐ

### 4.2. Giai đoạn 2: Mở rộng
- **Thời gian**: 11/2025–4/2026
- **Chi phí**: 300–500 triệu VNĐ
- **Mục tiêu**: Thêm 200 đại lý

### 4.3. Giai đoạn 3: Tối ưu
- **Thời gian**: 2026–2028
- **Mục tiêu**: 5,000 đại lý
- **Doanh thu**: 5–7 tỷ VNĐ/năm

## 5. Khuyến nghị
1. Ưu tiên MVP với tính năng core
2. Tích hợp sớm Zalo và thanh toán
3. Thử nghiệm với đại lý hiện có
4. Tập trung UX đơn giản
5. Đảm bảo khả năng mở rộng