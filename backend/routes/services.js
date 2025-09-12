const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Obtenir tous les services (place marché)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [services] = await db.execute(`
      SELECT s.*, u.username, u.first_name, u.last_name, u.rating as user_rating, c.name as category_name,
             sc_user.buyer_id as consumed_by_user,
             CASE WHEN sc_any.service_id IS NOT NULL THEN TRUE ELSE FALSE END as is_consumed_by_anyone
      FROM services s
      JOIN users u ON s.user_id = u.id
      JOIN categories c ON s.category_id = c.id
      LEFT JOIN service_consumptions sc_user ON s.id = sc_user.service_id AND sc_user.buyer_id = ?
      LEFT JOIN service_consumptions sc_any ON s.id = sc_any.service_id
      WHERE s.is_active = TRUE AND u.is_active = TRUE
        AND (s.service_type = 'renewable' OR (s.service_type = 'consumable' AND sc_any.service_id IS NULL))
      ORDER BY s.created_at DESC
    `, [req.user.id]);

    const mappedServices = services.map(service => ({
      id: service.id,
      userId: service.user_id,
      title: service.title,
      description: service.description,
      categoryId: service.category_id,
      categoryName: service.category_name,
      price: service.price,
      duration: service.duration,
      serviceType: service.service_type,
      serviceCategory: service.service_category,
      isActive: service.is_active,
      username: service.username,
      firstName: service.first_name,
      lastName: service.last_name,
      userRating: service.user_rating,
      createdAt: service.created_at,
      updatedAt: service.updated_at,
      isConsumedByUser: service.consumed_by_user !== null,
      isConsumedByAnyone: service.is_consumed_by_anyone
    }));

    res.json(mappedServices);
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Obtenir les services d'un utilisateur
router.get('/my-services', authenticateToken, async (req, res) => {
  try {
    const [services] = await db.execute(`
      SELECT s.*, c.name as category_name,
             CASE 
               WHEN s.service_type = 'consumable' AND EXISTS(
                 SELECT 1 FROM service_consumptions sc WHERE sc.service_id = s.id
               ) THEN TRUE
               ELSE FALSE
             END as is_consumed
      FROM services s
      JOIN categories c ON s.category_id = c.id
      WHERE s.user_id = ?
      ORDER BY 
        CASE 
          WHEN s.service_type = 'renewable' OR (s.service_type = 'consumable' AND s.is_active = TRUE) THEN 0
          ELSE 1
        END,
        s.created_at DESC
    `, [req.user.id]);

    const mappedServices = services.map(service => ({
      id: service.id,
      userId: service.user_id,
      title: service.title,
      description: service.description,
      categoryId: service.category_id,
      categoryName: service.category_name,
      price: service.price,
      duration: service.duration,
      serviceType: service.service_type,
      serviceCategory: service.service_category,
      isActive: service.is_active,
      isConsumed: service.is_consumed === 1,
      createdAt: service.created_at,
      updatedAt: service.updated_at
    }));

    res.json(mappedServices);
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Créer un nouveau service
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, category_id, price, duration, service_type, service_category } = req.body;

    if (!title || !description || !category_id || !price) {
      return res.status(400).json({ message: 'Titre, description, catégorie et prix sont obligatoires' });
    }

    // Validation du type de service et de la catégorie
    const validServiceType = service_type === 'renewable' ? 'renewable' : 'consumable';
    const validServiceCategory = service_category === 'request' ? 'request' : 'offer';

    const [result] = await db.execute(
      'INSERT INTO services (user_id, title, description, category_id, price, duration, service_type, service_category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, description, category_id, price, duration || null, validServiceType, validServiceCategory]
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
    const { title, description, category_id, price, duration, service_type, service_category, is_active } = req.body;

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

    // Validation du type de service et de la catégorie
    const validServiceType = service_type === 'renewable' ? 'renewable' : 'consumable';
    const validServiceCategory = service_category === 'request' ? 'request' : 'offer';
    const serviceIsActive = is_active !== undefined ? is_active : services[0].is_active;

    await db.execute(
      'UPDATE services SET title = ?, description = ?, category_id = ?, price = ?, duration = ?, service_type = ?, service_category = ?, is_active = ? WHERE id = ?',
      [title, description, category_id, price, duration || null, validServiceType, validServiceCategory, serviceIsActive, serviceId]
    );

    res.json({ message: 'Service modifié avec succès' });
  } catch (error) {
    console.error('Erreur lors de la modification du service:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Désactiver un service (suppression logique)
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

    // Désactiver le service au lieu de le supprimer pour éviter les problèmes de contraintes
    await db.execute(
      'UPDATE services SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
      [serviceId]
    );

    res.json({ message: 'Service désactivé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la désactivation du service:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Admin: Obtenir tous les services
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔧 [ADMIN] Requête pour récupérer tous les services');
    const [services] = await db.execute(`
      SELECT s.*, u.username, u.first_name, u.last_name, u.rating, c.name as category_name,
             CASE 
               WHEN s.service_type = 'consumable' AND EXISTS(
                 SELECT 1 FROM service_consumptions sc WHERE sc.service_id = s.id
               ) THEN TRUE
               ELSE FALSE
             END as is_consumed
      FROM services s
      JOIN users u ON s.user_id = u.id
      JOIN categories c ON s.category_id = c.id
      ORDER BY s.created_at DESC
    `);

    // Mapper les services au format camelCase pour l'admin frontend
    const mappedServices = services.map(service => ({
      id: service.id,
      userId: service.user_id,
      title: service.title,
      description: service.description,
      categoryId: service.category_id,
      categoryName: service.category_name,
      price: service.price,
      duration: service.duration,
      serviceType: service.service_type,
      serviceCategory: service.service_category,
      isActive: service.is_active,
      username: service.username,
      firstName: service.first_name,
      lastName: service.last_name,
      userRating: service.rating,
      isConsumed: Boolean(service.is_consumed),
      createdAt: service.created_at,
      updatedAt: service.updated_at
    }));

    console.log('🔧 [ADMIN] Services récupérés:', mappedServices.length, 'services');
    res.json(mappedServices);
  } catch (error) {
    console.error('❌ [ADMIN] Erreur lors de la récupération des services:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

module.exports = router;