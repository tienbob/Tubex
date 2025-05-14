import React, { Suspense } from 'react';
import './App.css';
import { 
  WhiteLabelLayout,
  WhiteLabelProvider
} from './components/whitelabel';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import MockApiToggle from './components/common/MockApiToggle';
import { MockDataProvider } from './contexts/MockDataContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as CustomThemeProvider } from './contexts/ThemeContext';
import { CompanySettingsProvider } from './contexts/CompanySettingsContext';
import defaultTheme from './config/theme';

// Pages
import Dashboard from './pages/Dashboard';
import ProductManagement from './pages/ProductManagement';
import InventoryManagement from './pages/InventoryManagement';
import OrderManagement from './pages/OrderManagement';
import WarehouseManagement from './pages/WarehouseManagement';
import UserProfile from './pages/UserProfile';
import Settings from './pages/Settings';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Join from './pages/Join';
import PendingApproval from './pages/PendingApproval';
import NotFound from './pages/NotFound';

// Create a client with better configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

const App: React.FC = () => {
  return (
    <ErrorBoundary>      
      <QueryClientProvider client={queryClient}>        <CustomThemeProvider>
          <ThemeProvider theme={defaultTheme}>
            <CssBaseline />
            <AuthProvider>
              <Router>
                <WhiteLabelProvider>
                  <CompanySettingsProvider>
                    <MockDataProvider>
                    <WhiteLabelLayout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <Routes>
                          {/* Public routes */}
                          <Route path="/login" element={<Login />} />
                          <Route path="/register" element={<Register />} />
                          <Route path="/forgot-password" element={<ForgotPassword />} />
                          <Route path="/auth/pending-approval" element={<PendingApproval />} />
                          
                          {/* Protected routes */}
                          <Route path="/" element={
                            <ProtectedRoute>
                              <Navigate to="/dashboard" replace />
                            </ProtectedRoute>
                          } />
                          <Route path="/dashboard" element={
                            <ProtectedRoute>
                              <Dashboard />
                            </ProtectedRoute>
                          } />
                          <Route path="/products" element={
                            <ProtectedRoute>
                              <ProductManagement />
                            </ProtectedRoute>
                          } />
                          <Route path="/inventory" element={
                            <ProtectedRoute>
                              <InventoryManagement />
                            </ProtectedRoute>
                          } />
                          <Route path="/warehouses" element={
                            <ProtectedRoute>
                              <WarehouseManagement />
                            </ProtectedRoute>
                          } />
                          <Route path="/orders" element={
                            <ProtectedRoute>
                              <OrderManagement />
                            </ProtectedRoute>
                          } />
                          
                          <Route path="/profile" element={
                            <ProtectedRoute>
                              <UserProfile />
                            </ProtectedRoute>
                          } />
                          
                          <Route path="/settings" element={
                            <ProtectedRoute>
                              <Settings />
                            </ProtectedRoute>
                          } />
                          
                          {/* 404 route */}
                          <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                      </Suspense>
                      {/* Add the mock API toggle component for development */}
                      {process.env.NODE_ENV === 'development' && <MockApiToggle />}
                    </WhiteLabelLayout>                  </MockDataProvider>
                  </CompanySettingsProvider>
                </WhiteLabelProvider>
              </Router>
            </AuthProvider>
          </ThemeProvider>
        </CustomThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
