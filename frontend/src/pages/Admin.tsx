import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { User, Service, Negotiation } from '../types';
import { userAPI, serviceAPI, negotiationAPI, notificationAPI } from '../services/api';
import { useError } from '../context/ErrorContext';

// Composants admin
const UserManagement: React.FC = () => {
  const { addError } = useError();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    isAdmin: false,
    isActive: true
  });

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
        await userAPI.updateUser(editingUser.id, formData);
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

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
      isActive: user.isActive || true
    });
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
            
            {!editingUser && (
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
                  {user.firstName} {user.lastName} (@{user.username})
                  {user.isAdmin && <span style={{ marginLeft: '0.5rem', backgroundColor: '#e74c3c', color: 'white', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>Admin</span>}
                </td>
                <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>{user.email}</td>
                <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>{(Number(user.balance) || 0).toFixed(2)} radis</td>
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
                        Supprimer
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
  const [users, setUsers] = useState<User[]>([]);
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
      await userAPI.adjustBalance(selectedUser as number, parseFloat(amount), description);
      addError('Solde ajusté avec succès !', 'success');
      setSelectedUser('');
      setAmount('');
      setDescription('');
      fetchUsers();
    } catch (error: any) {
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
            <label>Utilisateur</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value ? parseInt(e.target.value) : '')}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="">Sélectionnez un utilisateur</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} (Solde actuel: {(Number(user.balance) || 0).toFixed(2)} radis)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label>Montant (positif pour crédit, négatif pour débit)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          
          <div>
            <label>Description</label>
            <input
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
              <span>{user.firstName} {user.lastName}</span>
              <span style={{
                fontWeight: 'bold',
                color: (Number(user.balance) || 0) >= 0 ? '#27ae60' : '#e74c3c'
              }}>
                {(Number(user.balance) || 0).toFixed(2)} radis
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
  const [users, setUsers] = useState<User[]>([]);
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
                  {user.firstName} {user.lastName} (@{user.username})
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

const Admin: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/admin', label: 'Utilisateurs', exact: true },
    { path: '/admin/balances', label: 'Soldes' },
    { path: '/admin/notifications', label: 'Notifications' }
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
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Admin;