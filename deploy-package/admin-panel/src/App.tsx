import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';


import Dashboard from './pages/Dashboard';
import VendorVerification from './pages/VendorVerification';
import Orders from './pages/Orders';
import DeliveryPartners from './pages/DeliveryPartners';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Coupons from './pages/Coupons';
import Payouts from './pages/Payouts';
import CommissionSettings from './pages/CommissionSettings';
import PayoutCycles from './pages/PayoutCycles';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import CityCommissions from './pages/CityCommissions';
import Cities from './pages/Cities';
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
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route
            path="/forgot-password"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPassword />}
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="vendors" element={<VendorVerification />} />
            <Route path="delivery-partners" element={<DeliveryPartners />} />
            <Route path="customers" element={<Customers />} />
            <Route path="products" element={<Products />} />
            <Route path="coupons" element={<Coupons />} />
            <Route path="payouts" element={<Payouts />} />
            <Route path="commission-settings" element={<CommissionSettings />} />
            <Route path="payout-cycles" element={<PayoutCycles />} />
            <Route path="city-commissions" element={<CityCommissions />} />
            <Route path="cities" element={<Cities />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Unauthorized Route */}
          <Route path="/unauthorized" element={
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
              <div className="text-red-600 font-bold text-2xl">Unauthorized Access</div>
              <div className="text-gray-700">
                Current Role: <span className="font-mono font-bold bg-gray-200 px-2 py-1 rounded">{user?.selectedRole || 'None'}</span>
              </div>
              <p className="text-gray-500">You need 'ADMIN' role to access this area.</p>
              <button
                onClick={() => { useAuthStore.getState().clearAuth(); window.location.href = '/login'; }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Logout & Switch Account
              </button>
            </div>
          } />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
