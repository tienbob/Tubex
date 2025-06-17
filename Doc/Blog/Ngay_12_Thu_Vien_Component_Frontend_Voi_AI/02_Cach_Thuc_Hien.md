# Ngày 12: Thư Viện Component Frontend Với AI - Cách Thực Hiện

## Bước 1: Thiết Kế Kiến Trúc Component

### Câu Hỏi Cho AI:
```
"Thiết kế kiến trúc component React TypeScript cho hệ thống B2B với:
- Nguyên tắc Atomic Design (atoms, molecules, organisms)
- Type safety với TypeScript
- Hệ thống theme có thể tùy chỉnh
- Hỗ trợ accessibility
- Cấu trúc thư mục tối ưu
- Integration với Material-UI"
```

### Kết Quả Thực Tế Từ Dự Án Tubex:
```
Frontend/app/src/components/
├── atoms/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.stories.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   ├── Input/
│   ├── Icon/
│   └── Typography/
├── molecules/
│   ├── SearchBox/
│   ├── FormField/
│   ├── ProductCard/
│   └── UserAvatar/
├── organisms/
│   ├── Header/
│   ├── Sidebar/
│   ├── ProductList/
│   └── OrderSummary/
├── templates/
│   ├── DashboardLayout/
│   ├── AuthLayout/
│   └── PublicLayout/
└── theme/
    ├── index.ts
    ├── colors.ts
    ├── typography.ts
    └── breakpoints.ts
```

## Bước 2: Tạo Base Components Với AI

### Câu Hỏi Cho AI:
```
"Tạo Button component React TypeScript với:
- Variants: primary, secondary, outlined, text
- Sizes: small, medium, large
- Hỗ trợ icon trái/phải
- Loading state và disabled state
- Full accessibility (ARIA, keyboard)
- Tích hợp Material-UI theme
- Props interface TypeScript đầy đủ"
```

### Kết Quả Thực Tế Từ Dự Án Tubex:
```tsx
// Frontend/app/src/components/atoms/Button/Button.tsx
import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

export interface ButtonProps extends Omit<MuiButtonProps, 'size'> {
  variant?: 'primary' | 'secondary' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  isFullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const StyledButton = styled(MuiButton)<ButtonProps>(({ theme, variant: customVariant, size }) => ({
  fontWeight: 600,
  textTransform: 'none',
  borderRadius: theme.spacing(1),
  transition: 'all 0.2s ease-in-out',
  
  // Custom variants
  ...(customVariant === 'primary' && {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      boxShadow: theme.shadows[4],
    },
  }),
  
  ...(customVariant === 'secondary' && {
    backgroundColor: theme.palette.grey[100],
    color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: theme.palette.grey[200],
    },
  }),
  
  // Custom sizes
  ...(size === 'small' && {
    padding: theme.spacing(0.5, 2),
    fontSize: '0.875rem',
  }),
  
  ...(size === 'large' && {
    padding: theme.spacing(1.5, 4),
    fontSize: '1.1rem',
  }),
}));

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  isFullWidth = false,
  leftIcon,
  rightIcon,
  disabled,
  onClick,
  ...props
}) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading || disabled) return;
    onClick?.(event);
  };

  return (
    <StyledButton
      variant={variant === 'primary' ? 'contained' : variant}
      size={size}
      fullWidth={isFullWidth}
      disabled={disabled || isLoading}
      onClick={handleClick}
      startIcon={!isLoading && leftIcon}
      endIcon={!isLoading && rightIcon}
      {...props}
    >
      {isLoading ? (
        <>
          <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
          Đang xử lý...
        </>
      ) : (
        children
      )}
    </StyledButton>
  );
};

export default Button;
```

## Bước 3: Xây Dựng Hệ Thống Theme

### Câu Hỏi Cho AI:
```
"Tạo hệ thống theme React với Material-UI hỗ trợ:
- Light/Dark mode switching
- Company branding colors (white-labeling)
- Typography scales responsive
- Spacing system nhất quán
- Breakpoints cho mobile/tablet/desktop
- TypeScript types cho theme"
```

### Kết Quả Thực Tế Từ Dự Án Tubex:
```typescript
// Frontend/app/src/theme/index.ts
import { createTheme, ThemeOptions } from '@mui/material/styles';
import { colors } from './colors';
import { typography } from './typography';
import { breakpoints } from './breakpoints';

export interface CustomTheme {
  mode: 'light' | 'dark';
  branding: {
    primary: string;
    secondary: string;
    logo: string;
  };
}

export const createCustomTheme = (customOptions?: Partial<CustomTheme>) => {
  const mode = customOptions?.mode || 'light';
  const branding = customOptions?.branding || {
    primary: '#1976d2',
    secondary: '#dc004e',
    logo: '/logo.png'
  };

  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: branding.primary,
        light: mode === 'light' ? colors.primary.light : colors.primary.dark,
        dark: mode === 'light' ? colors.primary.dark : colors.primary.light,
      },
      secondary: {
        main: branding.secondary,
      },
      background: {
        default: mode === 'light' ? '#fafafa' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
      text: {
        primary: mode === 'light' ? '#333333' : '#ffffff',
        secondary: mode === 'light' ? '#666666' : '#b3b3b3',
      },
    },
    typography: {
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
      ...typography,
    },
    breakpoints: {
      values: breakpoints,
    },
    spacing: 8,
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 8,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: 12,
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
};

// Theme Provider wrapper
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

interface ThemeProviderProps {
  children: React.ReactNode;
  customTheme?: Partial<CustomTheme>;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  customTheme 
}) => {
  const theme = createCustomTheme(customTheme);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};
```

## Bước 4: Tạo Complex Components

### Câu Hỏi Cho AI:
```
"Tạo ProductCard component cho hệ thống B2B với:
- Hình ảnh sản phẩm với lazy loading
- Thông tin giá và khuyến mãi
- Quick actions (Add to cart, Quick view)
- Responsive design
- Loading skeleton state
- Error handling cho ảnh bị lỗi
- TypeScript interface cho product data"
```

### Kết Quả Thực Tế Từ Dự Án Tubex:
```tsx
// Frontend/app/src/components/molecules/ProductCard/ProductCard.tsx
import React, { useState } from 'react';
import {
  Card, CardMedia, CardContent, CardActions,
  Typography, Button, Chip, Box, Skeleton,
  IconButton, Tooltip
} from '@mui/material';
import { Visibility, ShoppingCart, Favorite } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  inStock: boolean;
  rating?: number;
  reviewCount?: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  onQuickView?: (productId: string) => void;
  onFavorite?: (productId: string) => void;
  isLoading?: boolean;
}

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const PriceBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[2],
  '&:hover': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
}));

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onQuickView,
  onFavorite,
  isLoading = false
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  if (isLoading) {
    return <ProductCardSkeleton />;
  }

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  return (
    <StyledCard>
      <Box sx={{ position: 'relative' }}>
        {imageLoading && <Skeleton variant="rectangular" height={200} />}
        <CardMedia
          component="img"
          height="200"
          image={imageError ? '/placeholder-product.png' : product.imageUrl}
          alt={product.name}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
          sx={{ display: imageLoading ? 'none' : 'block' }}
        />
        
        {hasDiscount && (
          <Chip
            label={`-${discountPercent}%`}
            color="error"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              fontWeight: 'bold'
            }}
          />
        )}
        
        {!product.inStock && (
          <Chip
            label="Hết hàng"
            color="default"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
            }}
          />
        )}
        
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            opacity: 0,
            transition: 'opacity 0.3s',
            '.MuiCard-root:hover &': {
              opacity: 1,
            },
          }}
        >
          <Tooltip title="Yêu thích">
            <ActionButton size="small" onClick={() => onFavorite?.(product.id)}>
              <Favorite fontSize="small" />
            </ActionButton>
          </Tooltip>
          
          <Tooltip title="Xem nhanh">
            <ActionButton size="small" onClick={() => onQuickView?.(product.id)}>
              <Visibility fontSize="small" />
            </ActionButton>
          </Tooltip>
        </Box>
      </Box>

      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {product.category}
        </Typography>
        
        <Typography variant="h6" component="h2" noWrap>
          {product.name}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ 
          mt: 1,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {product.description}
        </Typography>
        
        <PriceBox>
          <Typography variant="h6" color="primary" fontWeight="bold">
            {product.price.toLocaleString('vi-VN')} ₫
          </Typography>
          
          {hasDiscount && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textDecoration: 'line-through' }}
            >
              {product.originalPrice!.toLocaleString('vi-VN')} ₫
            </Typography>
          )}
        </PriceBox>
        
        {product.rating && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              ⭐ {product.rating} ({product.reviewCount} đánh giá)
            </Typography>
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<ShoppingCart />}
          disabled={!product.inStock}
          onClick={() => onAddToCart?.(product.id)}
        >
          {product.inStock ? 'Thêm vào giỏ' : 'Hết hàng'}
        </Button>
      </CardActions>
    </StyledCard>
  );
};

const ProductCardSkeleton = () => (
  <Card sx={{ height: '100%' }}>
    <Skeleton variant="rectangular" height={200} />
    <CardContent>
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="40%" />
    </CardContent>
    <CardActions sx={{ p: 2 }}>
      <Skeleton variant="rectangular" width="100%" height={36} />
    </CardActions>
  </Card>
);
```

## Bước 5: Tạo Layout Templates

### Câu Hỏi Cho AI:
```
"Tạo DashboardLayout component cho admin panel với:
- Responsive sidebar navigation
- Header với user menu và notifications
- Breadcrumb navigation
- Content area với proper spacing
- Mobile-friendly hamburger menu
- Theme switching toggle
- TypeScript props cho navigation items"
```

### Kết Quả Thực Tế Từ Dự Án Tubex:
```tsx
// Frontend/app/src/components/templates/DashboardLayout/DashboardLayout.tsx
import React, { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography,
  Divider, IconButton, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Avatar, Menu, MenuItem,
  Breadcrumbs, Link, useTheme, useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon, ChevronLeft, Dashboard,
  Inventory, People, ShoppingCart, Settings,
  AccountCircle, Notifications, Brightness4, Brightness7
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const drawerWidth = 240;

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: NavigationItem[];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  onThemeToggle?: () => void;
}

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
  [theme.breakpoints.up('md')]: {
    marginLeft: open ? 0 : `-${drawerWidth}px`,
  },
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'space-between',
}));

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Tổng quan',
    icon: <Dashboard />,
    path: '/dashboard'
  },
  {
    id: 'products',
    label: 'Sản phẩm',
    icon: <Inventory />,
    path: '/products'
  },
  {
    id: 'orders',
    label: 'Đơn hàng',
    icon: <ShoppingCart />,
    path: '/orders'
  },
  {
    id: 'users',
    label: 'Người dùng',
    icon: <People />,
    path: '/users'
  },
  {
    id: 'settings',
    label: 'Cài đặt',
    icon: <Settings />,
    path: '/settings'
  }
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title = 'Dashboard',
  breadcrumbs = [],
  onThemeToggle
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={handleDrawerToggle}
            edge="start"
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          
          <IconButton color="inherit" onClick={onThemeToggle}>
            {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          
          <IconButton color="inherit">
            <Notifications />
          </IconButton>
          
          <IconButton
            color="inherit"
            onClick={handleMenuClick}
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              <AccountCircle />
            </Avatar>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>Hồ sơ</MenuItem>
            <MenuItem onClick={handleMenuClose}>Cài đặt</MenuItem>
            <Divider />
            <MenuItem onClick={handleMenuClose}>Đăng xuất</MenuItem>
          </Menu>
        </Toolbar>
        
        {breadcrumbs.length > 0 && (
          <Box sx={{ px: 3, pb: 1 }}>
            <Breadcrumbs>
              {breadcrumbs.map((breadcrumb, index) => (
                <Link
                  key={index}
                  color="inherit"
                  href={breadcrumb.href}
                  underline="hover"
                >
                  {breadcrumb.label}
                </Link>
              ))}
            </Breadcrumbs>
          </Box>
        )}
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="left"
        open={open}
        onClose={handleDrawerToggle}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <DrawerHeader>
          <Typography variant="h6" color="primary" fontWeight="bold">
            Tubex
          </Typography>
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeft />
          </IconButton>
        </DrawerHeader>
        
        <Divider />
        
        <List>
          {navigationItems.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Main open={open}>
        <DrawerHeader />
        {children}
      </Main>
    </Box>
  );
};
```

## Mẹo Sử Dụng AI Để Xây Dựng Component Library

### 1. Bắt Đầu Từ Đơn Giản
- Tạo component cơ bản trước (Button, Input)
- Sau đó kết hợp thành component phức tạp

### 2. Sử Dụng Design System
- Định nghĩa color palette và typography trước
- Tạo spacing và breakpoint system

### 3. TypeScript First
- Luôn yêu cầu AI tạo TypeScript interfaces
- Định nghĩa props rõ ràng và type-safe

### 4. Accessibility Quan Trọng
- Yêu cầu AI thêm ARIA attributes
- Hỗ trợ keyboard navigation

### 5. Testing và Documentation
- Tạo Storybook stories cho mỗi component
- Viết unit tests với React Testing Library

Với cách tiếp cận này, bạn sẽ có một thư viện component chuyên nghiệp và dễ maintain!
