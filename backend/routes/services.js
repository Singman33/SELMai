const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Obtenir tous les services (place marché)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [services] = await db.execute(`
      SELECT s.*, u.username, u.first_name, u.last_name, u.rating as user_rating, c.name as category_name
      FROM services s
      JOIN users u ON s.user_id = u.id
      JOIN categories c ON s.category_id = c.id
      WHERE s.is_active = TRUE AND u.is_active = TRUE
      ORDER BY s.created_at DESC
    `);

    res.json(services);
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Obtenir les services d'un utilisateur
router.get('/my-services', authenticateToken, async (req, res) => {
  try {
    const [services] = await db.execute(`
      SELECT s.*, c.name as category_name
      FROM services s
      JOIN categories c ON s.category_id = c.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `, [req.user.id]);

    res.json(services);
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Créer un nouveau service
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, category_id, price, duration } = req.body;

    if (!title || !description || !category_id || !price) {
      return res.status(400).json({ message: 'Titre, description, catégorie et prix sont obligatoires' });
    }

    const [result] = await db.execute(
      'INSERT INTO services (user_id, title, description, category_id, price, duration) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, title, description, category_id, price, duration || null]
    );

    res.status(201).json({
      message: 'Service créé avec succès',
      serviceId: result.insertId
    });
  } catch (error) {
    console.error('Erreur lors de la création du service:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Modifier un service
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const serviceId = req.params.id;
    const { title, description, category_id, price, duration } = req.body;

    // Vérifier que le service appartient à l'utilisateur ou que l'utilisateur est admin
    const [services] = await db.execute(
      'SELECT * FROM services WHERE id = ?',
      [serviceId]
    );

    if (services.length === 0) {
      return res.status(404).json({ message: 'Service non trouvé' });
    }

    if (services[0].user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    await db.execute(
      'UPDATE services SET title = ?, description = ?, category_id = ?, price = ?, duration = ? WHERE id = ?',
      [title, description, category_id, price, duration || null, serviceId]
    );

    res.json({ message: 'Service modifié avec succès' });
  } catch (error) {
    console.error('Erreur lors de la modification du service:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Supprimer un service
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const serviceId = req.params.id;

    // Vérifier que le service appartient à l'utilisateur ou que l'utilisateur est admin
    const [services] = await db.execute(
      'SELECT * FROM services WHERE id = ?',
      [serviceId]
    );

    if (services.length === 0) {
      return res.status(404).json({ message: 'Service non trouvé' });
    }

    if (services[0].user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    await db.execute('DELETE FROM services WHERE id = ?', [serviceId]);

    res.json({ message: 'Service supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du service:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Admin: Obtenir tous les services
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [services] = await db.execute(`
      SELECT s.*, u.username, u.first_name, u.last_name, c.name as category_name
      FROM services s
      JOIN users u ON s.user_id = u.id
      JOIN categories c ON s.category_id = c.id
      ORDER BY s.created_at DESC
    `);

    res.json(services);
  } catch (error) {
    console.error('Erreur lors de la récupération des services (admin):', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

module.exports = router;