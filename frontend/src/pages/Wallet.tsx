import React, { useState, useEffect } from 'react';
import { Transaction, User, Rating } from '../types';
import { transactionAPI, userAPI, ratingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RatingList from '../components/RatingList';

const Wallet: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transactions' | 'ratings'>('transactions');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const transactionsData = await transactionAPI.getAll();
      setTransactions(transactionsData);
      // Rafraîchir le profil utilisateur pour mettre à jour le solde
      await refreshUser();
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString || new Date()).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionType = (transaction: Transaction, userId: number) => {
    if (transaction.toUserId === userId) {
      return 'credit';
    } else if (transaction.fromUserId === userId) {
      return 'debit';
    }
    return 'unknown';
  };

  const getTransactionDescription = (transaction: Transaction, userId: number) => {
    const type = getTransactionType(transaction, userId);
    
    if (transaction.transactionType === 'admin_adjustment') {
      return transaction.description || 'Ajustement administrateur';
    }
    
    if (type === 'credit') {
      if (transaction.fromUserId) {
        return `Paiement reçu de ${transaction.fromFirstName || ''} ${transaction.fromLastName || ''}`;
      } else {
        return transaction.description || 'Crédit';
      }
    } else {
      return `Paiement envoyé à ${transaction.toFirstName || ''} ${transaction.toLastName || ''}`;
    }
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div>
      <h1>Porte-monnaie</h1>
      
      {/* Résumé du compte */}
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
          textAlign: 'center'
        }}>
          <div>
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#27ae60', fontSize: '2rem' }}>
              {Number(user?.balance) || 0} radis
            </h2>
            <p style={{ margin: 0, color: '#7f8c8d' }}>Solde actuel</p>
          </div>
          
          <div>
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#f39c12', fontSize: '2rem' }}>
              {(Number(user?.rating) || 0).toFixed(1)} ⭐
            </h2>
            <p style={{ margin: 0, color: '#7f8c8d' }}>Note d'appréciation</p>
          </div>
          
          <div>
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#3498db', fontSize: '2rem' }}>
              {transactions.length}
            </h2>
            <p style={{ margin: 0, color: '#7f8c8d' }}>Transactions totales</p>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        marginBottom: '0'
      }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <button
            onClick={() => setActiveTab('transactions')}
            style={{
              flex: 1,
              padding: '1rem 1.5rem',
              backgroundColor: activeTab === 'transactions' ? '#f8f9fa' : 'white',
              color: activeTab === 'transactions' ? '#2c3e50' : '#7f8c8d',
              border: 'none',
              borderBottom: activeTab === 'transactions' ? '3px solid #3498db' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: activeTab === 'transactions' ? 'bold' : 'normal',
              transition: 'all 0.3s'
            }}
          >
            💳 Historique des transactions ({transactions.length})
          </button>
          
          <button
            onClick={() => setActiveTab('ratings')}
            style={{
              flex: 1,
              padding: '1rem 1.5rem',
              backgroundColor: activeTab === 'ratings' ? '#f8f9fa' : 'white',
              color: activeTab === 'ratings' ? '#2c3e50' : '#7f8c8d',
              border: 'none',
              borderBottom: activeTab === 'ratings' ? '3px solid #3498db' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: activeTab === 'ratings' ? 'bold' : 'normal',
              transition: 'all 0.3s'
            }}
          >
            ⭐ Mes évaluations
          </button>
        </div>
      </div>

      {/* Contenu des onglets */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        marginTop: '0'
      }}>
        {activeTab === 'transactions' && (
          <>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#f8f9fa'
            }}>
              <h2 style={{ margin: 0 }}>Historique des transactions</h2>
            </div>

        {transactions.length > 0 ? (
          <div>
            {transactions.map((transaction, index) => {
              const type = getTransactionType(transaction, user?.id || 0);
              const isCredit = type === 'credit';
              
              return (
                <div
                  key={transaction.id}
                  style={{
                    padding: '1.5rem',
                    borderBottom: index < transactions.length - 1 ? '1px solid #e0e0e0' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 'bold',
                      color: '#2c3e50',
                      marginBottom: '0.25rem'
                    }}>
                      {getTransactionDescription(transaction, user?.id || 0)}
                    </div>
                    
                    {transaction.serviceTitle && (
                      <div style={{
                        fontSize: '0.9rem',
                        color: '#7f8c8d',
                        marginBottom: '0.25rem'
                      }}>
                        Service : {transaction.serviceTitle || 'Service non spécifié'}
                      </div>
                    )}
                    
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#95a5a6'
                    }}>
                      {formatDate(transaction.createdAt || new Date().toISOString())}
                    </div>
                  </div>
                  
                  <div style={{
                    textAlign: 'right',
                    marginLeft: '1rem'
                  }}>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: isCredit ? '#27ae60' : '#e74c3c'
                    }}>
                      {isCredit ? '+' : ''}{isCredit ? Number(transaction.amount) : -Math.abs(Number(transaction.amount))} radis
                    </div>
                    
                    {transaction.balanceAfter !== undefined && (
                      <div style={{
                        fontSize: '0.9rem',
                        color: '#7f8c8d'
                      }}>
                        Solde : {Number(transaction.balanceAfter) || 0} radis
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#7f8c8d'
          }}>
            Aucune transaction enregistrée.
          </div>
        )}
          </>
        )}

        {activeTab === 'ratings' && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Évaluations reçues</h2>
              <p style={{ margin: '0 0 1rem 0', color: '#7f8c8d', fontSize: '0.9rem' }}>
                Voici les évaluations que vous avez reçues après vos transactions
              </p>
              <RatingList userId={user?.id || 0} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;