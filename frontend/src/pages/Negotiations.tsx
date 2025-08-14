import React, { useState, useEffect } from 'react';
import { Negotiation } from '../types';
import { negotiationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Negotiations: React.FC = () => {
  const { user } = useAuth();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'buying' | 'selling'>('all');

  useEffect(() => {
    fetchNegotiations();
  }, []);

  const fetchNegotiations = async () => {
    try {
      const data = await negotiationAPI.getAll();
      setNegotiations(data);
    } catch (error) {
      console.error('Erreur lors du chargement des négociations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (negotiationId: number, status: 'accepted' | 'rejected') => {
    try {
      await negotiationAPI.respond(negotiationId, status);
      alert(`Négociation ${status === 'accepted' ? 'acceptée' : 'rejetée'} avec succès !`);
      fetchNegotiations();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la réponse');
    }
  };

  const filteredNegotiations = negotiations.filter(negotiation => {
    switch (filter) {
      case 'buying':
        return negotiation.buyerId === user?.id;
      case 'selling':
        return negotiation.sellerId === user?.id;
      default:
        return true;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f39c12';
      case 'accepted':
        return '#27ae60';
      case 'rejected':
        return '#e74c3c';
      case 'completed':
        return '#9b59b6';
      default:
        return '#95a5a6';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'accepted':
        return 'Acceptée';
      case 'rejected':
        return 'Rejetée';
      case 'completed':
        return 'Terminée';
      default:
        return status;
    }
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div>
      <h1>Négociations</h1>
      
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
            Toutes ({negotiations.length})
          </button>
          
          <button
            onClick={() => setFilter('buying')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: filter === 'buying' ? '#3498db' : '#ecf0f1',
              color: filter === 'buying' ? 'white' : '#2c3e50',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Mes achats ({negotiations.filter(n => n.buyerId === user?.id).length})
          </button>
          
          <button
            onClick={() => setFilter('selling')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: filter === 'selling' ? '#3498db' : '#ecf0f1',
              color: filter === 'selling' ? 'white' : '#2c3e50',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Mes ventes ({negotiations.filter(n => n.sellerId === user?.id).length})
          </button>
        </div>
      </div>

      {/* Liste des négociations */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredNegotiations.map(negotiation => (
          <div key={negotiation.id} style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '1rem'
            }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
                  {negotiation.serviceTitle}
                </h3>
                
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <span style={{ color: '#7f8c8d' }}>
                    <strong>Acheteur :</strong> {negotiation.buyerFirstName} {negotiation.buyerLastName}
                  </span>
                  <span style={{ color: '#7f8c8d' }}>
                    <strong>Vendeur :</strong> {negotiation.sellerFirstName} {negotiation.sellerLastName}
                  </span>
                </div>
              </div>
              
              <span style={{
                backgroundColor: getStatusColor(negotiation.status),
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}>
                {getStatusText(negotiation.status)}
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div>
                <strong>Prix initial :</strong> {negotiation.servicePrice} radis
              </div>
              {negotiation.proposedPrice && (
                <div>
                  <strong>Prix proposé :</strong> {negotiation.proposedPrice} radis
                </div>
              )}
              <div>
                <strong>Date :</strong> {new Date(negotiation.createdAt).toLocaleDateString('fr-FR')}
              </div>
            </div>

            {negotiation.message && (
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '1rem',
                borderRadius: '4px',
                marginBottom: '1rem',
                borderLeft: '4px solid #3498db'
              }}>
                <strong>Message :</strong> {negotiation.message}
              </div>
            )}

            {/* Actions pour le vendeur */}
            {negotiation.sellerId === user?.id && negotiation.status === 'pending' && (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => handleRespond(negotiation.id, 'accepted')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Accepter
                </button>
                
                <button
                  onClick={() => handleRespond(negotiation.id, 'rejected')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Rejeter
                </button>
              </div>
            )}

            {/* Indication pour l'acheteur */}
            {negotiation.buyerId === user?.id && negotiation.status === 'pending' && (
              <div style={{
                backgroundColor: '#fff3cd',
                color: '#856404',
                padding: '0.75rem',
                borderRadius: '4px',
                border: '1px solid #ffeaa7'
              }}>
                En attente de la réponse du vendeur...
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredNegotiations.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#7f8c8d'
        }}>
          {filter === 'all' && 'Aucune négociation en cours.'}
          {filter === 'buying' && 'Aucune négociation d\'achat en cours.'}
          {filter === 'selling' && 'Aucune négociation de vente en cours.'}
        </div>
      )}
    </div>
  );
};

export default Negotiations;