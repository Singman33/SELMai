const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Créer une évaluation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { rated_id, service_id, rating, comment } = req.body;

    // Validation
    if (!rated_id || !rating) {
      return res.status(400).json({ message: 'L\'utilisateur évalué et la note sont obligatoires' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'La note doit être entre 1 et 5' });
    }

    // Ne pas permettre de s'auto-évaluer
    if (req.user.id === parseInt(rated_id)) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous auto-évaluer' });
    }

    // Vérifier si l'utilisateur a déjà évalué cette personne pour ce service
    if (service_id) {
      const [existing] = await db.execute(
        'SELECT id FROM ratings WHERE rater_id = ? AND rated_id = ? AND service_id = ?',
        [req.user.id, rated_id, service_id]
      );

      if (existing.length > 0) {
        return res.status(400).json({ message: 'Vous avez déjà évalué ce service' });
      }
    }

    // Créer l'évaluation
    const [result] = await db.execute(
      'INSERT INTO ratings (rater_id, rated_id, service_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, rated_id, service_id || null, rating, comment || null]
    );

    // Mettre à jour le rating moyen de l'utilisateur évalué
    await updateUserRating(rated_id);

    res.status(201).json({
      message: 'Évaluation créée avec succès',
      ratingId: result.insertId
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'évaluation:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Obtenir les évaluations d'un utilisateur
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    const [ratings] = await db.execute(`
      SELECT 
        r.*,
        u1.username as rater_username,
        u1.first_name as rater_first_name,
        u1.last_name as rater_last_name,
        s.title as service_title
      FROM ratings r
      JOIN users u1 ON r.rater_id = u1.id
      LEFT JOIN services s ON r.service_id = s.id
      WHERE r.rated_id = ?
      ORDER BY r.created_at DESC
    `, [userId]);

    const mappedRatings = ratings.map(rating => ({
      id: rating.id,
      raterId: rating.rater_id,
      ratedId: rating.rated_id,
      serviceId: rating.service_id,
      rating: rating.rating,
      comment: rating.comment,
      createdAt: rating.created_at,
      raterUsername: rating.rater_username,
      raterFirstName: rating.rater_first_name,
      raterLastName: rating.rater_last_name,
      serviceTitle: rating.service_title
    }));

    res.json(mappedRatings);
  } catch (error) {
    console.error('Erreur lors de la récupération des évaluations:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Obtenir les évaluations données par un utilisateur
router.get('/by-user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Seul l'utilisateur lui-même peut voir ses évaluations données
    if (req.user.id !== parseInt(userId) && !req.user.is_admin) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const [ratings] = await db.execute(`
      SELECT 
        r.*,
        u2.username as rated_username,
        u2.first_name as rated_first_name,
        u2.last_name as rated_last_name,
        s.title as service_title
      FROM ratings r
      JOIN users u2 ON r.rated_id = u2.id
      LEFT JOIN services s ON r.service_id = s.id
      WHERE r.rater_id = ?
      ORDER BY r.created_at DESC
    `, [userId]);

    const mappedRatings = ratings.map(rating => ({
      id: rating.id,
      raterId: rating.rater_id,
      ratedId: rating.rated_id,
      serviceId: rating.service_id,
      rating: rating.rating,
      comment: rating.comment,
      createdAt: rating.created_at,
      ratedUsername: rating.rated_username,
      ratedFirstName: rating.rated_first_name,
      ratedLastName: rating.rated_last_name,
      serviceTitle: rating.service_title
    }));

    res.json(mappedRatings);
  } catch (error) {
    console.error('Erreur lors de la récupération des évaluations données:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Obtenir les évaluations d'un service spécifique
router.get('/service/:serviceId', authenticateToken, async (req, res) => {
  try {
    const serviceId = req.params.serviceId;

    const [ratings] = await db.execute(`
      SELECT 
        r.*,
        u1.username as rater_username,
        u1.first_name as rater_first_name,
        u1.last_name as rater_last_name
      FROM ratings r
      JOIN users u1 ON r.rater_id = u1.id
      WHERE r.service_id = ?
      ORDER BY r.created_at DESC
    `, [serviceId]);

    const mappedRatings = ratings.map(rating => ({
      id: rating.id,
      raterId: rating.rater_id,
      ratedId: rating.rated_id,
      serviceId: rating.service_id,
      rating: rating.rating,
      comment: rating.comment,
      createdAt: rating.created_at,
      raterUsername: rating.rater_username,
      raterFirstName: rating.rater_first_name,
      raterLastName: rating.rater_last_name
    }));

    res.json(mappedRatings);
  } catch (error) {
    console.error('Erreur lors de la récupération des évaluations du service:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Modifier une évaluation (seulement par l'auteur)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const ratingId = req.params.id;
    const { rating, comment } = req.body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'La note doit être entre 1 et 5' });
    }

    // Vérifier que l'évaluation appartient à l'utilisateur
    const [ratings] = await db.execute(
      'SELECT * FROM ratings WHERE id = ?',
      [ratingId]
    );

    if (ratings.length === 0) {
      return res.status(404).json({ message: 'Évaluation non trouvée' });
    }

    if (ratings[0].rater_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    // Mettre à jour l'évaluation
    await db.execute(
      'UPDATE ratings SET rating = ?, comment = ? WHERE id = ?',
      [rating, comment || null, ratingId]
    );

    // Mettre à jour le rating moyen de l'utilisateur évalué
    await updateUserRating(ratings[0].rated_id);

    res.json({ message: 'Évaluation modifiée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la modification de l\'évaluation:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Supprimer une évaluation (seulement par l'auteur ou admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const ratingId = req.params.id;

    // Vérifier que l'évaluation appartient à l'utilisateur
    const [ratings] = await db.execute(
      'SELECT * FROM ratings WHERE id = ?',
      [ratingId]
    );

    if (ratings.length === 0) {
      return res.status(404).json({ message: 'Évaluation non trouvée' });
    }

    if (ratings[0].rater_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const ratedUserId = ratings[0].rated_id;

    // Supprimer l'évaluation
    await db.execute('DELETE FROM ratings WHERE id = ?', [ratingId]);

    // Mettre à jour le rating moyen de l'utilisateur évalué
    await updateUserRating(ratedUserId);

    res.json({ message: 'Évaluation supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'évaluation:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Fonction utilitaire pour mettre à jour le rating moyen d'un utilisateur
async function updateUserRating(userId) {
  try {
    const [result] = await db.execute(
      'SELECT AVG(rating) as avg_rating FROM ratings WHERE rated_id = ?',
      [userId]
    );

    const avgRating = result[0].avg_rating || 0;

    await db.execute(
      'UPDATE users SET rating = ? WHERE id = ?',
      [parseFloat(avgRating).toFixed(2), userId]
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rating utilisateur:', error);
    throw error;
  }
}

module.exports = router;