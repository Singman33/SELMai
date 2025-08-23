import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User, Rating } from '../types';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import RatingList from '../components/RatingList';

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Pour l'instant, nous utilisons l'API de communauté pour obtenir les infos utilisateur
      // Dans une vraie application, il faudrait une API dédiée pour les profils publics
      const communityUsers = await userAPI.getCommunity();
      const targetUser = communityUsers.find(u => u.id === parseInt(userId!));
      
      if (targetUser) {
        setUser(targetUser);
      } else {
        setError('Utilisateur non trouvé');
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement du profil:', error);
      setError('Erreur lors du chargement du profil utilisateur');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <div style={{ color: '#e74c3c' }}>{error}</div>;
  }

  if (!user) {
    return <div>Utilisateur non trouvé</div>;
  }


  return (
    <div>
      {/* Profil utilisateur */}
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1rem'
        }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0' }}>
              {user.firstName} {user.lastName}
            </h1>
            <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
              @{user.username}
            </p>
            {user.rating && user.rating > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <StarRating
                  rating={user.rating}
                  readonly
                  size="medium"
                  showValue
                />
              </div>
            )}
          </div>

        </div>

        <div style={{
          display: 'flex',
          gap: '2rem',
          marginTop: '1rem'
        }}>
          <div>
            <strong>Solde :</strong> {user.balance?.toFixed(2)} radis
          </div>
          <div>
            <strong>Membre depuis :</strong> {new Date(user.createdAt!).toLocaleDateString('fr-FR')}
          </div>
        </div>
      </div>

      {/* Évaluations */}
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 1rem 0' }}>Évaluations reçues</h2>
        <RatingList userId={user.id} />
      </div>

    </div>
  );
};

export default UserProfile;