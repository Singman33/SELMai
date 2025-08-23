import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserDisplay } from '../types';
import { userAPI } from '../services/api';
import StarRating from '../components/StarRating';

// Helper pour formater les noms d'utilisateur
const formatUserName = (firstName?: string, lastName?: string, username?: string) => {
  const fullName = `${firstName || ''} ${lastName || ''}`.trim();
  return fullName || `@${username || 'utilisateur'}`;
};

const Community: React.FC = () => {
  const [members, setMembers] = useState<UserDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'rating' | 'balance' | 'name'>('rating');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const data = await userAPI.getCommunity();
      setMembers(data);
    } catch (error) {
      console.error('Erreur lors du chargement de la communauté:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      case 'balance':
        return (Number(b.balance) || 0) - (Number(a.balance) || 0);
      case 'name':
        return `${a.firstName || ''} ${a.lastName || ''}`.localeCompare(`${b.firstName || ''} ${b.lastName || ''}`);
      default:
        return 0;
    }
  });

  const getRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <span>
        {'★'.repeat(fullStars)}
        {hasHalfStar && '☆'}
        {'☆'.repeat(emptyStars)}
      </span>
    );
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 100) return '#27ae60';
    if (balance > 50) return '#f39c12';
    if (balance > 0) return '#e67e22';
    return '#e74c3c';
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div>
      <h1>Communauté</h1>
      
      {/* Options de tri */}
      <div style={{
        backgroundColor: 'white',
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 'bold' }}>Trier par :</span>
          
          <button
            onClick={() => setSortBy('rating')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: sortBy === 'rating' ? '#3498db' : '#ecf0f1',
              color: sortBy === 'rating' ? 'white' : '#2c3e50',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Note d'appréciation
          </button>
          
          <button
            onClick={() => setSortBy('balance')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: sortBy === 'balance' ? '#3498db' : '#ecf0f1',
              color: sortBy === 'balance' ? 'white' : '#2c3e50',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Solde
          </button>
          
          <button
            onClick={() => setSortBy('name')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: sortBy === 'name' ? '#3498db' : '#ecf0f1',
              color: sortBy === 'name' ? 'white' : '#2c3e50',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Nom
          </button>
          
          <div style={{ marginLeft: 'auto', color: '#7f8c8d' }}>
            {members.length} membre{members.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Liste des membres */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1rem'
      }}>
        {sortedMembers.map((member, index) => (
          <div key={member.id} style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e0e0e0',
            position: 'relative'
          }}>
            {/* Badge de classement pour les 3 premiers */}
            {sortBy === 'rating' && index < 3 && (
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: index === 0 ? '#f1c40f' : index === 1 ? '#95a5a6' : '#cd7f32',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                {index + 1}
              </div>
            )}
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: member.isAdmin ? '#e74c3c' : '#3498db',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginRight: '1rem'
              }}>
                {member.isAdmin ? 'A' : 'U'}
              </div>
              
              <div>
                <Link 
                  to={`/user/${member.id}`} 
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <h3 style={{ 
                    margin: '0 0 0.25rem 0', 
                    color: '#2c3e50',
                    cursor: 'pointer'
                  }}>
                    {formatUserName(member.firstName, member.lastName, member.username)}
                  </h3>
                </Link>
                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.9rem' }}>
                  @{member.username || 'username'}
                </p>
              </div>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  marginBottom: '0.25rem'
                }}>
                  <StarRating
                    rating={Number(member.rating) || 0}
                    readonly
                    size="medium"
                    showValue
                  />
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#95a5a6'
                }}>
                  Note d'appréciation
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: getBalanceColor(Number(member.balance) || 0),
                  marginBottom: '0.25rem'
                }}>
                  {(Number(member.balance) || 0).toFixed(0)}
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: '#7f8c8d'
                }}>
                  radis
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#95a5a6'
                }}>
                  Solde
                </div>
              </div>
            </div>
            
            <div style={{
              fontSize: '0.8rem',
              color: '#95a5a6',
              textAlign: 'center',
              paddingTop: '1rem',
              borderTop: '1px solid #ecf0f1'
            }}>
              Membre depuis {new Date(member.createdAt || new Date()).toLocaleDateString('fr-FR', {
                month: 'long',
                year: 'numeric'
              })}
            </div>
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#7f8c8d'
        }}>
          Aucun membre dans la communauté.
        </div>
      )}
      
      {/* Statistiques de la communauté */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginTop: '2rem'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Statistiques de la communauté</h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3498db' }}>
              {members.length}
            </div>
            <div style={{ color: '#7f8c8d' }}>Membres actifs</div>
          </div>
          
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#27ae60' }}>
              {members.reduce((sum, member) => sum + (Number(member.balance) || 0), 0).toFixed(0)}
            </div>
            <div style={{ color: '#7f8c8d' }}>Total radis en circulation</div>
          </div>
          
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f39c12' }}>
              {members.length > 0 ? (members.reduce((sum, member) => sum + (Number(member.rating) || 0), 0) / members.length).toFixed(1) : '0.0'}
            </div>
            <div style={{ color: '#7f8c8d' }}>Note moyenne</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;