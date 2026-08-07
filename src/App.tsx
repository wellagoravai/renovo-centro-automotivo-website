import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Header from './components/Header';
import Footer from './components/Footer';
import Layout from './components/Layout';
import ChatWidget from './components/ChatWidget';
import { AuthDebug } from './components/AuthDebug';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Services from './pages/Services';
import Products from './pages/Products';
import Portal from './pages/Portal';
import Dashboard from './pages/DashboardEnhanced';
import ServiceOrders from './pages/ServiceOrders';
import Inventory from './pages/Inventory';
import UsersManagement from './pages/UsersManagement';
import NewServiceOrderMobile from './pages/NewServiceOrderMobile';
import ServiceOrderDetails from './pages/ServiceOrderDetails';
import TowDashboard from './pages/TowDashboard';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import './styles/globals.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/portal" replace />;
  }

  return <>{children}</>;
};

const PublicLayout: React.FC = () => (
  <div className="public-layout">
    <Header />
    <main>
      <Outlet />
    </main>
    <Footer />
  </div>
);

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="services" element={<Services />} />
        <Route path="products" element={<Products />} />
        <Route path="contact" element={<Contact />} />
        <Route path="portal" element={<Portal />} />
      </Route>

      <Route
        path="/login"
        element={<Navigate to="/portal" replace />}
      />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
      <Route path="dashboard" element={<Dashboard />} />
        <Route path="new-service-order" element={<NewServiceOrderMobile />} />
        <Route path="service-orders" element={<ServiceOrders />} />
        <Route path="service-orders/:id" element={<ServiceOrderDetails />} />
        <Route path="guincho" element={<TowDashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="users" element={<UsersManagement />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <ChatWidget />
        <AuthDebug />
      </Router>
    </AuthProvider>
  );
};

export default App;