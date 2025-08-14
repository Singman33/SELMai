import React, { useState, useEffect } from 'react';
import { Service, Category } from '../types';
import { serviceAPI, categoryAPI, negotiationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Marketplace: React.FC = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [negotiationForm, setNegotiationForm] = useState({
    proposedPrice: '',
    message: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [servicesData, categoriesData] = await Promise.all([
        serviceAPI.getAll(),
        categoryAPI.getAll()
      ]);
      setServices(servicesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesCategory = !selectedCategory || service.categoryId === selectedCategory;
    const matchesSearch = !searchTerm || 
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Ne pas afficher ses propres services
    const notOwnService = service.userId !== user?.id;
    
    return matchesCategory && matchesSearch && notOwnService && service.isActive;
  });

  const handleNegotiate = async (service: Service) => {
    setSelectedService(service);
    setNegotiationForm({
      proposedPrice: service.price.toString(),
      message: ''
    });
  };

  const submitNegotiation = async () => {
    if (!selectedService) return;

    try {
      await negotiationAPI.create({
        service_id: selectedService.id,
        proposed_price: parseFloat(negotiationForm.proposedPrice) || undefined,
        message: negotiationForm.message || undefined
      });

      alert('Négociation envoyée avec succès !');
      setSelectedService(null);
      setNegotiationForm({ proposedPrice: '', message: '' });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'envoi de la négociation');
    }
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div>
      <h1>Place du marché</h1>
      
      {/* Filtres */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Rechercher un service..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
        
        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
          style={{
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        >
          <option value="">Toutes les catégories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Liste des services */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem'
      }}>
        {filteredServices.map(service => (
          <div key={service.id} style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e0e0e0'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
              {service.title}
            </h3>
            
            <p style={{ 
              color: '#7f8c8d', 
              fontSize: '0.9rem',
              margin: '0 0 0.5rem 0'
            }}>
              Par {service.firstName} {service.lastName} 
              {service.userRating ? ` (${service.userRating.toFixed(1)} ⭐)` : ''}
            </p>
            
            <p style={{ margin: '0 0 1rem 0' }}>
              {service.description}
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
                {service.categoryName}
              </span>
              
              <span style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: '#27ae60'
              }}>
                {service.price} radis
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
            
            <button
              onClick={() => handleNegotiate(service)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Négocier
            </button>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#7f8c8d'
        }}>
          Aucun service disponible avec ces critères.
        </div>
      )}

      {/* Modal de négociation */}
      {selectedService && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2>Négocier pour : {selectedService.title}</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Prix proposé (radis) :
              </label>
              <input
                type="number"
                step="0.01"
                value={negotiationForm.proposedPrice}
                onChange={(e) => setNegotiationForm({
                  ...negotiationForm,
                  proposedPrice: e.target.value
                })}
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
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Message (optionnel) :
              </label>
              <textarea
                value={negotiationForm.message}
                onChange={(e) => setNegotiationForm({
                  ...negotiationForm,
                  message: e.target.value
                })}
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
                placeholder="Votre message pour le vendeur..."
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={submitNegotiation}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Envoyer la négociation
              </button>
              
              <button
                onClick={() => setSelectedService(null)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;