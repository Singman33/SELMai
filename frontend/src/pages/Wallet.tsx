import React, { useState, useEffect } from 'react';
import { Transaction, User } from '../types';
import { transactionAPI, userAPI } from '../services/api';

const Wallet: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transactionsData, userData] = await Promise.all([
        transactionAPI.getAll(),
        userAPI.getProfile()
      ]);
      setTransactions(transactionsData);
      setUser(userData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
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
        return `Paiement reçu de ${transaction.fromFirstName} ${transaction.fromLastName}`;
      } else {
        return transaction.description || 'Crédit';
      }
    } else {
      return `Paiement envoyé à ${transaction.toFirstName} ${transaction.toLastName}`;
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
              {user?.balance?.toFixed(2)} radis
            </h2>
            <p style={{ margin: 0, color: '#7f8c8d' }}>Solde actuel</p>
          </div>
          
          <div>
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#f39c12', fontSize: '2rem' }}>
              {user?.rating?.toFixed(1) || '0.0'} ⭐
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

      {/* Historique des transactions */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
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
                        Service : {transaction.serviceTitle}
                      </div>
                    )}
                    
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#95a5a6'
                    }}>
                      {formatDate(transaction.createdAt)}
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
                      {isCredit ? '+' : '-'}{transaction.amount.toFixed(2)} radis
                    </div>
                    
                    {transaction.balanceAfter !== undefined && (
                      <div style={{
                        fontSize: '0.9rem',
                        color: '#7f8c8d'
                      }}>
                        Solde : {transaction.balanceAfter.toFixed(2)} radis
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
      </div>
    </div>
  );
};

export default Wallet;