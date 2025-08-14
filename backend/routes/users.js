const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Obtenir le profil de l'utilisateur connecté
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, username, email, first_name, last_name, balance, rating, is_admin, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Obtenir la liste des membres de la communauté
router.get('/community', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, username, first_name, last_name, balance, rating, created_at FROM users WHERE is_active = TRUE ORDER BY rating DESC, username'
    );

    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération de la communauté:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Admin: Obtenir tous les utilisateurs
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, username, email, first_name, last_name, balance, rating, is_admin, is_active, created_at FROM users ORDER BY created_at DESC'
    );

    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs (admin):', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Admin: Créer un nouvel utilisateur
router.post('/admin/create', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, isAdmin = false } = req.body;

    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
    }

    // Vérifier l'unicité du nom d'utilisateur et de l'email
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Nom d\'utilisateur ou email déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      'INSERT INTO users (username, email, password_hash, first_name, last_name, is_admin) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, firstName, lastName, isAdmin]
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Admin: Modifier un utilisateur
router.put('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, email, firstName, lastName, isAdmin, isActive } = req.body;

    const [result] = await db.execute(
      'UPDATE users SET username = ?, email = ?, first_name = ?, last_name = ?, is_admin = ?, is_active = ? WHERE id = ?',
      [username, email, firstName, lastName, isAdmin, isActive, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({ message: 'Utilisateur modifié avec succès' });
  } catch (error) {
    console.error('Erreur lors de la modification de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Admin: Ajuster le solde d'un utilisateur
router.post('/admin/:id/adjust-balance', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { amount, description } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ message: 'Montant invalide' });
    }

    // Commencer une transaction
    await db.execute('START TRANSACTION');

    try {
      // Mettre à jour le solde
      await db.execute(
        'UPDATE users SET balance = balance + ? WHERE id = ?',
        [amount, userId]
      );

      // Enregistrer la transaction
      await db.execute(
        'INSERT INTO transactions (to_user_id, amount, description, transaction_type) VALUES (?, ?, ?, ?)',
        [userId, amount, description || 'Ajustement administrateur', 'admin_adjustment']
      );

      await db.execute('COMMIT');

      res.json({ message: 'Solde ajusté avec succès' });
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajustement du solde:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Admin: Supprimer un utilisateur
router.delete('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    // Ne pas permettre la suppression de l'admin principal
    if (parseInt(userId) === 1) {
      return res.status(400).json({ message: 'Impossible de supprimer l\'administrateur principal' });
    }

    const [result] = await db.execute('DELETE FROM users WHERE id = ?', [userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

module.exports = router;