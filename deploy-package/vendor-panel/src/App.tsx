import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import CreateShop from './pages/CreateShop';

import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Settings from './pages/Settings';
import TestFeatures from './pages/TestFeatures';
import VendorAnalytics from './pages/VendorAnalytics';
import Reviews from './pages/Reviews';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuthStore } from './store/authStore';
import { useSocket } from './hooks/useSocket';
import './index.css';

function App() {
  const { isAuthenticated, user } = useAuthStore();
  useSocket(); // Initialize socket listener

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
          />
          <Route
            path="/forgot-password"
            element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />}
          />

          <Route
            path="/create-shop"
            element={
              <ProtectedRoute allowedRoles={['VENDOR']}>
                <CreateShop />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['VENDOR']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="analytics" element={<VendorAnalytics />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="settings" element={<Settings />} />
            <Route path="test-features" element={<TestFeatures />} />
          </Route>

          {/* Unauthorized Route */}
          <Route path="/unauthorized" element={
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
              <div className="text-red-600 font-bold text-2xl">Unauthorized Access</div>
              <div className="text-gray-700">
                Current Role: <span className="font-mono font-bold bg-gray-200 px-2 py-1 rounded">{user?.selectedRole || 'None'}</span>
              </div>
              {user?.roles && user.roles.length > 0 && (
                <div className="text-gray-600 text-sm">
                  Available Roles: {user.roles.join(', ')}
                </div>
              )}
              <p className="text-gray-500">You need 'VENDOR' role to access this area.</p>
              <button
                onClick={() => { useAuthStore.getState().clearAuth(); window.location.href = '/login'; }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Logout & Switch Account
              </button>
            </div>
          } />

          {/* Default Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;


