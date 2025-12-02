const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getLogs, countLogs, cleanOldLogs, LogActions } = require('../logger');

const router = express.Router();

/**
 * GET /api/logs
 * Récupère les logs avec filtres optionnels
 * Réservé aux administrateurs
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const {
            userId,
            action,
            entityType,
            entityId,
            startDate,
            endDate,
            limit = 100,
            offset = 0
        } = req.query;

        const filters = {};

        if (userId) filters.userId = parseInt(userId);
        if (action) filters.action = action;
        if (entityType) filters.entityType = entityType;
        if (entityId) filters.entityId = parseInt(entityId);
        if (startDate) filters.startDate = new Date(startDate);
        if (endDate) filters.endDate = new Date(endDate);
        filters.limit = Math.min(parseInt(limit), 1000); // Maximum 1000 résultats
        filters.offset = parseInt(offset);

        const [logs, total] = await Promise.all([
            getLogs(filters),
            countLogs(filters)
        ]);

        res.json({
            logs,
            pagination: {
                total,
                limit: filters.limit,
                offset: filters.offset,
                hasMore: (filters.offset + filters.limit) < total
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des logs:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des logs' });
    }
});

/**
 * GET /api/logs/actions
 * Récupère la liste des types d'actions disponibles
 * Réservé aux administrateurs
 */
router.get('/actions', authenticateToken, requireAdmin, (req, res) => {
    res.json({
        actions: Object.values(LogActions)
    });
});

/**
 * GET /api/logs/stats
 * Récupère des statistiques sur les logs
 * Réservé aux administrateurs
 */
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const filters = {};
        if (startDate) filters.startDate = new Date(startDate);
        if (endDate) filters.endDate = new Date(endDate);

        // Statistiques par type d'action
        const actionStats = {};
        for (const action of Object.values(LogActions)) {
            const count = await countLogs({ ...filters, action });
            if (count > 0) {
                actionStats[action] = count;
            }
        }

        // Statistiques par type d'entité
        const entityTypes = ['service', 'negotiation', 'transaction', 'user', 'notification', 'rating'];
        const entityStats = {};
        for (const entityType of entityTypes) {
            const count = await countLogs({ ...filters, entityType });
            if (count > 0) {
                entityStats[entityType] = count;
            }
        }

        const total = await countLogs(filters);

        res.json({
            total,
            byAction: actionStats,
            byEntityType: entityStats,
            period: {
                startDate: filters.startDate || null,
                endDate: filters.endDate || null
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
    }
});

/**
 * DELETE /api/logs/cleanup
 * Supprime les logs plus anciens qu'une certaine date
 * Réservé aux administrateurs
 */
router.delete('/cleanup', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { beforeDate } = req.body;

        if (!beforeDate) {
            return res.status(400).json({ message: 'La date de nettoyage est requise' });
        }

        const date = new Date(beforeDate);
        if (isNaN(date.getTime())) {
            return res.status(400).json({ message: 'Date invalide' });
        }

        // Vérifier que la date n'est pas dans le futur
        if (date > new Date()) {
            return res.status(400).json({ message: 'La date ne peut pas être dans le futur' });
        }

        const deletedCount = await cleanOldLogs(date);

        res.json({
            message: `${deletedCount} log(s) supprimé(s)`,
            deletedCount,
            beforeDate: date
        });
    } catch (error) {
        console.error('Erreur lors du nettoyage des logs:', error);
        res.status(500).json({ message: 'Erreur lors du nettoyage des logs' });
    }
});

/**
 * GET /api/logs/user/:userId
 * Récupère les logs d'un utilisateur spécifique
 * Les utilisateurs peuvent voir leurs propres logs, les admins peuvent voir tous les logs
 */
router.get('/user/:userId', authenticateToken, async (req, res) => {
    try {
        const requestedUserId = parseInt(req.params.userId);

        // Vérifier que l'utilisateur demande ses propres logs ou est admin
        if (req.user.userId !== requestedUserId && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        const {
            action,
            entityType,
            entityId,
            startDate,
            endDate,
            limit = 50,
            offset = 0
        } = req.query;

        const filters = {
            userId: requestedUserId,
            limit: Math.min(parseInt(limit), 500),
            offset: parseInt(offset)
        };

        if (action) filters.action = action;
        if (entityType) filters.entityType = entityType;
        if (entityId) filters.entityId = parseInt(entityId);
        if (startDate) filters.startDate = new Date(startDate);
        if (endDate) filters.endDate = new Date(endDate);

        const [logs, total] = await Promise.all([
            getLogs(filters),
            countLogs(filters)
        ]);

        res.json({
            logs,
            pagination: {
                total,
                limit: filters.limit,
                offset: filters.offset,
                hasMore: (filters.offset + filters.limit) < total
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des logs utilisateur:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des logs' });
    }
});

module.exports = router;
