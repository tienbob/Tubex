import React, { Suspense } from 'react';
import './App.css';
import { 
  WhiteLabelLayout,
  WhiteLabelProvider
} from './components/whitelabel';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthRoute from './components/auth/AuthRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';

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
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <WhiteLabelProvider>
            <WhiteLabelLayout>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  {/* Authentication Routes (accessible only when not logged in) */}
                  <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
                  <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
                  <Route path="/forgot-password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />
                  <Route path="/reset-password" element={<AuthRoute><ResetPassword /></AuthRoute>} />
                  <Route path="/join" element={<AuthRoute><Join /></AuthRoute>} />
                  <Route path="/register/employee" element={<AuthRoute><Join /></AuthRoute>} />
                  <Route path="/auth/pending-approval" element={<PendingApproval />} />
                  <Route path="/auth/oauth-callback" element={<AuthRoute><Login /></AuthRoute>} />
                  
                  {/* Protected Routes (require authentication) */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
                  <Route path="/products" element={<ProtectedRoute><ProductManagement /></ProtectedRoute>} />
                  <Route path="/inventory" element={<ProtectedRoute><InventoryManagement /></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute><OrderManagement /></ProtectedRoute>} />
                  <Route path="/warehouses" element={<ProtectedRoute><WarehouseManagement /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  
                  {/* Fallback for unmatched routes - show 404 page */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </WhiteLabelLayout>
          </WhiteLabelProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
