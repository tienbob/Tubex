import React, { Suspense } from 'react';
import './App.css';
import { 
  WhiteLabelLayout,
  WhiteLabelProvider
} from './components/whitelabel';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/shared/ErrorBoundary';
import LoadingSpinner from './components/shared/LoadingSpinner';
import { AuthProvider } from './components/auth/AuthContext';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as CustomThemeProvider } from './contexts/ThemeContext';
import { CompanySettingsProvider } from './contexts/CompanySettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import defaultTheme from './config/theme';

// Pages
import Dashboard from './pages/Dashboard';
import ProductManagement from './pages/ProductManagement';
import InventoryManagement from './pages/InventoryManagement';
import OrderManagement from './pages/OrderManagement';
import PaymentManagement from './pages/PaymentManagement';
import WarehouseManagement from './pages/WarehouseManagement';
import UserManagement from './pages/UserManagement';
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
import InvoiceManagement from './pages/InvoiceManagement';
import QuoteManagement from './pages/QuoteManagement';
import PriceListManagement from './pages/PriceListManagement';

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
      <QueryClientProvider client={queryClient}>        
        <CustomThemeProvider>
          <ThemeProvider theme={defaultTheme}>
            <CssBaseline />
            <AuthProvider>
              <ToastProvider>
                <Router>                  
                  <WhiteLabelProvider>
                    <CompanySettingsProvider>
                      <Suspense fallback={<LoadingSpinner />}>
                        <Routes>
                          {/* Public routes - NO sidebar */}
                          <Route path="/login" element={<Login />} />
                          <Route path="/register" element={<Register />} />
                          <Route path="/forgot-password" element={<ForgotPassword />} />
                          <Route path="/reset-password/:token" element={<ResetPassword />} />
                          <Route path="/join" element={<Join />} />
                          <Route path="/join/:invitationCode" element={<Join />} />
                          <Route path="/auth/pending-approval" element={<PendingApproval />} />
                          
                          {/* Protected routes - WITH sidebar/layout */}
                          <Route path="/*" element={
                            <WhiteLabelLayout>
                              <Routes>
                                <Route path="/" element={
                                  <ProtectedRoute requiredPage="/dashboard">
                                    <Navigate to="/dashboard" replace />
                                  </ProtectedRoute>
                                } />
                                <Route path="/dashboard" element={
                                  <ProtectedRoute requiredPage="/dashboard">
                                    <Dashboard />
                                  </ProtectedRoute>
                                } />
                                <Route path="/analytics" element={
                                  <ProtectedRoute requiredPage="/analytics">
                                    <AnalyticsDashboard />
                                  </ProtectedRoute>
                                } />
                                <Route path="/users" element={
                                  <ProtectedRoute requiredPage="/users">
                                    <UserManagement />
                                  </ProtectedRoute>
                                } />
                                <Route path="/products" element={
                                  <ProtectedRoute requiredPage="/products">
                                    <ProductManagement />
                                  </ProtectedRoute>
                                } />
                                <Route path="/inventory" element={
                                  <ProtectedRoute requiredPage="/inventory">
                                    <InventoryManagement />
                                  </ProtectedRoute>
                                } />
                                <Route path="/warehouses" element={
                                  <ProtectedRoute requiredPage="/warehouses">
                                    <WarehouseManagement />
                                  </ProtectedRoute>
                                } />
                                <Route path="/orders" element={
                                  <ProtectedRoute requiredPage="/orders">
                                    <OrderManagement />
                                  </ProtectedRoute>
                                } />
                                <Route path="/payments" element={
                                  <ProtectedRoute requiredPage="/payments">
                                    <PaymentManagement />
                                  </ProtectedRoute>
                                } />
                                <Route path="/invoices/*" element={
                                  <ProtectedRoute requiredPage="/invoices">
                                    <InvoiceManagement />
                                  </ProtectedRoute>
                                } />
                                <Route path="/quotes" element={
                                  <ProtectedRoute requiredPage="/quotes">
                                    <QuoteManagement />
                                  </ProtectedRoute>
                                } />
                                <Route path="/pricelists" element={
                                  <ProtectedRoute requiredPage="/price-lists">
                                    <PriceListManagement />
                                  </ProtectedRoute>
                                } />
                                <Route path="/profile" element={
                                  <ProtectedRoute>
                                    <UserProfile />
                                  </ProtectedRoute>
                                } />
                                <Route path="/settings" element={
                                  <ProtectedRoute requiredPage="/settings">
                                    <Settings />
                                  </ProtectedRoute>
                                } />
                                
                                {/* 404 route */}
                                <Route path="*" element={<NotFound />} />
                              </Routes>
                            </WhiteLabelLayout>
                          } />
                        </Routes>
                      </Suspense>                        
                    </CompanySettingsProvider>
                  </WhiteLabelProvider>
                </Router>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </CustomThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
