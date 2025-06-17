# Ngày 8: Quản Lý Người Dùng Với AI - Cách Thực Hiện

## Bước 1: Thiết Kế Cấu Trúc Dữ Liệu Người Dùng

### Câu Hỏi Cho AI:
```
"Tôi cần thiết kế cơ sở dữ liệu để quản lý người dùng trong hệ thống thương mại điện tử B2B. 
Hãy tạo mô hình TypeScript với TypeORM bao gồm:
- Bảng người dùng với thông tin cá nhân và công việc
- Bảng công ty với thông tin doanh nghiệp
- Mối quan hệ người dùng thuộc công ty
- Vai trò và quyền hạn phân cấp
- Theo dõi trạng thái tài khoản
Sử dụng PostgreSQL làm cơ sở dữ liệu."
```

### Kết Quả Thực Tế Từ Dự Án Tubex:
```typescript
// Backend/src/database/models/sql/user.ts
@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column("varchar", { length: 255, unique: true })
    email: string;

    @Column("varchar", { length: 255 })
    password_hash: string;

    @Column("varchar", { length: 50 })
    role: 'admin' | 'manager' | 'staff';

    @Column("varchar", { length: 50, default: "active" })
    status: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: "company_id" })
    company: Company;

    @Column()
    company_id: string;

    @Column("jsonb", { nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
```

## Bước 2: Tạo Chức Năng Đăng Ký Và Quản Lý Người Dùng

### Câu Hỏi Cho AI:
```
"Viết controller TypeScript với Express để xử lý đăng ký người dùng mới trong hệ thống B2B. 
Cần bao gồm:
- Kiểm tra email đã tồn tại chưa
- Mã hóa mật khẩu với bcrypt
- Tạo tài khoản kèm thông tin công ty
- Xác thực email và gửi thông báo
- Transaction để đảm bảo tính nhất quán
- Validation đầy đủ với Joi
Sử dụng TypeORM và PostgreSQL."
```

### Kết Quả Thực Tế Từ Dự Án Tubex:
```typescript
// Backend/src/services/auth/controller.ts
export const register = async (req: Request, res: Response, next: NextFunction) => {
    const userRepository = AppDataSource.getRepository(User);
    const companyRepository = AppDataSource.getRepository(Company);

    try {
        const { email, password, company, firstName, lastName, userRole = 'admin' } = req.body;

        // Kiểm tra người dùng đã tồn tại
        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new AppError(400, 'Người dùng với email này đã tồn tại');
        }

        // Kiểm tra mã số thuế công ty trùng lặp
        const existingCompany = await companyRepository.findOne({ 
            where: { tax_id: company.taxId }
        });
        if (existingCompany) {
            throw new AppError(400, 'Một công ty với mã số thuế này đã được đăng ký');
        }

        // Tạo công ty với thông tin chi tiết
        const newCompany = new Company();
        newCompany.name = company.name;
        newCompany.type = company.type;
        newCompany.tax_id = company.taxId;
        newCompany.business_license = company.businessLicense;
        newCompany.address = company.address;
        newCompany.business_category = company.businessCategory || '';
        newCompany.employee_count = company.employeeCount || 0;
        newCompany.year_established = company.yearEstablished || new Date().getFullYear();
        newCompany.contact_phone = company.contactPhone;
        newCompany.status = 'pending_verification';
        newCompany.subscription_tier = 'free';
        
        await companyRepository.save(newCompany);

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        // Tạo người dùng
        const user = new User();
        user.email = email;
        user.password_hash = passwordHash;
        user.role = userRole;
        user.company = newCompany;
        user.status = 'pending';
        
        // Thêm thông tin cá nhân vào metadata
        user.metadata = {
            firstName: firstName || '',
            lastName: lastName || ''
        };
        
        await userRepository.save(user);

        // Tạo token xác thực email
        const emailVerificationToken = jwt.sign(
            { id: user.id },
            config.jwt.secret as jwt.Secret,
            { expiresIn: '24h' }
        );

        // Lưu token xác thực vào Redis
        await redisClient.set(`email_verification:${user.id}`, emailVerificationToken, {
            EX: 24 * 60 * 60 // 24 giờ
        });

        // Gửi email xác thực
        await sendVerificationEmail(email, emailVerificationToken);

        res.status(201).json({
            status: 'success',
            message: 'Người dùng đã được đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản của bạn.',
            data: {
                userId: user.id,
                email: user.email,
                companyId: newCompany.id,
                companyName: newCompany.name
            }
        });
    } catch (error) {
        next(error);
    }
};
```

## Bước 3: Xây Dựng Hệ Thống Phân Quyền Và Bảo Mật

### Câu Hỏi Cho AI:
```
"Tạo middleware Express để kiểm soát quyền truy cập trong hệ thống quản lý người dùng doanh nghiệp.
Cần có:
- Middleware xác thực người dùng đã đăng nhập
- Kiểm tra vai trò admin công ty
- Ngăn người dùng tự chỉnh sửa thông tin của mình
- Phân quyền dựa trên công ty (multi-tenant)
- Xử lý lỗi và trả về thông báo phù hợp
Sử dụng JWT và TypeScript."
```

### Kết Quả Thực Tế Từ Dự Án Tubex:
```typescript
// Backend/src/middleware/adminAuth.ts
export const isCompanyAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new AppError(401, 'Cần xác thực để truy cập');
        }

        if (req.user.role !== 'admin') {
            throw new AppError(403, 'Chỉ quản trị viên công ty mới có thể thực hiện hành động này');
        }

        next();
    } catch (error) {
        next(error);
    }
};

export const canManageUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new AppError(401, 'Cần xác thực để truy cập');
        }

        if (req.user.id === req.params.userId) {
            throw new AppError(400, 'Bạn không thể chỉnh sửa thông tin tài khoản của chính mình');
        }

        next();
    } catch (error) {
        next(error);
    }
};

// Backend/src/services/user-management/controller.ts
export const updateUserRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const { role, status, reason } = req.body;
        const targetUserId = req.params.userId;

        // Tìm người dùng trong cùng công ty
        const targetUser = await queryRunner.manager.findOne(User, {
            where: { 
                id: targetUserId,
                company: { id: req.user.companyId }
            }
        });

        if (!targetUser) {
            throw new AppError(404, 'Người dùng không tồn tại');
        }

        // Ngăn tự chỉnh sửa
        if (targetUser.id === req.user.id) {
            throw new AppError(400, 'Bạn không thể chỉnh sửa vai trò hoặc trạng thái của chính mình');
        }

        // Tạo bản ghi kiểm toán
        const auditLog = new UserAuditLog();
        auditLog.target_user_id = targetUser.id;
        auditLog.performed_by_id = req.user.id;
        auditLog.action = role !== targetUser.role ? 'role_update' : 'status_update';
        auditLog.changes = {
            previous: {
                role: targetUser.role,
                status: targetUser.status
            },
            new: {
                role,
                status
            }
        };
        auditLog.reason = reason;

        // Cập nhật người dùng
        targetUser.role = role;
        targetUser.status = status;

        await queryRunner.manager.save(targetUser);
        await queryRunner.manager.save(auditLog);
        await queryRunner.commitTransaction();

        // Gửi thông báo thay đổi
        try {
            await sendUserStatusChangeEmail(targetUser.email, status, reason);
        } catch (emailError) {
            console.error('Gửi email thông báo thay đổi thất bại:', emailError);
        }

        res.json({
            success: true,
            message: 'Người dùng đã được cập nhật thành công',
            data: {
                id: targetUser.id,
                role: targetUser.role,
                status: targetUser.status
            }
        });
    } catch (error) {
        await queryRunner.rollbackTransaction();
        next(error);
    } finally {
        await queryRunner.release();
    }
};
```

## Bước 4: Tạo API Quản Lý Người Dùng Hoàn Chỉnh

### Câu Hỏi Cho AI:
```
"Viết các API endpoints cho quản lý người dùng trong hệ thống doanh nghiệp.
Cần có:
- GET /users - Lấy danh sách người dùng với phân trang
- POST /users - Tạo người dùng mới
- PUT /users/:id - Cập nhật thông tin người dùng
- DELETE /users/:id - Xóa người dùng
- PUT /users/:id/status - Thay đổi trạng thái

Bao gồm:
- Validation với Joi
- Swagger documentation
- Error handling
- Authentication middleware
- Role-based authorization"
```

### Kết Quả Thực Tế Từ Dự Án Tubex:
```typescript
// Backend/src/services/user/routes.ts
import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from './controller';
import { validateUserUpdate } from './validators';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/asyncHandler';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lấy tất cả người dùng
 *     tags: [Users]
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *         description: Số trang cho phân trang
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *         description: Số mục trên mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách người dùng
 */
router.get('/', asyncHandler(getAllUsers));

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Lấy người dùng theo ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết người dùng
 *       404:
 *         description: Người dùng không tồn tại
 */
router.get('/:id', asyncHandler(getUserById));

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Cập nhật một người dùng
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Người dùng đã được cập nhật thành công
 */
router.put('/:id', validateUserUpdate, asyncHandler(updateUser));

router.delete('/:id', asyncHandler(deleteUser));

export default router;

// Backend/src/services/user/controller.ts
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    const userRepository = AppDataSource.getRepository(User);

    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [users, total] = await userRepository.findAndCount({
            skip,
            take: Number(limit),
            select: ['id', 'email', 'role', 'status', 'created_at'],
            relations: ['company'],
            order: { created_at: 'DESC' }
        });

        res.status(200).json({
            status: 'success',
            data: { users, total, page: Number(page), limit: Number(limit) }
        });
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    const userRepository = AppDataSource.getRepository(User);

    try {
        const { id } = req.params;
        const { email, role, status } = req.body;

        const user = await userRepository.findOne({ where: { id } });
        if (!user) {
            throw new AppError(404, 'Người dùng không tồn tại');
        }

        // Chỉ cập nhật các trường được cung cấp
        if (email) user.email = email;
        if (role) user.role = role;
        if (status) user.status = status;

        user.updated_at = new Date();
        await userRepository.save(user);

        res.status(200).json({
            status: 'success',
            message: 'Người dùng đã được cập nhật thành công',
            data: {
                id: user.id,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        next(error);
    }
};
```

## Bước 5: Tạo Giao Diện Quản Lý Người Dùng React

### Câu Hỏi Cho AI:
```
"Tạo component React TypeScript để quản lý người dùng trong hệ thống doanh nghiệp.
Cần có:
- Danh sách người dùng với Material-UI DataGrid
- Form thêm/sửa người dùng với validation
- Tìm kiếm và lọc theo vai trò, trạng thái
- Modal xác nhận khi xóa
- Loading states và error handling
- Responsive design cho mobile
- Integration với API backend

Sử dụng Material-UI, React Hook Form, và TypeScript."
```

### Kết Quả Thực Tế Từ Dự Án Tubex:
```tsx
// Frontend/app/src/pages/UserManagement.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Paper, Button, TextField,
  Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  CircularProgress, Alert, Tabs, Tab
} from '@mui/material';
import { userManagementService, UserListParams, UserListResponse } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const companyId = user?.companyId;

  // State quản lý
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State dialog người dùng
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    role: '',
    isActive: true
  });
  const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>({});

  // State xác nhận
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: UserListParams = {
        company_id: companyId,
        search: searchQuery || undefined,
      };

      const response: UserListResponse = await userManagementService.getUsers(params);
      setUsers(response.data || []);
    } catch (err: any) {
      console.error('Lỗi khi lấy danh sách người dùng:', err);
      setError(err.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSave = async () => {
    if (!validateUserForm()) return;
    
    setLoading(true);
    try {
      if (selectedUser) {
        const updateData = {
          firstName: userFormData.name.split(' ')[0],
          lastName: userFormData.name.split(' ').slice(1).join(' ') || '',
          email: userFormData.email,
          role: userFormData.role,
          status: userFormData.isActive ? 'active' : 'inactive',
          companyId: companyId ?? '',
        };
        await userManagementService.updateUser(selectedUser.id, updateData);
      } else {
        const createData = {
          firstName: userFormData.name.split(' ')[0],
          lastName: userFormData.name.split(' ').slice(1).join(' ') || '',
          email: userFormData.email,
          password: 'defaultPassword123',
          role: userFormData.role,
          status: userFormData.isActive ? 'active' : 'inactive',
          companyId: companyId ?? '',
        };
        await userManagementService.createUser(createData);
      }
      
      fetchUsers();
      closeUserDialog();
    } catch (err: any) {
      console.error('Lỗi khi lưu người dùng:', err);
      setError(err.message || 'Không thể lưu người dùng');
    } finally {
      setLoading(false);
    }
  };

  const validateUserForm = () => {
    const errors: Record<string, string> = {};
    
    if (!userFormData.name.trim()) {
      errors['name'] = 'Tên là bắt buộc';
    }
    
    if (!userFormData.email.trim()) {
      errors['email'] = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(userFormData.email)) {
      errors['email'] = 'Định dạng email không hợp lệ';
    }
    
    if (!userFormData.role) {
      errors['role'] = 'Vai trò là bắt buộc';
    }
    
    setUserFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Quản Lý Người Dùng
        </Typography>
        <Button variant="contained" color="primary" onClick={() => setUserDialogOpen(true)}>
          Thêm Người Dùng
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Bảng người dùng */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 2 }}>
          {users.map((user) => (
            <Box key={user.id} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">{user.firstName} {user.lastName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email} • {user.role} • {user.status}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}

      {/* Dialog thêm/sửa người dùng */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Sửa Người Dùng' : 'Thêm Người Dùng Mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Tên đầy đủ"
              fullWidth
              value={userFormData.name}
              onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
              error={!!userFormErrors.name}
              helperText={userFormErrors.name}
            />
            
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={userFormData.email}
              onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
              error={!!userFormErrors.email}
              helperText={userFormErrors.email}
            />
            
            <FormControl fullWidth error={!!userFormErrors.role}>
              <InputLabel>Vai trò</InputLabel>
              <Select
                value={userFormData.role}
                label="Vai trò"
                onChange={(e) => setUserFormData(prev => ({ ...prev, role: e.target.value }))}
              >
                <MenuItem value="admin">Quản trị viên</MenuItem>
                <MenuItem value="manager">Quản lý</MenuItem>
                <MenuItem value="staff">Nhân viên</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={userFormData.isActive}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
              }
              label="Đang hoạt động"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleUserSave} variant="contained" color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement;
```

## Mẹo Sử Dụng AI Hiệu Quả

### 1. Hỏi Theo Từng Bước Nhỏ
- Thay vì hỏi "Tạo hệ thống quản lý người dùng"
- Hãy hỏi "Tạo hàm thêm người dùng mới"

### 2. Yêu Cầu Giải Thích
- Luôn thêm "Giải thích từng bước"
- Yêu cầu ví dụ cụ thể

### 3. Kiểm Tra Bảo Mật
- Hỏi về cách bảo vệ thông tin
- Yêu cầu kiểm tra lỗi bảo mật

### 4. Tối Ưu Hóa Hiệu Suất
- Hỏi cách xử lý khi có nhiều người dùng
- Yêu cầu tối ưu truy vấn cơ sở dữ liệu

Bằng cách làm theo các bước này, bạn sẽ có một hệ thống quản lý người dùng hoàn chỉnh và chuyên nghiệp!
