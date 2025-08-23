import React, { useState, useEffect } from 'react';
import { Negotiation } from '../types';
import { negotiationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TransactionRating from '../components/TransactionRating';

const Negotiations: React.FC = () => {
  const { user } = useAuth();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'buying' | 'selling'>('all');
  const [showRatingModal, setShowRatingModal] = useState<Negotiation | null>(null);

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

  const handleStartRating = (negotiation: Negotiation) => {
    setShowRatingModal(negotiation);
  };

  const handleRatingComplete = () => {
    setShowRatingModal(null);
    fetchNegotiations();
  };

  const handleRatingCancel = () => {
    setShowRatingModal(null);
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
                  {negotiation.serviceTitle || 'Service sans titre'}
                </h3>
                
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <span style={{ color: '#7f8c8d' }}>
                    <strong>Acheteur :</strong> {negotiation.buyerFirstName || ''} {negotiation.buyerLastName || ''}
                  </span>
                  <span style={{ color: '#7f8c8d' }}>
                    <strong>Vendeur :</strong> {negotiation.sellerFirstName || ''} {negotiation.sellerLastName || ''}
                  </span>
                </div>
              </div>
              
              <span style={{
                backgroundColor: getStatusColor(negotiation.status || 'pending'),
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}>
                {getStatusText(negotiation.status || 'pending')}
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div>
                <strong>Prix initial :</strong> {(Number(negotiation.servicePrice) || 0).toFixed(2)} radis
              </div>
              {negotiation.proposedPrice && (
                <div>
                  <strong>Prix proposé :</strong> {(Number(negotiation.proposedPrice) || 0).toFixed(2)} radis
                </div>
              )}
              <div>
                <strong>Date :</strong> {new Date(negotiation.createdAt || new Date()).toLocaleDateString('fr-FR')}
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
                <strong>Message :</strong> {negotiation.message || 'Aucun message'}
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

            {/* Actions pour finaliser la transaction (statut accepté) */}
            {negotiation.status === 'accepted' && (
              <div style={{
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                padding: '1rem',
                borderRadius: '4px',
                marginTop: '1rem'
              }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ color: '#155724' }}>Transaction acceptée !</strong>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#155724', fontSize: '0.9rem' }}>
                    {negotiation.buyerId === user?.id 
                      ? 'Le vendeur a accepté votre proposition. Vous pouvez maintenant finaliser la transaction.'
                      : 'Vous avez accepté cette proposition. L\'acheteur peut maintenant finaliser la transaction.'
                    }
                  </p>
                </div>
                
                <button
                  onClick={() => handleStartRating(negotiation)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {negotiation.buyerId === user?.id 
                    ? '✅ Finaliser et évaluer le vendeur'
                    : '✅ Finaliser et évaluer l\'acheteur'
                  }
                </button>
              </div>
            )}

            {/* Indication pour les transactions terminées */}
            {negotiation.status === 'completed' && (
              <div style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                padding: '1rem',
                borderRadius: '4px',
                marginTop: '1rem'
              }}>
                <strong style={{ color: '#6c757d' }}>✅ Transaction terminée</strong>
                <p style={{ margin: '0.5rem 0 0 0', color: '#6c757d', fontSize: '0.9rem' }}>
                  Cette transaction a été finalisée avec succès.
                </p>
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

      {/* Modal d'évaluation */}
      {showRatingModal && (
        <TransactionRating
          negotiationId={showRatingModal.id}
          serviceTitle={showRatingModal.serviceTitle || 'Service'}
          otherUserName={
            showRatingModal.buyerId === user?.id
              ? `${showRatingModal.sellerFirstName || ''} ${showRatingModal.sellerLastName || ''}`.trim() || showRatingModal.sellerUsername || 'Vendeur'
              : `${showRatingModal.buyerFirstName || ''} ${showRatingModal.buyerLastName || ''}`.trim() || showRatingModal.buyerUsername || 'Acheteur'
          }
          isUserBuyer={showRatingModal.buyerId === user?.id}
          onComplete={handleRatingComplete}
          onCancel={handleRatingCancel}
        />
      )}
    </div>
  );
};

export default Negotiations;