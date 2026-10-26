import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ThemeProvider, useTheme } from '../hooks/useTheme';
import { APP_VERSION } from '../version';
import { FORKLIFT_QUOTES_PATH, TOW_QUOTES_PATH } from '../utils/towQuote/quoteKind';
import '../styles/Layout.css';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  permission?: string;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

const LayoutContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Menu por setor, como no app da equipe. Oficina e guincho são empresas
  // separadas; a empilhadeira faz parte do serviço do guincho. A OS de guincho
  // não tem "nova" aqui: ela nasce do orçamento aprovado.
  const menuSections: MenuSection[] = [
    {
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: '🏠', permission: 'dashboard.view' },
      ],
    },
    {
      title: 'Oficina',
      items: [
        { path: '/new-service-order', label: 'Nova Ordem', icon: '➕', permission: 'orders.write' },
        { path: '/service-orders', label: 'Ordens de Serviço', icon: '📋', permission: 'orders.read' },
        { path: '/orcamentos', label: 'Orçamentos', icon: '💰', permission: 'orders.read' },
        { path: '/vehicles', label: 'Veículos', icon: '🚗', permission: 'vehicles.read' },
        { path: '/inventory', label: 'Estoque', icon: '📦', permission: 'inventory.read' },
      ],
    },
    {
      title: 'Guincho',
      items: [
        { path: '/guincho', label: 'Guincho 24h', icon: '🚛', permission: 'orders.read' },
        { path: `${TOW_QUOTES_PATH}/novo`, label: 'Orçamento Guincho', icon: '🧾', permission: 'orders.write' },
        { path: '/custos-viagem', label: 'Custos de Viagem', icon: '🛣️', permission: 'orders.read' },
        { path: '/custos-viagem/consultar', label: 'Consultar custos', icon: '📈', permission: 'orders.read' },
        { path: TOW_QUOTES_PATH, label: 'Orçamentos salvos', icon: '🗂️', permission: 'orders.read' },
      ],
    },
    {
      title: 'Empilhadeiras',
      items: [
        { path: `${FORKLIFT_QUOTES_PATH}/novo`, label: 'Orçamento Empilhadeira', icon: '🏗️', permission: 'orders.write' },
        { path: `${TOW_QUOTES_PATH}?tipo=empilhadeira`, label: 'Orçamentos Empilhadeira', icon: '🗂️', permission: 'orders.read' },
      ],
    },
    {
      title: 'Geral',
      items: [
        { path: '/customers', label: 'Clientes', icon: '👤', permission: 'customers.read' },
        { path: '/users', label: 'Funcionários', icon: '👥', permission: 'users.manage' },
        { path: '/reports', label: 'Relatórios', icon: '📊', permission: 'dashboard.view' },
        { path: '/settings', label: 'Configurações', icon: '⚙', permission: 'users.manage' },
      ],
    },
  ];

  const canSee = (item: MenuItem) => {
    if (!item.permission) return true;
    if (!user?.permissions) return true;
    const permissions = user.permissions.split(',');
    return permissions.indexOf(item.permission) >= 0;
  };

  const visibleSections = menuSections
    .map(section => ({ ...section, items: section.items.filter(canSee) }))
    .filter(section => section.items.length > 0);

  return (
    <div className="layout" data-theme={theme}>
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src="/assets/logo.png" alt="Renovo" className="sidebar-logo" />
          <h2>Renovo Workshop</h2>
        </div>

        <nav className="sidebar-nav">
          {visibleSections.map(section => (
            <div key={section.title ?? 'inicio'} className="nav-section">
              {section.title && <p className="nav-section-title">{section.title}</p>}
              {section.items.map(item => (
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
            </div>
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
          <p className="app-version">Versão {APP_VERSION}</p>
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
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
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

const Layout: React.FC = () => (
  <ThemeProvider>
    <LayoutContent />
  </ThemeProvider>
);

export default Layout;