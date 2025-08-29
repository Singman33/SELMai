import React, { useState, useEffect } from 'react';
import { Service, ServiceDisplay, Category } from '../types';
import { serviceAPI, categoryAPI } from '../services/api';

const MyServices: React.FC = () => {
  const [services, setServices] = useState<ServiceDisplay[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceDisplay | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    price: '',
    duration: '',
    serviceType: 'consumable' as 'renewable' | 'consumable',
    serviceCategory: 'offer' as 'offer' | 'request'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [servicesData, categoriesData] = await Promise.all([
        serviceAPI.getMyServices(),
        categoryAPI.getAll()
      ]);
      setServices(servicesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const serviceData = {
        title: formData.title,
        description: formData.description,
        category_id: parseInt(formData.categoryId),
        price: parseInt(formData.price),
        duration: formData.duration || undefined,
        service_type: formData.serviceType,
        service_category: formData.serviceCategory
      };

      if (editingService) {
        await serviceAPI.update(editingService.id, serviceData);
        alert('Service modifié avec succès !');
      } else {
        await serviceAPI.create(serviceData);
        alert('Service créé avec succès !');
      }

      resetForm();
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'opération');
    }
  };

  const handleEdit = (service: ServiceDisplay) => {
    setEditingService(service);
    setFormData({
      title: service.title || '',
      description: service.description || '',
      categoryId: (service.categoryId || '').toString(),
      price: (service.price || 0).toString(),
      duration: service.duration || '',
      serviceType: service.serviceType || 'consumable',
      serviceCategory: service.serviceCategory || 'offer'
    });
    setShowForm(true);
  };

  const handleDelete = async (serviceId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir désactiver ce service ? Il ne sera plus visible sur la place du marché.')) {
      try {
        await serviceAPI.delete(serviceId);
        alert('Service désactivé avec succès !');
        fetchData();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Erreur lors de la désactivation');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      categoryId: '',
      price: '',
      duration: '',
      serviceType: 'consumable',
      serviceCategory: 'offer'
    });
    setEditingService(null);
    setShowForm(false);
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Mes services</h1>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Créer un service
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h2>{editingService ? 'Modifier le service' : 'Créer un nouveau service'}</h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Titre *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Catégorie *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Sélectionnez une catégorie</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name || 'Catégorie sans nom'}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Prix (radis) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Catégorie de service *
              </label>
              <select
                value={formData.serviceCategory}
                onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value as 'offer' | 'request' })}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="offer">Offre - Je propose ce service</option>
                <option value="request">Demande - Je cherche ce service</option>
              </select>
              <small style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                <strong>Offre :</strong> Vous proposez ce service à d'autres utilisateurs.<br/>
                <strong>Demande :</strong> Vous recherchez quelqu'un qui peut fournir ce service.
              </small>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Type de service *
              </label>
              <select
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as 'renewable' | 'consumable' })}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="consumable">Consommable - Une seule utilisation (par défaut)</option>
                <option value="renewable">Renouvelable - Peut être accepté plusieurs fois</option>
              </select>
              <small style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                <strong>Consommable :</strong> Ne peut être acheté qu'une seule fois par client et devient indisponible après.<br/>
                <strong>Renouvelable :</strong> Peut être négocié et accepté plusieurs fois par différents clients.
              </small>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Durée (optionnel)
              </label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="ex: 2 heures, 1 journée..."
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {editingService ? 'Modifier' : 'Créer'}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services actifs */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', color: '#2c3e50' }}>Services actifs</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem'
        }}>
          {services.filter(service => !service.isConsumed).map(service => (
            <div key={service.id} style={{
              backgroundColor: service.serviceCategory === 'offer' ? '#e8f4fd' : '#fde8f4',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: `1px solid ${service.serviceCategory === 'offer' ? '#3498db' : '#e91e63'}`
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#2c3e50' }}>
                {service.title || 'Service sans titre'}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{
                  backgroundColor: service.serviceCategory === 'offer' ? '#3498db' : '#e91e63',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  {service.serviceCategory === 'offer' ? 'OFFRE' : 'DEMANDE'}
                </span>
                <span style={{
                  backgroundColor: service.serviceType === 'consumable' ? '#e74c3c' : '#3498db',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.8rem'
                }}>
                  {service.serviceType === 'consumable' ? 'Consommable' : 'Renouvelable'}
                </span>
                <span style={{
                  backgroundColor: service.isActive ? '#27ae60' : '#95a5a6',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.8rem'
                }}>
                  {service.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
            
            <p style={{ margin: '0 0 1rem 0' }}>
              {service.description || 'Aucune description'}
            </p>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <span style={{
                backgroundColor: '#ecf0f1',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                color: '#7f8c8d'
              }}>
                {service.categoryName || 'Catégorie inconnue'}
              </span>
              
              <span style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: '#27ae60'
              }}>
                {Number(service.price) || 0} radis
              </span>
            </div>
            
            {service.duration && (
              <p style={{
                fontSize: '0.9rem',
                color: '#7f8c8d',
                margin: '0 0 1rem 0'
              }}>
                Durée : {service.duration}
              </p>
            )}
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleEdit(service)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Modifier
              </button>
              
              <button
                onClick={() => handleDelete(service.id)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Désactiver
              </button>
            </div>
          </div>
          ))}
        </div>

        {services.filter(service => !service.isConsumed).length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#7f8c8d',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            Aucun service actif pour le moment.
          </div>
        )}
      </div>

      {/* Services consommés */}
      {services.filter(service => service.isConsumed).length > 0 && (
        <div>
          <h2 style={{ marginBottom: '1rem', color: '#7f8c8d' }}>Services consommés</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem'
          }}>
            {services.filter(service => service.isConsumed).map(service => (
              <div key={service.id} style={{
                backgroundColor: '#f8f9fa',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef',
                opacity: 0.8
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, color: '#6c757d' }}>
                    {service.title || 'Service sans titre'}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem'
                    }}>
                      Consommé
                    </span>
                    <span style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem'
                    }}>
                      Inactif
                    </span>
                  </div>
                </div>
                
                <p style={{ margin: '0 0 1rem 0', color: '#6c757d' }}>
                  {service.description || 'Aucune description'}
                </p>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <span style={{
                    backgroundColor: '#dee2e6',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    color: '#6c757d'
                  }}>
                    {service.categoryName || 'Catégorie inconnue'}
                  </span>
                  
                  <span style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: '#6c757d'
                  }}>
                    {Number(service.price) || 0} radis
                  </span>
                </div>
                
                {service.duration && (
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#6c757d',
                    margin: '0 0 1rem 0'
                  }}>
                    Durée : {service.duration}
                  </p>
                )}

                <div style={{
                  padding: '0.5rem',
                  backgroundColor: '#e9ecef',
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontSize: '0.9rem',
                  color: '#6c757d',
                  fontStyle: 'italic'
                }}>
                  Ce service consommable a été utilisé et n'est plus disponible
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {services.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#7f8c8d'
        }}>
          Vous n'avez pas encore créé de service.
        </div>
      )}
    </div>
  );
};

export default MyServices;