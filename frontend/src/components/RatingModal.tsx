import React, { useState } from 'react';
import StarRating from './StarRating';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment?: string) => void;
  targetUserName?: string;
  serviceTitle?: string;
  existingRating?: {
    rating: number;
    comment?: string;
  };
}

const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  targetUserName,
  serviceTitle,
  existingRating
}) => {
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [comment, setComment] = useState(existingRating?.comment || '');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (rating === 0) {
      alert('Veuillez sélectionner une note');
      return;
    }
    onSubmit(rating, comment.trim() || undefined);
    handleClose();
  };

  const handleClose = () => {
    setRating(existingRating?.rating || 0);
    setComment(existingRating?.comment || '');
    onClose();
  };

  return (
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
        <h2 style={{ margin: '0 0 1rem 0' }}>
          {existingRating ? 'Modifier votre évaluation' : 'Évaluer'}
        </h2>
        
        {targetUserName && (
          <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
            Utilisateur : <strong>{targetUserName}</strong>
          </p>
        )}
        
        {serviceTitle && (
          <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
            Service : <strong>{serviceTitle}</strong>
          </p>
        )}
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem',
            fontWeight: 'bold'
          }}>
            Note :
          </label>
          <StarRating
            rating={rating}
            onRatingChange={setRating}
            size="large"
            showValue={false}
          />
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem',
            fontWeight: 'bold'
          }}>
            Commentaire (optionnel) :
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Partagez votre expérience..."
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleClose}
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
          
          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: rating === 0 ? '#bdc3c7' : '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: rating === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            {existingRating ? 'Modifier' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;