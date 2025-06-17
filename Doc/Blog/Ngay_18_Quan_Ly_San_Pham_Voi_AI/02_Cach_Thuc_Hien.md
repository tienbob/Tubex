# Cách Thực Hiện: Xây Dựng Hệ Thống Quản Lý Sản Phẩm với AI

## Bước 1: Thiết Kế Kiến Trúc Tổng Thể

### Prompt AI Để Thiết Kế Architecture
```
"Thiết kế kiến trúc quản lý sản phẩm cho nền tảng B2B vật liệu xây dựng với:
- Multi-tenant isolation (supplier/dealer)
- Product catalog management
- Dynamic pricing system
- Search và filtering
- Image management
- Category hierarchy
- TypeScript và TypeORM
- Redis caching
- Security và audit logging

Đưa ra database schema, API endpoints và component structure."
```

### Cấu Trúc Thư Mục
```
Backend/src/services/product/
├── models/
│   ├── Product.ts          # Product entity
│   ├── Category.ts         # Category entity
│   └── Price.ts            # Price history entity
├── controllers/
│   ├── productController.ts
│   └── categoryController.ts
├── services/
│   ├── productService.ts
│   └── priceService.ts
├── routes.ts
└── validators/
    └── productValidators.ts

Frontend/src/components/whitelabel/products/
├── ProductList.tsx
├── ProductForm.tsx
├── ProductDetails.tsx
├── CategoryManager.tsx
└── PriceManager.tsx
```

## Bước 2: Database Schema Design

### Prompt Tạo Database Models
```
"Tạo TypeORM entities cho hệ thống quản lý sản phẩm với:
- Product: id, name, description, basePrice, unit, category, supplier
- Category: id, name, parentId (hierarchy support)
- Price: productId, dealerId, price, validFrom, validTo
- ProductImage: productId, imageUrl, isPrimary
- Relationships phù hợp
- Indexes cho performance
- Validation decorators
- Soft delete support"
```

### Product Entity Implementation
```typescript
// models/Product.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

@Entity('products')
@Index(['supplierId', 'status'])
@Index(['categoryId', 'status'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  name: string;

  @Column('text')
  @IsOptional()
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber({}, { message: 'Giá phải là số' })
  @Min(0, { message: 'Giá không được âm' })
  basePrice: number;

  @Column()
  @IsNotEmpty({ message: 'Đơn vị không được để trống' })
  unit: string;

  @Column('uuid')
  supplierId: string;

  @Column('uuid', { nullable: true })
  categoryId: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'draft'],
    default: 'draft'
  })
  status: 'active' | 'inactive' | 'draft';

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ nullable: true })
  sku: string;

  @Column('int', { default: 0 })
  minOrderQuantity: number;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Category, category => category.products)
  category: Category;

  @OneToMany(() => ProductImage, image => image.product)
  images: ProductImage[];

  @OneToMany(() => Price, price => price.product)
  prices: Price[];
}
```

### Category Entity
```typescript
// models/Category.ts
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('uuid', { nullable: true })
  parentId: string;

  @Column('uuid')
  companyId: string;

  @Column('int', { default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Category, category => category.children)
  parent: Category;

  @OneToMany(() => Category, category => category.parent)
  children: Category[];

  @OneToMany(() => Product, product => product.category)
  products: Product[];
}
```

## Bước 3: Service Layer Implementation

### Prompt Tạo Product Service
```
"Tạo ProductService với TypeScript cho:
- CRUD operations với validation
- Multi-tenant data isolation
- Search và filtering
- Bulk operations
- Cache integration với Redis
- Error handling comprehensive
- Audit logging
- Transaction support
- Performance optimization"
```

### Product Service Implementation
```typescript
// services/productService.ts
import { Repository, Like, In, Between } from 'typeorm';
import { Product } from '../models/Product';
import { AppDataSource } from '../../../database';
import { redis } from '../../../config/redis';

export interface ProductFilters {
  companyId: string;
  categoryId?: string;
  status?: string[];
  priceRange?: { min: number; max: number };
  search?: string;
  tags?: string[];
  supplierId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ProductCreateInput {
  name: string;
  description?: string;
  basePrice: number;
  unit: string;
  categoryId?: string;
  sku?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  minOrderQuantity?: number;
}

export class ProductService {
  private productRepository: Repository<Product>;
  private cachePrefix = 'product:';
  private cacheTTL = 3600; // 1 giờ

  constructor() {
    this.productRepository = AppDataSource.getRepository(Product);
  }

  async createProduct(supplierId: string, data: ProductCreateInput): Promise<Product> {
    // Validation
    await this.validateProductData(data);
    
    // Tạo product mới
    const product = this.productRepository.create({
      ...data,
      supplierId,
      status: 'draft'
    });

    const savedProduct = await this.productRepository.save(product);
    
    // Xóa cache liên quan
    await this.invalidateCache(supplierId);
    
    // Audit log
    await this.logActivity('CREATE', savedProduct.id, supplierId);
    
    return savedProduct;
  }

  async getProducts(filters: ProductFilters): Promise<{ products: Product[]; total: number }> {
    const cacheKey = `${this.cachePrefix}list:${JSON.stringify(filters)}`;
    
    // Kiểm tra cache trước
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const queryBuilder = this.productRepository.createQueryBuilder('product');
    
    // Base filter - chỉ supplier có thể thấy sản phẩm của mình
    queryBuilder.where('product.supplierId = :companyId', { companyId: filters.companyId });
    queryBuilder.andWhere('product.isDeleted = false');

    // Thêm filters
    if (filters.categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.status) {
      queryBuilder.andWhere('product.status IN (:...status)', { status: filters.status });
    }

    if (filters.priceRange) {
      queryBuilder.andWhere('product.basePrice BETWEEN :minPrice AND :maxPrice', {
        minPrice: filters.priceRange.min,
        maxPrice: filters.priceRange.max
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      queryBuilder.andWhere('product.tags && :tags', { tags: filters.tags });
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    queryBuilder.skip((page - 1) * limit).take(limit);

    // Sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';
    queryBuilder.orderBy(`product.${sortBy}`, sortOrder);

    // Load relations
    queryBuilder.leftJoinAndSelect('product.category', 'category');
    queryBuilder.leftJoinAndSelect('product.images', 'images');

    const [products, total] = await queryBuilder.getManyAndCount();

    const result = { products, total };
    
    // Cache kết quả
    await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(result));
    
    return result;
  }

  async updateProduct(id: string, supplierId: string, data: Partial<ProductCreateInput>): Promise<Product> {
    // Kiểm tra quyền sở hữu
    const product = await this.productRepository.findOne({
      where: { id, supplierId, isDeleted: false }
    });

    if (!product) {
      throw new Error('Không tìm thấy sản phẩm hoặc không có quyền truy cập');
    }

    // Validation dữ liệu update
    if (data.basePrice !== undefined && data.basePrice < 0) {
      throw new Error('Giá sản phẩm không được âm');
    }

    // Update product
    Object.assign(product, data);
    const updatedProduct = await this.productRepository.save(product);

    // Xóa cache
    await this.invalidateCache(supplierId);
    
    // Audit log
    await this.logActivity('UPDATE', id, supplierId);

    return updatedProduct;
  }

  async deleteProduct(id: string, supplierId: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id, supplierId, isDeleted: false }
    });

    if (!product) {
      throw new Error('Không tìm thấy sản phẩm hoặc không có quyền truy cập');
    }

    // Soft delete
    product.isDeleted = true;
    await this.productRepository.save(product);

    // Xóa cache
    await this.invalidateCache(supplierId);
    
    // Audit log
    await this.logActivity('DELETE', id, supplierId);
  }

  async bulkUpdateStatus(ids: string[], supplierId: string, status: 'active' | 'inactive' | 'draft'): Promise<void> {
    await this.productRepository.update(
      { id: In(ids), supplierId, isDeleted: false },
      { status }
    );

    await this.invalidateCache(supplierId);
    await this.logActivity('BULK_UPDATE_STATUS', ids.join(','), supplierId);
  }

  private async validateProductData(data: ProductCreateInput): Promise<void> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Tên sản phẩm không được để trống');
    }

    if (data.basePrice < 0) {
      throw new Error('Giá sản phẩm không được âm');
    }

    if (!data.unit || data.unit.trim().length === 0) {
      throw new Error('Đơn vị không được để trống');
    }

    // Kiểm tra SKU trùng lặp nếu có
    if (data.sku) {
      const existingProduct = await this.productRepository.findOne({
        where: { sku: data.sku, isDeleted: false }
      });
      if (existingProduct) {
        throw new Error('SKU đã tồn tại');
      }
    }
  }

  private async invalidateCache(supplierId: string): Promise<void> {
    const pattern = `${this.cachePrefix}*${supplierId}*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  private async logActivity(action: string, productId: string, userId: string): Promise<void> {
    // Implement audit logging
    console.log(`[AUDIT] ${action} product ${productId} by user ${userId}`);
  }
}
```

## Bước 4: API Controllers

### Prompt Tạo Controllers
```
"Tạo ProductController với Express và TypeScript:
- RESTful endpoints đầy đủ
- Request validation với Joi
- Error handling middleware
- Authentication middleware
- Rate limiting
- Response formatting consistent
- OpenAPI documentation
- File upload cho images"
```

### Product Controller Implementation
```typescript
// controllers/productController.ts
import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';
import { validateProductCreate, validateProductUpdate, validateProductFilters } from '../validators/productValidators';
import { asyncHandler } from '../../../middleware/asyncHandler';
import { AuthRequest } from '../../../types/express';

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  createProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { error, value } = validateProductCreate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Dữ liệu không hợp lệ',
        errors: error.details.map(detail => detail.message)
      });
    }

    const supplierId = req.user!.companyId;
    const product = await this.productService.createProduct(supplierId, value);

    res.status(201).json({
      status: 'success',
      message: 'Tạo sản phẩm thành công',
      data: product
    });
  });

  getProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { error, value } = validateProductFilters(req.query);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Tham số không hợp lệ',
        errors: error.details.map(detail => detail.message)
      });
    }

    const filters = {
      ...value,
      companyId: req.user!.companyId
    };

    const result = await this.productService.getProducts(filters);

    res.json({
      status: 'success',
      data: result.products,
      pagination: {
        total: result.total,
        page: filters.page || 1,
        limit: filters.limit || 20,
        totalPages: Math.ceil(result.total / (filters.limit || 20))
      }
    });
  });

  getProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const supplierId = req.user!.companyId;

    const product = await this.productService.getProductById(id, supplierId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy sản phẩm'
      });
    }

    res.json({
      status: 'success',
      data: product
    });
  });

  updateProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { error, value } = validateProductUpdate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Dữ liệu không hợp lệ',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { id } = req.params;
    const supplierId = req.user!.companyId;

    const product = await this.productService.updateProduct(id, supplierId, value);

    res.json({
      status: 'success',
      message: 'Cập nhật sản phẩm thành công',
      data: product
    });
  });

  deleteProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const supplierId = req.user!.companyId;

    await this.productService.deleteProduct(id, supplierId);

    res.json({
      status: 'success',
      message: 'Xóa sản phẩm thành công'
    });
  });

  bulkUpdateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { ids, status } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Danh sách ID không hợp lệ'
      });
    }

    if (!['active', 'inactive', 'draft'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Trạng thái không hợp lệ'
      });
    }

    const supplierId = req.user!.companyId;
    await this.productService.bulkUpdateStatus(ids, supplierId, status);

    res.json({
      status: 'success',
      message: 'Cập nhật trạng thái thành công'
    });
  });
}
```

## Bước 5: Frontend Components

### Prompt Tạo React Components
```
"Tạo React components cho quản lý sản phẩm với:
- ProductList với search, filter, pagination
- ProductForm cho create/edit với validation
- ProductDetails để xem chi tiết
- CategoryManager cho quản lý danh mục
- TypeScript interfaces đầy đủ
- Material-UI cho UI
- React Hook Form cho forms
- React Query cho data fetching
- Error boundaries và loading states"
```

### Product List Component
```typescript
// components/whitelabel/products/ProductList.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Button,
  Menu,
  MenuItem,
  Checkbox,
  Toolbar,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  unit: string;
  status: 'active' | 'inactive' | 'draft';
  category?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProductListProps {
  onEdit?: (product: Product) => void;
  onView?: (product: Product) => void;
  companyId: string;
}

const ProductList: React.FC<ProductListProps> = ({ onEdit, onView, companyId }) => {
  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [bulkStatusDialog, setBulkStatusDialog] = useState(false);
  const [newBulkStatus, setNewBulkStatus] = useState<'active' | 'inactive' | 'draft'>('active');

  const { user } = useAuth();

  // Fetch products với React Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products', companyId, page, rowsPerPage, searchQuery, statusFilter],
    queryFn: () => productService.getProducts({
      companyId,
      page: page + 1,
      limit: rowsPerPage,
      search: searchQuery || undefined,
      status: statusFilter.length > 0 ? statusFilter : undefined
    }),
    enabled: !!companyId,
  });

  const products = data?.data || [];
  const totalCount = data?.pagination?.total || 0;

  // Handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0); // Reset về trang đầu khi search
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
    setPage(0);
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, product: Product) => {
    setAnchorEl(event.currentTarget);
    setCurrentProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setCurrentProduct(null);
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedProducts.length === 0) return;

    try {
      await productService.bulkUpdateStatus(selectedProducts, newBulkStatus);
      setBulkStatusDialog(false);
      setSelectedProducts([]);
      refetch();
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      active: { label: 'Đang bán', color: 'success' as const },
      inactive: { label: 'Tạm dừng', color: 'default' as const },
      draft: { label: 'Bản nháp', color: 'warning' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Lỗi tải dữ liệu: {error.message}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Tìm kiếm sản phẩm..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />

        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={() => {/* Mở filter menu */}}
        >
          Lọc ({statusFilter.length})
        </Button>

        {selectedProducts.length > 0 && (
          <Button
            variant="contained"
            onClick={() => setBulkStatusDialog(true)}
          >
            Cập nhật trạng thái ({selectedProducts.length})
          </Button>
        )}
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedProducts.length === products.length && products.length > 0}
                  indeterminate={selectedProducts.length > 0 && selectedProducts.length < products.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Tên sản phẩm</TableCell>
              <TableCell>Danh mục</TableCell>
              <TableCell>Giá bán</TableCell>
              <TableCell>Đơn vị</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Ngày tạo</TableCell>
              <TableCell>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              [...Array(rowsPerPage)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={8}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      Đang tải...
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              products.map((product) => (
                <TableRow key={product.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">{product.name}</Typography>
                      {product.description && (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {product.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {product.category?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {formatPrice(product.basePrice)}
                  </TableCell>
                  <TableCell>{product.unit}</TableCell>
                  <TableCell>
                    {getStatusChip(product.status)}
                  </TableCell>
                  <TableCell>
                    {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => handleMenuClick(e, product)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Hiển thị:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} của ${count !== -1 ? count : to}`
          }
        />
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (currentProduct && onView) onView(currentProduct);
          handleMenuClose();
        }}>
          Xem chi tiết
        </MenuItem>
        <MenuItem onClick={() => {
          if (currentProduct && onEdit) onEdit(currentProduct);
          handleMenuClose();
        }}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Chỉnh sửa
        </MenuItem>
        <MenuItem onClick={() => {
          // Handle delete
          handleMenuClose();
        }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Xóa
        </MenuItem>
      </Menu>

      {/* Bulk Status Update Dialog */}
      <Dialog open={bulkStatusDialog} onClose={() => setBulkStatusDialog(false)}>
        <DialogTitle>Cập nhật trạng thái</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Trạng thái mới</InputLabel>
            <Select
              value={newBulkStatus}
              onChange={(e) => setNewBulkStatus(e.target.value as any)}
              label="Trạng thái mới"
            >
              <MenuItem value="active">Đang bán</MenuItem>
              <MenuItem value="inactive">Tạm dừng</MenuItem>
              <MenuItem value="draft">Bản nháp</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkStatusDialog(false)}>Hủy</Button>
          <Button onClick={handleBulkStatusUpdate} variant="contained">
            Cập nhật ({selectedProducts.length} sản phẩm)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductList;
```

## Bước 6: Validation và Error Handling

### Product Validators
```typescript
// validators/productValidators.ts
import Joi from 'joi';

export const validateProductCreate = (data: any) => {
  const schema = Joi.object({
    name: Joi.string().required().min(1).max(255).messages({
      'string.empty': 'Tên sản phẩm không được để trống',
      'string.max': 'Tên sản phẩm không được vượt quá 255 ký tự'
    }),
    description: Joi.string().allow('').max(1000).messages({
      'string.max': 'Mô tả không được vượt quá 1000 ký tự'
    }),
    basePrice: Joi.number().required().min(0).messages({
      'number.base': 'Giá phải là số',
      'number.min': 'Giá không được âm',
      'any.required': 'Giá bán là bắt buộc'
    }),
    unit: Joi.string().required().min(1).max(50).messages({
      'string.empty': 'Đơn vị không được để trống',
      'string.max': 'Đơn vị không được vượt quá 50 ký tự'
    }),
    categoryId: Joi.string().uuid().optional(),
    sku: Joi.string().optional().max(100),
    tags: Joi.array().items(Joi.string()).optional(),
    metadata: Joi.object().optional(),
    minOrderQuantity: Joi.number().min(0).optional()
  });

  return schema.validate(data, { abortEarly: false });
};

export const validateProductUpdate = (data: any) => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    description: Joi.string().allow('').max(1000).optional(),
    basePrice: Joi.number().min(0).optional(),
    unit: Joi.string().min(1).max(50).optional(),
    categoryId: Joi.string().uuid().optional(),
    sku: Joi.string().max(100).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    metadata: Joi.object().optional(),
    minOrderQuantity: Joi.number().min(0).optional(),
    status: Joi.string().valid('active', 'inactive', 'draft').optional()
  });

  return schema.validate(data, { abortEarly: false });
};

export const validateProductFilters = (data: any) => {
  const schema = Joi.object({
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).max(100).optional(),
    search: Joi.string().max(255).optional(),
    status: Joi.array().items(Joi.string().valid('active', 'inactive', 'draft')).optional(),
    categoryId: Joi.string().uuid().optional(),
    sortBy: Joi.string().valid('name', 'basePrice', 'createdAt', 'updatedAt').optional(),
    sortOrder: Joi.string().valid('ASC', 'DESC').optional()
  });

  return schema.validate(data, { abortEarly: false });
};
```

## Lưu Ý Quan Trọng

### 1. Security Best Practices
- Luôn validate input từ client
- Implement proper authentication và authorization
- Sử dụng parameterized queries để tránh SQL injection
- Rate limiting cho API endpoints

### 2. Performance Optimization
- Index database columns được query thường xuyên
- Implement caching với Redis
- Pagination cho large datasets
- Lazy loading relationships

### 3. Error Handling
- Consistent error response format
- Proper HTTP status codes
- User-friendly error messages trong tiếng Việt
- Logging chi tiết cho debugging

### 4. Testing Strategy
- Unit tests cho services và utilities
- Integration tests cho API endpoints
- Component tests cho React components
- E2E tests cho critical user flows
