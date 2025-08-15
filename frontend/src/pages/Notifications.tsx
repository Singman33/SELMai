import React, { useState, useEffect } from 'react';
import { Notification } from '../types';
import { notificationAPI } from '../services/api';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationAPI.getAll();
      setNotifications(data);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(notifications.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      ));
    } catch (error) {
      console.error('Erreur lors du marquage:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
    } catch (error) {
      console.error('Erreur lors du marquage global:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'negotiation':
        return '🤝';
      case 'transaction':
        return '💰';
      case 'admin':
        return '👨‍💼';
      case 'system':
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'negotiation':
        return '#3498db';
      case 'transaction':
        return '#27ae60';
      case 'admin':
        return '#e74c3c';
      case 'system':
      default:
        return '#9b59b6';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') {
      return !notification.isRead;
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString || new Date());
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem' 
      }}>
        <h1>Notifications</h1>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Marquer tout comme lu
          </button>
        )}
      </div>

      {/* Filtres */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: filter === 'all' ? '#3498db' : '#ecf0f1',
              color: filter === 'all' ? 'white' : '#2c3e50',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Toutes ({notifications.length})
          </button>
          
          <button
            onClick={() => setFilter('unread')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: filter === 'unread' ? '#3498db' : '#ecf0f1',
              color: filter === 'unread' ? 'white' : '#2c3e50',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Non lues ({unreadCount})
          </button>
        </div>
      </div>

      {/* Liste des notifications */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {filteredNotifications.map(notification => (
          <div
            key={notification.id}
            onClick={() => !notification.isRead && markAsRead(notification.id)}
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: '1px solid #e0e0e0',
              borderLeft: `4px solid ${getNotificationColor(notification.notificationType || 'system')}`,

              cursor: !notification.isRead ? 'pointer' : 'default',
              opacity: notification.isRead ? 0.7 : 1,
              transition: 'opacity 0.3s'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'start',
              gap: '1rem'
            }}>
              <div style={{
                fontSize: '2rem',
                flexShrink: 0
              }}>
                {getNotificationIcon(notification.notificationType || 'system')}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '0.5rem'
                }}>
                  <h3 style={{
                    margin: 0,
                    color: '#2c3e50',
                    fontSize: '1.1rem',
                    fontWeight: notification.isRead ? 'normal' : 'bold'
                  }}>
                    {notification.title || 'Notification'}
                  </h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {!notification.isRead && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#e74c3c'
                      }} />
                    )}
                    
                    <span style={{
                      fontSize: '0.8rem',
                      color: '#95a5a6',
                      whiteSpace: 'nowrap'
                    }}>
                      {formatDate(notification.createdAt || new Date().toISOString())}
                    </span>
                  </div>
                </div>
                
                <p style={{
                  margin: 0,
                  color: '#7f8c8d',
                  lineHeight: '1.5'
                }}>
                  {notification.message || 'Aucun message'}
                </p>
                
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.8rem',
                  color: '#95a5a6'
                }}>
                  Type: {notification.notificationType || 'system'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#7f8c8d'
        }}>
          {filter === 'all' && 'Aucune notification.'}
          {filter === 'unread' && 'Aucune notification non lue.'}
        </div>
      )}

      {/* Résumé */}
      {notifications.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginTop: '2rem',
          textAlign: 'center',
          color: '#7f8c8d'
        }}>
          {unreadCount > 0 ? (
            <span>{unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''} sur {notifications.length} au total</span>
          ) : (
            <span>Toutes vos notifications sont à jour ✓</span>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;