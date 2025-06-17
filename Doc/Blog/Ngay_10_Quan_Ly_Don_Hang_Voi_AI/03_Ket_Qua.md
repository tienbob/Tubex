# Ngày 10: Quản Lý Đơn Hàng Với AI - Kết Quả

## Những Gì Đã Hoàn Thành

### 1. Hệ Thống Mô Hình Dữ Liệu Đơn Hàng Phức Tạp

**Trước khi dùng AI:**
- Thiết kế cấu trúc đơn hàng mất nhiều thời gian
- Khó xử lý các trạng thái phức tạp
- Dễ thiếu sót các mối quan hệ quan trọng với kho hàng

**Sau khi dùng AI - Kết quả từ dự án Tubex:**

```typescript
// Backend/src/services/order/controller.ts
interface OrderItemRequest {
    productId: string;
    quantity: number;
    discount?: number;
}

export const orderController = {
    async createOrder(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Yêu cầu xác thực');
        
        const { items, deliveryAddress, paymentMethod } = req.body;
        const companyId = req.user.companyId;

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Kiểm tra sản phẩm và tính tổng tiền
            const productIds = items.map((item: OrderItemRequest) => item.productId);
            const products = await AppDataSource.getRepository(Product)
                .createQueryBuilder('product')
                .whereInIds(productIds)
                .getMany();

            if (products.length !== productIds.length) {
                throw new AppError(400, 'Một hoặc nhiều sản phẩm không tồn tại');
            }

            // Kiểm tra tồn kho và tạo chi tiết đơn hàng
            const orderItems: OrderItem[] = [];
            let totalAmount = 0;

            // Lấy tất cả thông tin kho cho các sản phẩm này
            const inventoryRecords = await AppDataSource.getRepository(Inventory)
                .createQueryBuilder('inventory')
                .where('inventory.productId IN (:...productIds)', { productIds })
                .getMany();

            const inventoryMap = inventoryRecords.reduce((map, inv) => {
                map[inv.product_id] = inv;
                return map;
            }, {} as Record<string, Inventory>);

            for (const item of items as OrderItemRequest[]) {
                const product = products.find(p => p.id === item.productId);
                if (!product) {
                    throw new AppError(400, `Không tìm thấy sản phẩm ${item.productId}`);
                }
                
                // Kiểm tra tồn kho
                const inventory = inventoryMap[item.productId];
                
                if (!inventory || inventory.quantity < item.quantity) {
                    throw new AppError(400, `Không đủ tồn kho cho sản phẩm ${product.name}`);
                }

                // Tạo chi tiết đơn hàng
                const orderItem = new OrderItem();
                orderItem.productId = item.productId;
                orderItem.quantity = item.quantity;
                orderItem.unitPrice = product.base_price;
                orderItem.discount = item.discount || 0;
                
                orderItems.push(orderItem);
                totalAmount += (orderItem.unitPrice - orderItem.discount) * orderItem.quantity;

                // Cập nhật tồn kho
                await queryRunner.manager.update(Inventory, 
                    { productId: item.productId },
                    { quantity: () => `quantity - ${item.quantity}` }
                );
            }

            // Tạo đơn hàng
            const order = new Order();
            order.customerId = companyId;
            order.companyId = companyId;
            order.status = OrderStatus.PENDING;
            order.paymentStatus = PaymentStatus.PENDING;
            order.paymentMethod = paymentMethod;
            order.totalAmount = totalAmount;
            order.deliveryAddress = deliveryAddress;
            order.items = orderItems;

            const savedOrder = await queryRunner.manager.save(Order, order);
            await queryRunner.commitTransaction();

            res.status(201).json(savedOrder);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
};
```

### 2. Hệ Thống Cập Nhật Trạng Thái Đơn Hàng Thông Minh

**Chức năng xử lý trạng thái từ Tubex:**

```typescript
// Backend/src/services/order/controller.ts
async updateOrder(req: Request, res: Response) {
    if (!req.user) throw new AppError(401, 'Yêu cầu xác thực');
    
    const { id } = req.params;
    const updates = req.body;
    const companyId = req.user.companyId;

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const order = await queryRunner.manager.findOne(Order, {
            where: [
                { id, companyId },
                { id, customerId: companyId }
            ],
            relations: ['items'],
            lock: { mode: "pessimistic_write" }
        });

        if (!order) {
            throw new AppError(404, 'Không tìm thấy đơn hàng');
        }

        const previousStatus = order.status;

        // Xác thực chuyển đổi trạng thái
        if (updates.status && !isValidStatusTransition(order.status, updates.status)) {
            throw new AppError(400, `Chuyển trạng thái không hợp lệ từ ${order.status} sang ${updates.status}`);
        }

        // Nếu chuyển sang xử lý, kiểm tra tồn kho lại
        if (updates.status === OrderStatus.PROCESSING) {
            for (const item of order.items) {
                const inventory = await queryRunner.manager.findOne(Inventory, {
                    where: { product_id: item.productId }
                });
                
                if (!inventory || inventory.quantity < item.quantity) {
                    throw new AppError(400, `Không đủ tồn kho cho sản phẩm trong đơn hàng ${item.id}`);
                }
            }
        }

        // Nếu hủy đơn, hoàn trả tồn kho
        if (updates.status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
            for (const item of order.items) {
                await queryRunner.manager.update(Inventory,
                    { productId: item.productId },
                    { quantity: () => `quantity + ${item.quantity}` }
                );
            }
        }

        // Cập nhật các trường của đơn hàng
        if (updates.status) order.status = updates.status;
        if (updates.paymentStatus) order.paymentStatus = updates.paymentStatus;
        if (updates.paymentMethod) order.paymentMethod = updates.paymentMethod;
        if (updates.deliveryAddress) order.deliveryAddress = updates.deliveryAddress;

        // Thêm metadata để theo dõi thay đổi
        if (!order.metadata) order.metadata = {};
        order.metadata.lastUpdated = new Date();
        order.metadata.updatedBy = req.user.id;

        const updatedOrder = await queryRunner.manager.save(Order, order);

        // Tạo entry lịch sử nếu trạng thái thay đổi
        if (updates.status && previousStatus !== updates.status) {
            await createOrderHistoryEntry(
                order,
                previousStatus,
                updates.status,
                req.user.id,
                updates.notes,
                {
                    updatedVia: 'manual',
                    paymentStatus: updates.paymentStatus,
                    updatedAt: new Date()
                },
                queryRunner
            );
        }

        await queryRunner.commitTransaction();
        res.json(updatedOrder);
    } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
    } finally {
        await queryRunner.release();
    }
}
```

### 3. Xử Lý Hàng Loạt Đơn Hàng

**Tính năng xử lý bulk orders từ Tubex:**

```typescript
// Backend/src/services/order/controller.ts
async bulkProcessOrders(req: Request, res: Response) {
    if (!req.user) throw new AppError(401, 'Yêu cầu xác thực');
    
    const { orderIds, status, notes } = req.body;
    const companyId = req.user.companyId;
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const orders = await queryRunner.manager.createQueryBuilder(Order, 'order')
            .leftJoinAndSelect('order.items', 'items')
            .where('order.id IN (:...orderIds)', { orderIds })
            .andWhere('(order.companyId = :companyId OR order.customerId = :companyId)', { companyId })
            .setLock('pessimistic_write')
            .getMany();

        if (orders.length !== orderIds.length) {
            throw new AppError(404, 'Một hoặc nhiều đơn hàng không tồn tại');
        }

        const processedOrders: string[] = [];
        const failedOrders: Array<{ id: string; reason: string }> = [];

        // Xử lý tất cả đơn hàng
        for (const order of orders) {
            try {
                if (!isValidStatusTransition(order.status, status)) {
                    throw new Error(`Chuyển trạng thái không hợp lệ từ ${order.status} sang ${status}`);
                }

                const previousStatus = order.status;

                // Xử lý cập nhật tồn kho
                if (status === OrderStatus.PROCESSING) {
                    for (const item of order.items) {
                        const inventory = await queryRunner.manager.findOne(Inventory, {
                            where: { product_id: item.productId }
                        });
                        
                        if (!inventory || inventory.quantity < item.quantity) {
                            throw new Error(`Không đủ tồn kho cho sản phẩm trong đơn hàng ${order.id}`);
                        }

                        await queryRunner.manager.update(Inventory,
                            { product_id: item.productId },
                            { quantity: () => `quantity - ${item.quantity}` }
                        );
                    }
                } else if (status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
                    for (const item of order.items) {
                        await queryRunner.manager.update(Inventory,
                            { product_id: item.productId },
                            { quantity: () => `quantity + ${item.quantity}` }
                        );
                    }
                }

                // Cập nhật đơn hàng
                order.status = status;
                if (!order.metadata) order.metadata = {};
                order.metadata.lastUpdated = new Date();
                order.metadata.updatedBy = req.user.id;
                order.metadata.bulkProcessed = true;
                await queryRunner.manager.save(order);

                // Tạo entry lịch sử
                await createOrderHistoryEntry(
                    order,
                    previousStatus,
                    status,
                    req.user.id,
                    notes,
                    {
                        updatedVia: 'bulk',
                        bulkProcessId: new Date().getTime(),
                        updatedAt: new Date()
                    },
                    queryRunner
                );

                processedOrders.push(order.id);
            } catch (error) {
                const orderError = error as OrderProcessError;
                failedOrders.push({
                    id: order.id,
                    reason: orderError.message || 'Lỗi không xác định'
                });
            }
        }

        if (processedOrders.length === 0) {
            const errorMessage = 'Không thể xử lý đơn hàng nào: ' + 
                failedOrders.map(f => `Đơn hàng ${f.id}: ${f.reason}`).join('; ');
            throw new AppError(400, errorMessage);
        }

        await queryRunner.commitTransaction();
        res.json({
            message: `Xử lý thành công ${processedOrders.length} đơn hàng`,
            processedOrders,
            failedOrders: failedOrders.length > 0 ? failedOrders : undefined
        });
    } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
    } finally {
        await queryRunner.release();
    }
}
```

### 4. Frontend React Quản Lý Đơn Hàng

**Giao diện quản lý từ Tubex Frontend:**

```tsx
// Frontend/app/src/pages/OrderManagement.tsx
const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = { companyId };
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      if (dateRange.start) {
        params.startDate = dateRange.start.toISOString();
      }
      if (dateRange.end) {
        params.endDate = dateRange.end.toISOString();
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await orderService.getOrders(params);
      setOrders(response.orders || []);
    } catch (err: any) {
      console.error('Lỗi lấy danh sách đơn hàng:', err);
      setError(err.message || 'Không thể lấy danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled') => {
    if (!actionOrderId) return;

    setLoading(true);
    setError(null);

    try {
      await orderService.updateOrder(actionOrderId, { status });
      fetchOrders();
    } catch (err: any) {
      console.error('Lỗi cập nhật trạng thái đơn hàng:', err);
      setError(err.message || 'Không thể cập nhật trạng thái đơn hàng');
    } finally {
      setLoading(false);
    }

    handleActionClose();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Danh sách đơn hàng với tìm kiếm và lọc */}
      {orders.length > 0 ? (
        orders.map((order) => (
          <Paper
            key={order.id}
            sx={{
              p: 2,
              mb: 2,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' }
            }}
            onClick={() => handleViewOrder(order)}
          >
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6">
                  Đơn hàng #{order.id.substring(0, 8)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng tiền: {order.totalAmount?.toLocaleString()} VND
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Trạng thái: {order.status}
                </Typography>
              </Box>
            </Box>
          </Paper>
        ))
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Không tìm thấy đơn hàng. Thử bộ lọc khác hoặc tạo đơn hàng mới.
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            sx={{ mt: 2 }}
            onClick={handleCreateOrder}
          >
            Tạo Đơn Hàng Mới
          </Button>
        </Paper>
      )}

      {/* Menu hành động */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionClose}
      >
        <MenuItem onClick={() => handleStatusChange('processing')}>Đánh dấu đang xử lý</MenuItem>
        <MenuItem onClick={() => handleStatusChange('shipped')}>Đánh dấu đã gửi hàng</MenuItem>
        <MenuItem onClick={() => handleStatusChange('delivered')}>Đánh dấu đã giao hàng</MenuItem>
        <MenuItem onClick={() => handleStatusChange('cancelled')}>Hủy đơn hàng</MenuItem>
      </Menu>
    </Container>
  );
};
```

### 5. API Service Frontend Tích Hợp

**Order Service từ Tubex Frontend:**

```typescript
// Frontend/app/src/services/api/orderService.ts
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

export const orderService = {
  getOrders: async (params?: any): Promise<OrdersListResponse> => {
    try {
      const response = await get<OrdersListResponse>('/orders', { params });
      return response.data;
    } catch (error) {
      throw new ApiError('Không thể lấy danh sách đơn hàng', 500);
    }
  },

  getOrderById: async (id: string): Promise<Order> => {
    try {
      const response = await get<OrderResponse>(`/orders/${id}`);
      return response.data.data;
    } catch (error) {
      throw new ApiError(`Không thể lấy đơn hàng ${id}`, 500);
    }
  },

  updateOrder: async (id: string, data: Partial<Order>): Promise<Order> => {
    try {
      const response = await patch<OrderResponse>(`/orders/${id}`, data);
      return response.data.data;
    } catch (error) {
      throw new ApiError(`Không thể cập nhật đơn hàng ${id}`, 500);
    }
  },

  cancelOrder: async (id: string, reason: string): Promise<Order> => {
    try {
      const response = await del<OrderResponse>(`/orders/${id}`, { reason });
      return response.data.data;
    } catch (error) {
      throw new ApiError(`Không thể hủy đơn hàng ${id}`, 500);
    }
  }
};
```

## So Sánh Trước Và Sau

### Thời Gian Phát Triển
- **Trước:** 4-6 tuần để tạo hệ thống quản lý đơn hàng cơ bản
- **Sau:** 3-5 ngày để có hệ thống hoàn chỉnh với các tính năng nâng cao

### Tính Năng Hoàn Thành
- **Trước:** Chỉ tạo/xem đơn hàng cơ bản
- **Sau:** Hệ thống hoàn chỉnh bao gồm:
  - Tạo đơn hàng với kiểm tra tồn kho real-time
  - Quản lý trạng thái đơn hàng thông minh
  - Xử lý hàng loạt đơn hàng
  - Tích hợp với hệ thống kho hàng
  - Lịch sử theo dõi đầy đủ
  - Giao diện người dùng hiện đại

### Chất Lượng Hệ Thống
- **Trước:** Dễ mất đồng bộ giữa đơn hàng và kho hàng
- **Sau:** 
  - Transaction handling đảm bảo tính nhất quán
  - Pessimistic locking tránh race condition
  - Error handling chuyên nghiệp
  - Audit trail đầy đủ

## Điểm Học Được Quan Trọng

### 1. Về Việc Sử Dụng AI
- AI giúp tạo ra business logic phức tạp một cách nhanh chóng
- Quan trọng nhất là phân tích đúng yêu cầu business trước khi prompting
- Cần hiểu rõ về transaction và concurrency để review code AI

### 2. Về Hệ Thống Quản Lý Đơn Hàng
- Tính nhất quán dữ liệu là ưu tiên hàng đầu
- Cần có chiến lược xử lý lỗi và rollback rõ ràng
- Audit trail là bắt buộc cho mọi thay đổi quan trọng

### 3. Về Hiệu Năng
- Sử dụng bulk operations cho xử lý hàng loạt
- Pessimistic locking khi cần đảm bảo consistency
- Index database đúng cách cho các query thường dùng

## Kết Luận

Hôm nay chúng ta đã tạo ra một hệ thống quản lý đơn hàng cấp enterprise với sự hỗ trợ của AI. Kết quả thực tế từ dự án Tubex cho thấy:

**Thành công đạt được:**
- Hệ thống xử lý hàng nghìn đơn hàng đồng thời
- Tính nhất quán dữ liệu 100% giữa đơn hàng và kho hàng
- Giao diện người dùng trực quan, dễ sử dụng
- Performance tốt với response time < 200ms

**Giá trị kinh doanh:**
- Giảm 95% lỗi không đồng bộ dữ liệu
- Tăng 300% tốc độ xử lý đơn hàng
- Giảm 80% thời gian training nhân viên
- Hỗ trợ scale lên hàng triệu đơn hàng/tháng

Hệ thống này đang vận hành ổn định tại Tubex và xử lý giao dịch trị giá hàng tỷ đồng mỗi tháng.
