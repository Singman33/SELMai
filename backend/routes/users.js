const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Obtenir le profil de l'utilisateur connecté
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('👤 Récupération du profil pour l\'utilisateur ID:', req.user.id);

    const [users] = await db.execute(
      'SELECT id, username, email, first_name, last_name, balance, rating, is_admin, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const user = users[0];
    const profileData = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      balance: user.balance,
      rating: user.rating,
      isAdmin: user.is_admin,
      createdAt: user.created_at
    };

    console.log('📤 Profil envoyé:', profileData);
    res.json(profileData);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Mettre à jour le profil de l'utilisateur connecté
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, firstName, lastName } = req.body;

    console.log('🔧 Mise à jour du profil pour l\'utilisateur ID:', userId, {
      email,
      firstName,
      lastName
    });

    // Validation des champs
    if (!email || !firstName || !lastName) {
      return res.status(400).json({ message: 'Email, prénom et nom sont requis' });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé par un autre utilisateur' });
    }

    // Mettre à jour le profil
    const [result] = await db.execute(
      'UPDATE users SET email = ?, first_name = ?, last_name = ? WHERE id = ?',
      [email, firstName, lastName, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    console.log('✅ Profil mis à jour avec succès pour l\'utilisateur ID:', userId);
    res.json({ message: 'Profil mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Obtenir la liste des membres de la communauté
router.get('/community', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, username, first_name, last_name, balance, rating, is_admin, created_at FROM users WHERE is_active = TRUE ORDER BY rating DESC, username'
    );

    const mappedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      balance: user.balance,
      rating: user.rating,
      isAdmin: user.is_admin,
      createdAt: user.created_at
    }));

    res.json(mappedUsers);
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

    const mappedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      balance: user.balance,
      rating: user.rating,
      isAdmin: user.is_admin,
      isActive: user.is_active,
      createdAt: user.created_at
    }));

    res.json(mappedUsers);
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
    const { username, email, firstName, lastName, isAdmin, isActive, password } = req.body;

    console.log('🔧 Modification utilisateur:', {
      userId,
      username,
      email,
      firstName,
      lastName,
      isAdmin,
      isActive,
      passwordProvided: !!password
    });

    // Si un mot de passe est fourni, le hasher et mettre à jour
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);

      const [result] = await db.execute(
        'UPDATE users SET username = ?, email = ?, first_name = ?, last_name = ?, is_admin = ?, is_active = ?, password_hash = ? WHERE id = ?',
        [username, email, firstName, lastName, isAdmin, isActive, hashedPassword, userId]
      );

      console.log('✅ Résultat UPDATE (avec mot de passe):', result.affectedRows, 'lignes affectées');

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      return res.json({ message: 'Utilisateur et mot de passe modifiés avec succès' });
    }

    // Sinon, mettre à jour sans toucher au mot de passe
    const [result] = await db.execute(
      'UPDATE users SET username = ?, email = ?, first_name = ?, last_name = ?, is_admin = ?, is_active = ? WHERE id = ?',
      [username, email, firstName, lastName, isAdmin, isActive, userId]
    );

    console.log('✅ Résultat UPDATE:', result.affectedRows, 'lignes affectées');

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

// Utilisateur: Changer son propre mot de passe
router.put('/profile/password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    console.log('🔐 Changement de mot de passe pour l\'utilisateur ID:', userId);

    // Validation des champs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Mot de passe actuel et nouveau mot de passe requis' });
    }

    // Validation de la longueur du nouveau mot de passe
    if (newPassword.length < 4) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 4 caractères' });
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit être différent de l\'ancien' });
    }

    // Récupérer l'utilisateur avec son mot de passe actuel
    const [users] = await db.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const user = users[0];

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isPasswordValid) {
      console.log('❌ Mot de passe actuel incorrect pour l\'utilisateur ID:', userId);
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    const [result] = await db.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ message: 'Erreur lors de la mise à jour du mot de passe' });
    }

    console.log('✅ Mot de passe changé avec succès pour l\'utilisateur ID:', userId);
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
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