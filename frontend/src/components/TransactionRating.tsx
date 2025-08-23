import React, { useState } from 'react';
import StarRating from './StarRating';
import { negotiationAPI } from '../services/api';
import { useError } from '../context/ErrorContext';

interface TransactionRatingProps {
  negotiationId: number;
  serviceTitle: string;
  otherUserName: string;
  isUserBuyer: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

const TransactionRating: React.FC<TransactionRatingProps> = ({
  negotiationId,
  serviceTitle,
  otherUserName,
  isUserBuyer,
  onComplete,
  onCancel
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { addError } = useError();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating < 1 || rating > 5) {
      addError('Veuillez sélectionner une note entre 1 et 5 étoiles', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await negotiationAPI.complete(negotiationId, rating, comment.trim() || undefined);
      
      addError('Transaction terminée et évaluation enregistrée avec succès !', 'success');
      onComplete();
    } catch (error: any) {
      console.error('Erreur lors de l\'évaluation:', error);
      addError(
        error.response?.data?.message || 'Erreur lors de l\'enregistrement de l\'évaluation',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteWithoutRating = async () => {
    setIsSubmitting(true);
    try {
      await negotiationAPI.complete(negotiationId);
      
      addError('Transaction marquée comme terminée', 'success');
      onComplete();
    } catch (error: any) {
      console.error('Erreur lors de la finalisation:', error);
      addError(
        error.response?.data?.message || 'Erreur lors de la finalisation de la transaction',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#2c3e50' }}>
          Finaliser la transaction
        </h2>
        
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1.5rem',
          border: '1px solid #e9ecef'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
            <strong>Service :</strong> {serviceTitle}
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#6c757d' }}>
            <strong>{isUserBuyer ? 'Vendeur' : 'Acheteur'} :</strong> {otherUserName}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Évaluer {isUserBuyer ? 'le vendeur' : 'l\'acheteur'} (optionnel)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                size="large"
                showValue={false}
              />
              <span style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                {rating}/5 étoiles
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#7f8c8d', margin: 0 }}>
              Cette note évaluera {isUserBuyer ? 'la qualité du service et la fiabilité du vendeur' : 'la coopération et le professionnalisme de l\'acheteur'}
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="comment" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Commentaire (optionnel)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Partagez votre expérience avec ${isUserBuyer ? 'ce vendeur' : 'cet acheteur'}...`}
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                resize: 'vertical',
                fontSize: '0.9rem'
              }}
            />
            {comment.length > 0 && (
              <div style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '0.25rem' }}>
                {comment.length}/500 caractères
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleCompleteWithoutRating}
              disabled={isSubmitting}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              {isSubmitting ? 'Finalisation...' : 'Finaliser sans évaluer'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                opacity: isSubmitting ? 0.6 : 1,
                fontWeight: 'bold'
              }}
            >
              {isSubmitting ? 'Envoi...' : 'Évaluer et finaliser'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionRating;