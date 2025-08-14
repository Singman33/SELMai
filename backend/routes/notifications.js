const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Obtenir les notifications de l'utilisateur
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [notifications] = await db.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json(notifications);
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Marquer une notification comme lue
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;

    const [result] = await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [notificationId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la notification:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Marquer toutes les notifications comme lues
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
      [req.user.id]
    );

    res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des notifications:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Obtenir le nombre de notifications non lues
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const [result] = await db.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );

    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Erreur lors du comptage des notifications:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Admin: Envoyer une notification à un utilisateur spécifique
router.post('/admin/send-to-user', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { user_id, title, message } = req.body;

    if (!user_id || !title || !message) {
      return res.status(400).json({ message: 'ID utilisateur, titre et message requis' });
    }

    await db.execute(
      'INSERT INTO notifications (user_id, title, message, notification_type) VALUES (?, ?, ?, ?)',
      [user_id, title, message, 'admin']
    );

    res.json({ message: 'Notification envoyée avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Admin: Envoyer une notification à tous les utilisateurs
router.post('/admin/broadcast', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Titre et message requis' });
    }

    // Obtenir tous les utilisateurs actifs
    const [users] = await db.execute(
      'SELECT id FROM users WHERE is_active = TRUE'
    );

    // Créer une notification pour chaque utilisateur
    const notifications = users.map(user => [user.id, title, message, 'admin']);
    
    if (notifications.length > 0) {
      await db.execute(
        `INSERT INTO notifications (user_id, title, message, notification_type) VALUES ${notifications.map(() => '(?, ?, ?, ?)').join(', ')}`,
        notifications.flat()
      );
    }

    res.json({ 
      message: 'Notifications diffusées avec succès',
      usersNotified: notifications.length
    });
  } catch (error) {
    console.error('Erreur lors de la diffusion des notifications:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

module.exports = router;