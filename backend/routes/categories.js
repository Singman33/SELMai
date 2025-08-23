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

    res.json(categories);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

module.exports = router;