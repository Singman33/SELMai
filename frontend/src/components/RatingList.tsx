import React, { useState, useEffect } from 'react';
import { Rating } from '../types';
import { ratingAPI } from '../services/api';
import StarRating from './StarRating';

interface RatingListProps {
  userId: number;
  showActions?: boolean;
  onEdit?: (rating: Rating) => void;
  onDelete?: (ratingId: number) => void;
}

const RatingList: React.FC<RatingListProps> = ({
  userId,
  showActions = false,
  onEdit,
  onDelete
}) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRatings();
  }, [userId]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ratingAPI.getUserRatings(userId);
      setRatings(data);
    } catch (error: any) {
      console.error('Erreur lors du chargement des évaluations:', error);
      setError('Erreur lors du chargement des évaluations');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div>Chargement des évaluations...</div>;
  }

  if (error) {
    return <div style={{ color: '#e74c3c' }}>{error}</div>;
  }

  if (ratings.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        color: '#7f8c8d'
      }}>
        Aucune évaluation pour le moment.
      </div>
    );
  }

  const averageRating = ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length;

  return (
    <div>
      {/* Résumé des évaluations */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div>
          <StarRating
            rating={averageRating}
            readonly
            size="medium"
            showValue
          />
        </div>
        <div style={{ color: '#666' }}>
          Basé sur {ratings.length} évaluation{ratings.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Liste des évaluations */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {ratings.map((rating) => (
          <div key={rating.id} style={{
            backgroundColor: 'white',
            padding: '1rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '0.5rem'
            }}>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  {rating.raterFirstName} {rating.raterLastName}
                </div>
                <StarRating
                  rating={rating.rating}
                  readonly
                  size="small"
                />
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                {formatDate(rating.createdAt)}
              </div>
            </div>

            {rating.serviceTitle && (
              <div style={{
                fontSize: '0.9rem',
                color: '#666',
                marginBottom: '0.5rem'
              }}>
                Service : <strong>{rating.serviceTitle}</strong>
              </div>
            )}

            {rating.comment && (
              <div style={{
                marginTop: '0.5rem',
                color: '#333',
                fontStyle: 'italic'
              }}>
                "{rating.comment}"
              </div>
            )}

            {showActions && (onEdit || onDelete) && (
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginTop: '1rem'
              }}>
                {onEdit && (
                  <button
                    onClick={() => onEdit(rating)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.8rem',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Modifier
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(rating.id)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.8rem',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Supprimer
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RatingList;