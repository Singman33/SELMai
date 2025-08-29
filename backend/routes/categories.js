const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Obtenir toutes les catégories (endpoint public)
router.get('/', async (req, res) => {
  try {
    const [categories] = await db.execute(
      'SELECT * FROM categories ORDER BY name'
    );

    // Mapper les catégories au format camelCase pour le frontend
    const mappedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: category.created_at
    }));

    res.json(mappedCategories);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

module.exports = router;