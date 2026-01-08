import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shops from './pages/Shops';
import ShopDetail from './pages/ShopDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

import VendorRegister from './pages/VendorRegister';
import Orders from './pages/Orders';
import TrackOrder from './pages/TrackOrder';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import { useSocket } from './hooks/useSocket';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

function App() {
  useSocket();

  // Service Worker disabled for now - requires proper build configuration
  // useEffect(() => {
  //   registerServiceWorker();
  // }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster position="top-right" />
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shops" element={<Shops />} />
              <Route path="/shops/:id" element={<ShopDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/vendor/register" element={<VendorRegister />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id/track" element={<TrackOrder />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
