import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Layout.css';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠', permission: 'dashboard.view' },
    { path: '/new-service-order', label: 'Nova Ordem', icon: '➕', permission: 'orders.write' },
    { path: '/service-orders', label: 'Ordens de Serviço', icon: '📋', permission: 'orders.read' },
    { path: '/guincho', label: 'Guincho 24h', icon: '🚛', permission: 'orders.read' },
    { path: '/inventory', label: 'Estoque', icon: '📦', permission: 'inventory.read' },
    { path: '/customers', label: 'Clientes', icon: '👤', permission: 'customers.read' },
    { path: '/users', label: 'Funcionários', icon: '👥', permission: 'users.manage' },
    { path: '/reports', label: 'Relatórios', icon: '📊', permission: 'dashboard.view' },
    { path: '/settings', label: 'Configurações', icon: '⚙', permission: 'users.manage' },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.permission) return true;
    if (!user?.permissions) return true;
    const permissions = user.permissions.split(',');
    return permissions.indexOf(item.permission) >= 0;
  });

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src="/assets/logo.png" alt="Renovo" className="sidebar-logo" />
          <h2>Renovo Workshop</h2>
        </div>

        <nav className="sidebar-nav">
          {filteredMenuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className="nav-item"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <p className="user-name">{user?.fullName}</p>
              <p className="user-role">{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            Sair
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="top-header">
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <h1> Sistema de Gestão de Oficina</h1>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;