import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';
import './Layout.css';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Actualiser le compteur et le profil toutes les 30 secondes
      const interval = setInterval(() => {
        fetchUnreadCount();
        refreshUser();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, refreshUser]);

  // Rafraîchir le profil quand l'utilisateur navigue vers certaines pages
  useEffect(() => {
    if (user && (location.pathname === '/wallet' || location.pathname === '/admin/balances')) {
      refreshUser();
    }
  }, [location.pathname, user, refreshUser]);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.count);
    } catch (error) {
      console.error('Erreur lors du chargement du compteur de notifications:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/marketplace', label: 'Place du marché' },
    { path: '/my-services', label: 'Mes services' },
    { path: '/negotiations', label: 'Négociations' },
    { path: '/wallet', label: 'Porte-monnaie' },
    { path: '/community', label: 'Communauté' },
    {
      path: '/notifications',
      label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`
    },
  ];

  if (user?.isAdmin) {
    navItems.push({ path: '/admin', label: 'Administration' });
  }

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="layout-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <img
              src="/logo.svg"
              alt="SELMai Logo"
              className="logo-image"
            />
            <h1 className="site-title">
              SELMai
            </h1>
          </div>

          {/* Help Button */}
          <button
            onClick={() => window.open('/guide-utilisateur.html', '_blank')}
            className="help-btn"
            title="Guide utilisateur"
          >
            ?
          </button>

          {/* Desktop User Controls */}
          {user && (
            <div className="user-controls">
              <span>
                {user.firstName} ({Number(user.balance) || 0} radis)
              </span>
              <Link
                to="/settings"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                ⚙️ Paramètres
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Déconnexion
              </button>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          {user && (
            <button className="hamburger-btn" onClick={toggleMobileMenu}>
              ☰
            </button>
          )}
        </div>

        {/* Mobile Menu Dropdown */}
        {user && isMobileMenuOpen && (
          <div className="mobile-menu open">
            <div className="mobile-user-info">
              <p>Bonjour, {user.firstName}</p>
              <p>Solde: {Number(user.balance) || 0} radis</p>
            </div>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="mobile-nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ backgroundColor: isActive(item.path) ? '#34495e' : 'transparent' }}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/settings"
              className="mobile-nav-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ⚙️ Paramètres
            </Link>
            <button
              onClick={() => { window.open('/guide-utilisateur.html', '_blank'); setIsMobileMenuOpen(false); }}
              className="mobile-nav-link"
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ? Guide utilisateur
            </button>
            <button
              onClick={handleLogout}
              className="mobile-nav-link"
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c' }}
            >
              Déconnexion
            </button>
          </div>
        )}
      </header>

      {/* Desktop Navigation */}
      {user && (
        <nav className="nav-bar">
          <div className="nav-container">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p style={{ margin: 0 }}>
          © 2025 SELMai - Eric Delcamp - Tous droits réservés
        </p>
      </footer>
    </div>
  );
};

export default Layout;