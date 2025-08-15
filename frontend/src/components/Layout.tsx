import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';

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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '1rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img 
              src="/logo.svg" 
              alt="SELMai Logo" 
              style={{ 
                height: '40px',
                width: '40px'
              }}
            />
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
              SELMai - Système d'échange local
            </h1>
          </div>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span>
                Bonjour, {user.firstName} ({(Number(user.balance) || 0).toFixed(2)} radis)
              </span>
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
        </div>
      </header>

      {/* Navigation */}
      {user && (
        <nav style={{
          backgroundColor: '#34495e',
          padding: '0.5rem 0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            gap: '0'
          }}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  padding: '1rem 1.5rem',
                  color: 'white',
                  textDecoration: 'none',
                  backgroundColor: isActive(item.path) ? '#2c3e50' : 'transparent',
                  borderRadius: '4px 4px 0 0',
                  transition: 'background-color 0.3s'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.backgroundColor = '#2c3e50';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
        minHeight: 'calc(100vh - 140px)'
      }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        textAlign: 'center',
        padding: '1rem',
        marginTop: '2rem'
      }}>
        <p style={{ margin: 0 }}>
          © 2024 SELMai - Martignas / Saint Jean d'Illac - Tous droits réservés
        </p>
      </footer>
    </div>
  );
};

export default Layout;