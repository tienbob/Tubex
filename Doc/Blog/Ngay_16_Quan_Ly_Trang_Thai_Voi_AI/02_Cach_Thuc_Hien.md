# Cách Thực Hiện: Xây Dựng Quản Lý Trạng Thái với AI

## Bước 1: Thiết Kế Kiến Trúc Trạng Thái

### Prompt AI Hiệu Quả
```
"Thiết kế kiến trúc quản lý trạng thái cho ứng dụng React B2B với:
- Trạng thái global (Redux)
- Trạng thái server (React Query) 
- Trạng thái UI (Context API)
- TypeScript đầy đủ
- Persistence selective
- Performance tối ưu

Đưa ra cấu trúc thư mục và các file cần thiết."
```

### Cấu Trúc Thư Mục
```
src/store/
├── index.ts              # Cấu hình store chính
├── hooks.ts              # Custom hooks
├── slices/               # Redux slices
│   ├── userSlice.ts      # Quản lý user
│   ├── productSlice.ts   # Quản lý sản phẩm
│   ├── cartSlice.ts      # Giỏ hàng
│   └── uiSlice.ts        # Trạng thái UI
└── queries/              # React Query
    ├── userQueries.ts
    └── productQueries.ts
```

## Bước 2: Cấu Hình Redux Store

### Prompt Cấu Hình Store
```
"Tạo Redux store với TypeScript cho ứng dụng Tubex:
- Redux Toolkit với createSlice
- Redux Persist cho lưu trữ
- Type-safe với RootState
- Middleware thunk
- DevTools integration
- Selective persistence"
```

### Code Thực Tế
```typescript
// store/index.ts
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import userReducer from './slices/userSlice';
import cartReducer from './slices/cartSlice';
import uiReducer from './slices/uiSlice';

const persistConfig = {
  key: 'tubex-root',
  storage,
  whitelist: ['user', 'cart'], // Chỉ lưu user và cart
};

const rootReducer = combineReducers({
  user: userReducer,
  cart: cartReducer,
  ui: uiReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
```

## Bước 3: Tạo Redux Slices

### Prompt Tạo User Slice
```
"Tạo userSlice cho ứng dụng Tubex với:
- Trạng thái đăng nhập
- Thông tin profile user
- Permissions và roles
- Loading states
- Error handling
- TypeScript interfaces đầy đủ"
```

### User Slice Implementation
```typescript
// store/slices/userSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'manager';
  company: string;
  avatar?: string;
}

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  token: string | null;
}

const initialState: UserState = {
  currentUser: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  token: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'user/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        throw new Error('Đăng nhập thất bại');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.token = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError, updateProfile } = userSlice.actions;
export default userSlice.reducer;
```

## Bước 4: Tích Hợp React Query

### Prompt React Query Setup
```
"Cấu hình React Query cho ứng dụng Tubex:
- QueryClient với caching thông minh
- Error handling global
- Retry logic
- Stale time optimization
- DevTools integration
- TypeScript support"
```

### React Query Configuration
```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 phút
      cacheTime: 10 * 60 * 1000, // 10 phút
      retry: (failureCount, error: any) => {
        if (error?.status === 404) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### Product Queries
```typescript
// store/queries/productQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/productService';

export const useProducts = (filters?: any) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getProducts(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProduct(id),
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: productService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
```

## Bước 5: Custom Hooks

### Prompt Custom Hooks
```
"Tạo custom hooks type-safe cho Tubex:
- useAppSelector và useAppDispatch
- useAuth hook với các chức năng auth
- useCart hook với cart operations
- useLocalStorage hook với TypeScript
- Error handling và loading states"
```

### Type-Safe Hooks
```typescript
// store/hooks.ts
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { useMemo } from 'react';
import type { RootState, AppDispatch } from './index';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Auth Hook
export const useAuth = () => {
  const user = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();

  return useMemo(() => ({
    user: user.currentUser,
    isAuthenticated: user.isAuthenticated,
    loading: user.loading,
    error: user.error,
    login: (credentials: any) => dispatch(loginUser(credentials)),
    logout: () => dispatch(logout()),
    clearError: () => dispatch(clearError()),
  }), [user, dispatch]);
};

// Cart Hook
export const useCart = () => {
  const cart = useAppSelector((state) => state.cart);
  const dispatch = useAppDispatch();

  const totalItems = useMemo(() => 
    cart.items.reduce((sum, item) => sum + item.quantity, 0),
    [cart.items]
  );

  const totalPrice = useMemo(() =>
    cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    [cart.items]
  );

  return {
    items: cart.items,
    totalItems,
    totalPrice,
    addItem: (product: any) => dispatch(addToCart(product)),
    removeItem: (id: string) => dispatch(removeFromCart(id)),
    clearCart: () => dispatch(clearCart()),
  };
};
```

## Bước 6: Performance Optimization

### Memoized Selectors
```typescript
// store/selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './index';

const selectCartItems = (state: RootState) => state.cart.items;
const selectProducts = (state: RootState) => state.product.items;

export const selectCartWithProductDetails = createSelector(
  [selectCartItems, selectProducts],
  (cartItems, products) => {
    return cartItems.map(cartItem => ({
      ...cartItem,
      product: products.find(p => p.id === cartItem.productId),
    }));
  }
);

export const selectCartTotal = createSelector(
  [selectCartItems],
  (items) => items.reduce((total, item) => total + (item.price * item.quantity), 0)
);
```

## Bước 7: Context API cho UI State

### Theme Context
```typescript
// contexts/ThemeContext.tsx
import React, { createContext, useContext, useReducer } from 'react';

interface ThemeState {
  mode: 'light' | 'dark';
  sidebarCollapsed: boolean;
  language: 'vi' | 'en';
}

type ThemeAction = 
  | { type: 'TOGGLE_THEME' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_LANGUAGE'; payload: 'vi' | 'en' };

const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
  switch (action.type) {
    case 'TOGGLE_THEME':
      return { ...state, mode: state.mode === 'light' ? 'dark' : 'light' };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    default:
      return state;
  }
};

const ThemeContext = createContext<{
  state: ThemeState;
  dispatch: React.Dispatch<ThemeAction>;
} | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme phải được sử dụng trong ThemeProvider');
  }
  return context;
};
```

## Bước 8: Testing State Management

### Test Redux Slices
```typescript
// __tests__/userSlice.test.ts
import { configureStore } from '@reduxjs/toolkit';
import userReducer, { loginUser, logout } from '../store/slices/userSlice';

const createTestStore = () => {
  return configureStore({
    reducer: { user: userReducer },
  });
};

describe('userSlice', () => {
  it('should handle logout', () => {
    const store = createTestStore();
    store.dispatch(logout());
    
    const state = store.getState().user;
    expect(state.isAuthenticated).toBe(false);
    expect(state.currentUser).toBeNull();
  });
});
```

## Lưu Ý Quan Trọng

### 1. Type Safety
- Luôn định nghĩa interface đầy đủ
- Sử dụng TypeScript strict mode
- Type guards cho runtime safety

### 2. Performance
- Sử dụng memoized selectors
- Tránh tạo objects trong render
- Lazy load states khi cần thiết

### 3. Error Handling
- Global error boundaries
- Retry logic thông minh
- User-friendly error messages

### 4. Testing
- Unit tests cho reducers
- Integration tests cho hooks
- E2E tests cho user flows
