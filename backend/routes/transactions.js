const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Obtenir l'historique des transactions de l'utilisateur
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [transactions] = await db.execute(`
      SELECT t.*, 
             from_user.username as from_username, from_user.first_name as from_first_name, from_user.last_name as from_last_name,
             to_user.username as to_username, to_user.first_name as to_first_name, to_user.last_name as to_last_name,
             s.title as service_title
      FROM transactions t
      LEFT JOIN users from_user ON t.from_user_id = from_user.id
      JOIN users to_user ON t.to_user_id = to_user.id
      LEFT JOIN services s ON t.service_id = s.id
      WHERE t.from_user_id = ? OR t.to_user_id = ?
      ORDER BY t.created_at DESC
    `, [req.user.id, req.user.id]);

    // Calculer le solde à chaque transaction
    let runningBalance = 0;
    const transactionsWithBalance = transactions.map(transaction => {
      if (transaction.to_user_id === req.user.id) {
        runningBalance += parseFloat(transaction.amount);
      } else if (transaction.from_user_id === req.user.id) {
        runningBalance -= parseFloat(transaction.amount);
      }
      
      return {
        ...transaction,
        balance_after: runningBalance
      };
    }).reverse();

    res.json(transactionsWithBalance.reverse());
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Obtenir le solde actuel de l'utilisateur
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT balance FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({ balance: users[0].balance });
  } catch (error) {
    console.error('Erreur lors de la récupération du solde:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

module.exports = router;