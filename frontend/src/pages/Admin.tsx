import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { User, UserDisplay, Service, ServiceDisplay, Category, Negotiation } from '../types';
import { userAPI, serviceAPI, negotiationAPI, notificationAPI } from '../services/api';
import { useError } from '../context/ErrorContext';
import { useAuth } from '../context/AuthContext';

// Helper pour formater les noms d'utilisateur
const formatUserName = (firstName?: string, lastName?: string, username?: string) => {
  const fullName = `${firstName || ''} ${lastName || ''}`.trim();
  return fullName || `@${username || 'utilisateur'}`;
};

// Composants admin
const UserManagement: React.FC = () => {
  const { addError } = useError();
  const [users, setUsers] = useState<UserDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDisplay | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    isAdmin: false,
    isActive: true
  });
  const [changePassword, setChangePassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await userAPI.getAllUsers();
      setUsers(data);
    } catch (error: any) {
      addError(
        error.userMessage || 'Erreur lors du chargement des utilisateurs',
        'error',
        error.userDetails
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const { password, ...baseData } = formData;
        const updateData = changePassword ? { ...baseData, password } : baseData;
        await userAPI.updateUser(editingUser.id, updateData);
        addError('Utilisateur modifié avec succès !', 'success');
      } else {
        await userAPI.createUser(formData);
        addError('Utilisateur créé avec succès !', 'success');
      }
      resetForm();
      fetchUsers();
    } catch (error: any) {
      addError(
        error.userMessage || 'Erreur lors de l\'opération',
        'error',
        error.userDetails
      );
    }
  };

  const handleDelete = async (userId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await userAPI.deleteUser(userId);
        addError('Utilisateur supprimé avec succès !', 'success');
        fetchUsers();
      } catch (error: any) {
        addError(
          error.userMessage || 'Erreur lors de la suppression',
          'error',
          error.userDetails
        );
      }
    }
  };

  const handleEdit = (user: UserDisplay) => {
    setEditingUser(user);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      password: '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      isAdmin: user.isAdmin || false,
      isActive: user.isActive || true
    });
    setChangePassword(false);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      isAdmin: false,
      isActive: true
    });
    setEditingUser(null);
    setChangePassword(false);
    setShowForm(false);
  };

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h2>Gestion des utilisateurs</h2>
        <button onClick={() => setShowForm(true)} style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#27ae60',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Nouvel utilisateur
        </button>
      </div>

      {showForm && (
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          border: '1px solid #ddd'
        }}>
          <h3>{editingUser ? 'Modifier' : 'Créer'} un utilisateur</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label>Nom d'utilisateur *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div>
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div>
              <label>Prénom *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div>
              <label>Nom *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            {!editingUser ? (
              <div>
                <label>Mot de passe *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            ) : (
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={changePassword}
                    onChange={(e) => setChangePassword(e.target.checked)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Changer le mot de passe
                </label>
                {changePassword && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <label>Nouveau mot de passe *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required={changePassword}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                )}
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label>
                <input
                  type="checkbox"
                  checked={formData.isAdmin}
                  onChange={(e) => setFormData({...formData, isAdmin: e.target.checked})}
                />
                Administrateur
              </label>
              
              <label>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                />
                Actif
              </label>
            </div>
            
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
              <button type="submit" style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                {editingUser ? 'Modifier' : 'Créer'}
              </button>
              
              <button type="button" onClick={resetForm} style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f8f9fa' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Utilisateur</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Email</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Solde</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Statut</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                  {formatUserName(user.firstName, user.lastName, user.username)}
                  {Boolean(user.isAdmin) && <span style={{ marginLeft: '0.5rem', backgroundColor: '#e74c3c', color: 'white', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>Admin</span>}
                </td>
                <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>{user.email || 'N/A'}</td>
                <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>{Number(user.balance) || 0} radis</td>
                <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                  <span style={{
                    backgroundColor: user.isActive ? '#27ae60' : '#e74c3c',
                    color: 'white',
                    padding: '0.2rem 0.4rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem'
                  }}>
                    {user.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleEdit(user)} style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}>
                      Modifier
                    </button>
                    
                    {user.id !== 1 && (
                      <button onClick={() => handleDelete(user.id)} style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}>
                        Désactiver
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BalanceManagement: React.FC = () => {
  const { addError } = useError();
  const { refreshUser } = useAuth();
  const [users, setUsers] = useState<UserDisplay[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | ''>('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await userAPI.getAllUsers();
      setUsers(data);
    } catch (error: any) {
      addError(
        error.userMessage || 'Erreur lors du chargement des utilisateurs',
        'error',
        error.userDetails
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !amount) return;

    try {
      console.log('💰 Ajustement du solde pour l\'utilisateur:', selectedUser, 'montant:', amount);
      await userAPI.adjustBalance(selectedUser as number, parseFloat(amount), description);
      addError('Solde ajusté avec succès !', 'success');
      setSelectedUser('');
      setAmount('');
      setDescription('');
      await fetchUsers();
      
      // Rafraîchir immédiatement le profil utilisateur
      console.log('🔄 Rafraîchissement du profil après ajustement...');
      await refreshUser();
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'ajustement:', error);
      addError(
        error.userMessage || 'Erreur lors de l\'ajustement',
        'error',
        error.userDetails
      );
    }
  };

  return (
    <div>
      <h2>Gestion des soldes</h2>
      
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h3>Ajuster le solde d'un utilisateur</h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
          <div>
            <label htmlFor="balance-user-select">Utilisateur</label>
            <select
              id="balance-user-select"
              name="selectedUser"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value ? parseInt(e.target.value) : '')}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="">Sélectionnez un utilisateur</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {formatUserName(user.firstName, user.lastName, user.username)} (Solde actuel: {Number(user.balance) || 0} radis)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="balance-amount-input">Montant (positif pour crédit, négatif pour débit)</label>
            <input
              id="balance-amount-input"
              name="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          
          <div>
            <label htmlFor="balance-description-input">Description</label>
            <input
              id="balance-description-input"
              name="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Raison de l'ajustement..."
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          
          <button type="submit" style={{
            padding: '0.75rem',
            backgroundColor: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Ajuster le solde
          </button>
        </form>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <h3 style={{ padding: '1rem', margin: 0, backgroundColor: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
          Soldes actuels
        </h3>
        
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {users.map(user => (
            <div key={user.id} style={{
              padding: '1rem',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{formatUserName(user.firstName, user.lastName, user.username)}</span>
              <span style={{
                fontWeight: 'bold',
                color: (Number(user.balance) || 0) >= 0 ? '#27ae60' : '#e74c3c'
              }}>
                {Number(user.balance) || 0} radis
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const NotificationManagement: React.FC = () => {
  const { addError } = useError();
  const [users, setUsers] = useState<UserDisplay[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | 'all' | ''>('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await userAPI.getAllUsers();
      setUsers(data.filter(user => user.isActive));
    } catch (error: any) {
      addError(
        error.userMessage || 'Erreur lors du chargement des utilisateurs',
        'error',
        error.userDetails
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !title || !message) return;

    try {
      if (selectedUser === 'all') {
        await notificationAPI.broadcast(title, message);
        addError('Notification diffusée à tous les utilisateurs !', 'success');
      } else {
        await notificationAPI.sendToUser(selectedUser as number, title, message);
        addError('Notification envoyée !', 'success');
      }
      
      setSelectedUser('');
      setTitle('');
      setMessage('');
    } catch (error: any) {
      addError(
        error.userMessage || 'Erreur lors de l\'envoi',
        'error',
        error.userDetails
      );
    }
  };

  return (
    <div>
      <h2>Gestion des notifications</h2>
      
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px'
      }}>
        <h3>Envoyer une notification</h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
          <div>
            <label>Destinataire</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value === 'all' ? 'all' : e.target.value ? parseInt(e.target.value) : '')}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="">Sélectionnez un destinataire</option>
              <option value="all">🌍 Tous les utilisateurs</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {formatUserName(user.firstName, user.lastName, user.username)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label>Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          
          <div>
            <label>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
            />
          </div>
          
          <button type="submit" style={{
            padding: '0.75rem',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            {selectedUser === 'all' ? 'Diffuser à tous' : 'Envoyer'}
          </button>
        </form>
      </div>
    </div>
  );
};

const ServiceManagement: React.FC = () => {
  const { addError } = useError();
  const [services, setServices] = useState<ServiceDisplay[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceDisplay | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'renewable' | 'consumable'>('all');
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    renewable: 0,
    consumable: 0,
    consumed: 0
  });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    price: '',
    duration: '',
    serviceType: 'consumable' as 'renewable' | 'consumable',
    serviceCategory: 'offer' as 'offer' | 'request',
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer les services admin avec plus de détails
      const response = await fetch('/api/services/admin/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des services');
      }
      
      const servicesData = await response.json();
      
      // Mapper les données au format ServiceDisplay
      const mappedServices = servicesData.map((service: any) => ({
        id: service.id,
        userId: service.user_id,
        title: service.title,
        description: service.description,
        categoryId: service.category_id,
        categoryName: service.category_name,
        price: service.price,
        duration: service.duration,
        serviceType: service.service_type,
        serviceCategory: service.service_category,
        isActive: service.is_active,
        username: service.username,
        firstName: service.first_name,
        lastName: service.last_name,
        userRating: service.rating,
        createdAt: service.created_at,
        updatedAt: service.updated_at,
        isConsumed: service.is_consumed === 1
      }));
      
      setServices(mappedServices);
      
      // Calculer les statistiques
      const stats = {
        total: mappedServices.length,
        active: mappedServices.filter((s: ServiceDisplay) => s.isActive).length,
        inactive: mappedServices.filter((s: ServiceDisplay) => !s.isActive).length,
        renewable: mappedServices.filter((s: ServiceDisplay) => s.serviceType === 'renewable').length,
        consumable: mappedServices.filter((s: ServiceDisplay) => s.serviceType === 'consumable').length,
        consumed: mappedServices.filter((s: ServiceDisplay) => s.isConsumed).length
      };
      setStatistics(stats);
      
      // Récupérer les catégories
      const categoriesResponse = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
      }
      
    } catch (error: any) {
      addError(
        error.message || 'Erreur lors du chargement des données',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        title: formData.title,
        description: formData.description,
        category_id: parseInt(formData.categoryId),
        price: parseInt(formData.price),
        duration: formData.duration || null,
        service_type: formData.serviceType,
        service_category: formData.serviceCategory,
        is_active: formData.isActive
      };

      if (editingService) {
        const response = await fetch(`/api/services/${editingService.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(submitData)
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la modification');
        }
        
        addError('Service modifié avec succès !', 'success');
      } else {
        const response = await fetch('/api/services', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(submitData)
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la création');
        }
        
        addError('Service créé avec succès !', 'success');
      }
      
      resetForm();
      fetchData();
    } catch (error: any) {
      addError(
        error.message || 'Erreur lors de l\'opération',
        'error'
      );
    }
  };

  const handleDelete = async (serviceId: number, serviceTitle: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir désactiver le service "${serviceTitle}" ? Il ne sera plus visible sur la place du marché.`)) {
      try {
        const response = await fetch(`/api/services/${serviceId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la désactivation');
        }
        
        addError('Service désactivé avec succès !', 'success');
        fetchData();
      } catch (error: any) {
        addError(
          error.message || 'Erreur lors de la désactivation',
          'error'
        );
      }
    }
  };

  const handleEdit = (service: ServiceDisplay) => {
    setEditingService(service);
    setFormData({
      title: service.title || '',
      description: service.description || '',
      categoryId: service.categoryId?.toString() || '',
      price: service.price?.toString() || '',
      duration: service.duration || '',
      serviceType: service.serviceType || 'consumable',
      serviceCategory: service.serviceCategory || 'offer',
      isActive: service.isActive ?? true
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      categoryId: '',
      price: '',
      duration: '',
      serviceType: 'consumable',
      serviceCategory: 'offer',
      isActive: true
    });
    setEditingService(null);
    setShowForm(false);
  };

  // Filtrer les services
  const filteredServices = services.filter(service => {
    const matchesSearch = !searchTerm || 
      service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatUserName(service.firstName, service.lastName, service.username).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && service.isActive) ||
      (statusFilter === 'inactive' && !service.isActive);
    
    const matchesType = typeFilter === 'all' || service.serviceType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h2>Gestion des services</h2>
        <button onClick={() => setShowForm(true)} style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#27ae60',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Nouveau service
        </button>
      </div>

      {/* Statistiques */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3498db' }}>{statistics.total}</div>
          <div style={{ color: '#7f8c8d' }}>Total services</div>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#27ae60' }}>{statistics.active}</div>
          <div style={{ color: '#7f8c8d' }}>Services actifs</div>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e74c3c' }}>{statistics.inactive}</div>
          <div style={{ color: '#7f8c8d' }}>Services inactifs</div>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f39c12' }}>{statistics.renewable}</div>
          <div style={{ color: '#7f8c8d' }}>Renouvelables</div>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#9b59b6' }}>{statistics.consumable}</div>
          <div style={{ color: '#7f8c8d' }}>Consommables</div>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#95a5a6' }}>{statistics.consumed}</div>
          <div style={{ color: '#7f8c8d' }}>Consommés</div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div style={{
        backgroundColor: 'white',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        border: '1px solid #ddd',
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gap: '1rem',
        alignItems: 'end'
      }}>
        <div>
          <label>Recherche</label>
          <input
            type="text"
            placeholder="Rechercher par titre, description ou utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label>Statut</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>
        <div>
          <label>Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="all">Tous types</option>
            <option value="renewable">Renouvelables</option>
            <option value="consumable">Consommables</option>
          </select>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          border: '1px solid #ddd'
        }}>
          <h3>{editingService ? 'Modifier' : 'Créer'} un service</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label>Titre *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div>
              <label>Catégorie *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">Sélectionnez une catégorie</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
                rows={3}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
              />
            </div>
            
            <div>
              <label>Prix (radis) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div>
              <label>Durée</label>
              <input
                type="text"
                placeholder="ex: 2 heures, 1 semaine..."
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div>
              <label>Catégorie de service</label>
              <select
                value={formData.serviceCategory}
                onChange={(e) => setFormData({...formData, serviceCategory: e.target.value as 'offer' | 'request'})}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="offer">Offre</option>
                <option value="request">Demande</option>
              </select>
            </div>
            
            <div>
              <label>Type de service</label>
              <select
                value={formData.serviceType}
                onChange={(e) => setFormData({...formData, serviceType: e.target.value as 'renewable' | 'consumable'})}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="consumable">Consommable (usage unique)</option>
                <option value="renewable">Renouvelable (usage multiple)</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  style={{ marginRight: '0.5rem' }}
                />
                Service actif
              </label>
            </div>
            
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
              <button type="submit" style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                {editingService ? 'Modifier' : 'Créer'}
              </button>
              
              <button type="button" onClick={resetForm} style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des services */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Services ({filteredServices.length})</h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Service</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Utilisateur</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Prix</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Catégorie</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Type</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Statut</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Créé le</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map(service => (
                <tr key={service.id} style={{ 
                  backgroundColor: service.serviceCategory === 'offer' ? '#f0f8ff' : '#fff0f8'
                }}>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #eee', verticalAlign: 'top' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{service.title}</div>
                      <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '0.25rem' }}>
                        {service.categoryName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#7f8c8d', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {service.description}
                      </div>
                      {service.duration && (
                        <div style={{ fontSize: '0.8rem', color: '#7f8c8d', fontStyle: 'italic' }}>
                          Durée: {service.duration}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                    <div>
                      <div>{formatUserName(service.firstName, service.lastName, service.username)}</div>
                      <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>@{service.username}</div>
                      {service.userRating && Number(service.userRating) > 0 && (
                        <div style={{ fontSize: '0.8rem', color: '#f39c12' }}>
                          ⭐ {Number(service.userRating).toFixed(1)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                    <strong>{service.price} radis</strong>
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                    <span style={{
                      backgroundColor: service.serviceCategory === 'offer' ? '#3498db' : '#e91e63',
                      color: 'white',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      {service.serviceCategory === 'offer' ? 'OFFRE' : 'DEMANDE'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                    <span style={{
                      backgroundColor: service.serviceType === 'renewable' ? '#f39c12' : '#9b59b6',
                      color: 'white',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem'
                    }}>
                      {service.serviceType === 'renewable' ? 'Renouvelable' : 'Consommable'}
                    </span>
                    {service.isConsumed && (
                      <div style={{ marginTop: '0.25rem' }}>
                        <span style={{
                          backgroundColor: '#95a5a6',
                          color: 'white',
                          padding: '0.2rem 0.4rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem'
                        }}>
                          Consommé
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                    <span style={{
                      backgroundColor: service.isActive ? '#27ae60' : '#e74c3c',
                      color: 'white',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem'
                    }}>
                      {service.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                    {service.createdAt ? new Date(service.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleEdit(service)} style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}>
                        Modifier
                      </button>
                      
                      <button onClick={() => handleDelete(service.id, service.title || '')} style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}>
                        Désactiver
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredServices.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#7f8c8d' }}>
              Aucun service trouvé
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Admin: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/admin', label: 'Utilisateurs', exact: true },
    { path: '/admin/balances', label: 'Soldes' },
    { path: '/admin/notifications', label: 'Notifications' },
    { path: '/admin/services', label: 'Services' }
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div>
      <h1>Administration</h1>
      
      {/* Navigation admin */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        marginBottom: '2rem',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0' }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                padding: '1rem 1.5rem',
                textDecoration: 'none',
                color: isActive(item.path, item.exact) ? '#3498db' : '#7f8c8d',
                backgroundColor: isActive(item.path, item.exact) ? '#f8f9fa' : 'transparent',
                borderBottom: isActive(item.path, item.exact) ? '2px solid #3498db' : '2px solid transparent',
                transition: 'all 0.3s'
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
        
        <div style={{ padding: '1.5rem' }}>
          <Routes>
            <Route path="/" element={<UserManagement />} />
            <Route path="/balances" element={<BalanceManagement />} />
            <Route path="/notifications" element={<NotificationManagement />} />
            <Route path="/services" element={<ServiceManagement />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Admin;