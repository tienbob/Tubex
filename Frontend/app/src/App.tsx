import React from 'react';
import './App.css';
import { 
  WhiteLabelLayout,
  WhiteLabelProvider
} from './components/whitelabel';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// Component imports
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ProductList from './components/products/ProductList';
import ProtectedRoute from './components/routing/ProtectedRoute';
import AdminEmployeeVerification from './components/admin/AdminEmployeeVerification';

// Page component imports
import LandingPage from './components/pages/LandingPage';
import Home from './components/pages/Home';
import Unauthorized from './components/pages/Unauthorized';
import PageNotFound from './components/pages/PageNotFound';
import Orders from './components/pages/Orders';
import Inventory from './components/pages/Inventory';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <WhiteLabelProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={
                <WhiteLabelLayout>
                  <LandingPage />
                </WhiteLabelLayout>
              } />
            
              <Route path="/login" element={
                <WhiteLabelLayout>
                  <LoginForm />
                </WhiteLabelLayout>
              } />
              
              <Route path="/register" element={
                <WhiteLabelLayout>
                  <RegisterForm />
                </WhiteLabelLayout>
              } />
              
              <Route path="/unauthorized" element={
                <WhiteLabelLayout>
                  <Unauthorized />
                </WhiteLabelLayout>
              } />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <WhiteLabelLayout>
                    <Home />
                  </WhiteLabelLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/products" element={
                <ProtectedRoute>
                  <WhiteLabelLayout>
                    <ProductList />
                  </WhiteLabelLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/orders" element={
                <ProtectedRoute>
                  <WhiteLabelLayout>
                    <Orders />
                  </WhiteLabelLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/inventory" element={
                <ProtectedRoute role={["dealer", "supplier"]}>
                  <WhiteLabelLayout>
                    <Inventory />
                  </WhiteLabelLayout>
                </ProtectedRoute>
              } />
              
              {/* Admin routes */}
              <Route path="/admin/employee-verification" element={
                <ProtectedRoute role="admin">
                  <WhiteLabelLayout>
                    <AdminEmployeeVerification />
                  </WhiteLabelLayout>
                </ProtectedRoute>
              } />
              
              {/* Catch all route - 404 */}
              <Route path="*" element={
                <WhiteLabelLayout>
                  <PageNotFound />
                </WhiteLabelLayout>
              } />
            </Routes>
          </WhiteLabelProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
