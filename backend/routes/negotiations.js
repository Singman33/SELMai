const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Obtenir les négociations de l'utilisateur connecté
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [negotiations] = await db.execute(`
      SELECT n.*, 
             s.title as service_title, s.price as service_price,
             buyer.username as buyer_username, buyer.first_name as buyer_first_name, buyer.last_name as buyer_last_name,
             seller.username as seller_username, seller.first_name as seller_first_name, seller.last_name as seller_last_name
      FROM negotiations n
      JOIN services s ON n.service_id = s.id
      JOIN users buyer ON n.buyer_id = buyer.id
      JOIN users seller ON n.seller_id = seller.id
      WHERE n.buyer_id = ? OR n.seller_id = ?
      ORDER BY n.created_at DESC
    `, [req.user.id, req.user.id]);

    const mappedNegotiations = negotiations.map(nego => ({
      id: nego.id,
      serviceId: nego.service_id,
      serviceTitle: nego.service_title,
      servicePrice: nego.service_price,
      buyerId: nego.buyer_id,
      sellerId: nego.seller_id,
      proposedPrice: nego.proposed_price,
      message: nego.message,
      status: nego.status,
      buyerUsername: nego.buyer_username,
      buyerFirstName: nego.buyer_first_name,
      buyerLastName: nego.buyer_last_name,
      sellerUsername: nego.seller_username,
      sellerFirstName: nego.seller_first_name,
      sellerLastName: nego.seller_last_name,
      createdAt: nego.created_at,
      updatedAt: nego.updated_at
    }));

    res.json(mappedNegotiations);
  } catch (error) {
    console.error('Erreur lors de la récupération des négociations:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Créer une nouvelle négociation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { service_id, proposed_price, message } = req.body;

    if (!service_id) {
      return res.status(400).json({ message: 'ID du service requis' });
    }

    // Vérifier que le service existe et n'appartient pas à l'utilisateur
    const [services] = await db.execute(
      'SELECT * FROM services WHERE id = ? AND is_active = TRUE',
      [service_id]
    );

    if (services.length === 0) {
      return res.status(404).json({ message: 'Service non trouvé' });
    }

    if (services[0].user_id === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas négocier sur votre propre service' });
    }

    const [result] = await db.execute(
      'INSERT INTO negotiations (service_id, buyer_id, seller_id, proposed_price, message) VALUES (?, ?, ?, ?, ?)',
      [service_id, req.user.id, services[0].user_id, proposed_price || services[0].price, message || null]
    );

    // Créer une notification pour le vendeur
    await db.execute(
      'INSERT INTO notifications (user_id, title, message, notification_type, related_id) VALUES (?, ?, ?, ?, ?)',
      [
        services[0].user_id,
        'Nouvelle négociation',
        `${req.user.username} souhaite négocier pour votre service "${services[0].title}"`,
        'negotiation',
        result.insertId
      ]
    );

    res.status(201).json({
      message: 'Négociation créée avec succès',
      negotiationId: result.insertId
    });
  } catch (error) {
    console.error('Erreur lors de la création de la négociation:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Répondre à une négociation
router.put('/:id/respond', authenticateToken, async (req, res) => {
  try {
    const negotiationId = req.params.id;
    const { status, counter_price, message } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    // Vérifier que la négociation existe et appartient à l'utilisateur (vendeur)
    const [negotiations] = await db.execute(
      'SELECT * FROM negotiations WHERE id = ? AND seller_id = ?',
      [negotiationId, req.user.id]
    );

    if (negotiations.length === 0) {
      return res.status(404).json({ message: 'Négociation non trouvée' });
    }

    const negotiation = negotiations[0];

    if (negotiation.status !== 'pending') {
      return res.status(400).json({ message: 'Cette négociation a déjà été traitée' });
    }

    // Commencer une transaction
    await db.execute('START TRANSACTION');

    try {
      if (status === 'accepted') {
        // Accepter la négociation
        await db.execute(
          'UPDATE negotiations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['accepted', negotiationId]
        );

        // Effectuer la transaction financière
        const amount = counter_price || negotiation.proposed_price;
        
        await db.execute(
          'UPDATE users SET balance = balance - ? WHERE id = ?',
          [amount, negotiation.buyer_id]
        );
        
        await db.execute(
          'UPDATE users SET balance = balance + ? WHERE id = ?',
          [amount, negotiation.seller_id]
        );

        // Enregistrer la transaction
        await db.execute(
          'INSERT INTO transactions (from_user_id, to_user_id, amount, description, service_id) VALUES (?, ?, ?, ?, ?)',
          [negotiation.buyer_id, negotiation.seller_id, amount, `Paiement pour le service`, negotiation.service_id]
        );

        // Vérifier le type de service et gérer la consommation
        const [services] = await db.execute(
          'SELECT service_type FROM services WHERE id = ?',
          [negotiation.service_id]
        );

        if (services.length > 0 && services[0].service_type === 'consumable') {
          // Pour les services consommables, ajouter une entrée dans service_consumptions
          await db.execute(
            'INSERT INTO service_consumptions (service_id, buyer_id, negotiation_id) VALUES (?, ?, ?)',
            [negotiation.service_id, negotiation.buyer_id, negotiationId]
          );
          
          // Désactiver le service consommable après la première vente
          await db.execute(
            'UPDATE services SET is_active = FALSE WHERE id = ?',
            [negotiation.service_id]
          );
        }
        // Les services renouvelables restent actifs et disponibles
      } else {
        // Rejeter la négociation
        await db.execute(
          'UPDATE negotiations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['rejected', negotiationId]
        );
      }

      // Créer une notification pour l'acheteur
      await db.execute(
        'INSERT INTO notifications (user_id, title, message, notification_type, related_id) VALUES (?, ?, ?, ?, ?)',
        [
          negotiation.buyer_id,
          'Réponse à votre négociation',
          message || `Votre négociation a été ${status === 'accepted' ? 'acceptée' : 'rejetée'}`,
          'negotiation',
          negotiationId
        ]
      );

      await db.execute('COMMIT');

      res.json({ message: `Négociation ${status === 'accepted' ? 'acceptée' : 'rejetée'} avec succès` });
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de la réponse à la négociation:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Admin: Obtenir toutes les négociations
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [negotiations] = await db.execute(`
      SELECT n.*, 
             s.title as service_title,
             buyer.username as buyer_username,
             seller.username as seller_username
      FROM negotiations n
      JOIN services s ON n.service_id = s.id
      JOIN users buyer ON n.buyer_id = buyer.id
      JOIN users seller ON n.seller_id = seller.id
      ORDER BY n.created_at DESC
    `);

    res.json(negotiations);
  } catch (error) {
    console.error('Erreur lors de la récupération des négociations (admin):', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Marquer une négociation comme terminée après évaluation
router.put('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const negotiationId = req.params.id;
    const { rating, comment } = req.body;

    // Vérifier que la négociation existe et est acceptée
    const [negotiations] = await db.execute(
      `SELECT n.*, s.title as service_title, s.user_id as seller_user_id
       FROM negotiations n 
       JOIN services s ON n.service_id = s.id 
       WHERE n.id = ? AND (n.buyer_id = ? OR n.seller_id = ?)`,
      [negotiationId, req.user.id, req.user.id]
    );

    if (negotiations.length === 0) {
      return res.status(404).json({ message: 'Négociation non trouvée' });
    }

    const negotiation = negotiations[0];

    if (negotiation.status !== 'accepted') {
      return res.status(400).json({ message: 'Cette négociation doit être acceptée avant d\'être terminée' });
    }

    // Commencer une transaction
    await db.execute('START TRANSACTION');

    try {
      // Marquer la négociation comme terminée
      await db.execute(
        'UPDATE negotiations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['completed', negotiationId]
      );

      // Si un rating est fourni, l'enregistrer
      if (rating && (rating >= 1 && rating <= 5)) {
        // Déterminer qui évalue qui
        let raterId, ratedId;
        
        if (req.user.id === negotiation.buyer_id) {
          // L'acheteur évalue le vendeur
          raterId = negotiation.buyer_id;
          ratedId = negotiation.seller_id;
        } else if (req.user.id === negotiation.seller_id) {
          // Le vendeur évalue l'acheteur
          raterId = negotiation.seller_id;
          ratedId = negotiation.buyer_id;
        }

        if (raterId && ratedId) {
          await db.execute(
            'INSERT INTO ratings (rater_id, rated_id, service_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
            [raterId, ratedId, negotiation.service_id, rating, comment || null]
          );

          // Recalculer la note moyenne de l'utilisateur évalué
          const [avgResult] = await db.execute(
            'SELECT AVG(rating) as avg_rating FROM ratings WHERE rated_id = ?',
            [ratedId]
          );

          if (avgResult.length > 0 && avgResult[0].avg_rating !== null) {
            await db.execute(
              'UPDATE users SET rating = ? WHERE id = ?',
              [avgResult[0].avg_rating, ratedId]
            );
          }
        }
      }

      await db.execute('COMMIT');

      res.json({ message: 'Transaction terminée avec succès' });
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de la finalisation de la négociation:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Admin: Supprimer une négociation
router.delete('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const negotiationId = req.params.id;

    const [result] = await db.execute('DELETE FROM negotiations WHERE id = ?', [negotiationId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Négociation non trouvée' });
    }

    res.json({ message: 'Négociation supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la négociation:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

module.exports = router;