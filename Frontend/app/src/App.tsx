import React from 'react';
import './App.css';
import { 
  WhiteLabelLayout,
  WhiteLabelProvider
} from './components/whitelabel';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthRoute from './components/auth/AuthRoute';

// Pages
import Dashboard from './pages/Dashboard';
import ProductManagement from './pages/ProductManagement';
import InventoryManagement from './pages/InventoryManagement';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Join from './pages/Join';
import PendingApproval from './pages/PendingApproval';

// Create a client
const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <WhiteLabelProvider>
          <WhiteLabelLayout>
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
              <Route path="/products" element={<ProtectedRoute><ProductManagement /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute><InventoryManagement /></ProtectedRoute>} />
              
              {/* Fallback for unmatched routes - redirect to login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </WhiteLabelLayout>
        </WhiteLabelProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
