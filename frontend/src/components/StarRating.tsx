import React, { useState } from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'small' | 'medium' | 'large';
  showValue?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  readonly = false,
  size = 'medium',
  showValue = false
}) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { fontSize: '1rem', gap: '0.1rem' };
      case 'large':
        return { fontSize: '1.5rem', gap: '0.3rem' };
      default:
        return { fontSize: '1.2rem', gap: '0.2rem' };
    }
  };

  const handleClick = (newRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(newRating);
    }
  };

  const handleMouseEnter = (star: number) => {
    if (!readonly) {
      setHoveredRating(star);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoveredRating(null);
    }
  };

  const getStarColor = (starNumber: number) => {
    const currentRating = hoveredRating || rating;
    
    if (starNumber <= currentRating) {
      return readonly ? '#FFD700' : '#FFA500'; // Gold for filled stars
    }
    return '#E0E0E0'; // Gray for empty stars
  };

  const sizeStyles = getSizeStyles();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: sizeStyles.gap,
      cursor: readonly ? 'default' : 'pointer'
    }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          style={{
            color: getStarColor(star),
            fontSize: sizeStyles.fontSize,
            transition: 'color 0.2s ease',
            userSelect: 'none',
            cursor: readonly ? 'default' : 'pointer'
          }}
        >
          ★
        </span>
      ))}
      {showValue && (
        <span style={{
          marginLeft: '0.5rem',
          fontSize: size === 'small' ? '0.8rem' : '0.9rem',
          color: '#666',
          fontWeight: '500'
        }}>
          {(rating || 0).toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;