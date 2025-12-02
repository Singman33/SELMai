const db = require('./config/database');

/**
 * Types d'actions pour les logs
 */
const LogActions = {
    // Authentification
    LOGIN: 'login',
    LOGOUT: 'logout',
    REGISTER: 'register',

    // Services
    SERVICE_CREATE: 'service_create',
    SERVICE_UPDATE: 'service_update',
    SERVICE_DELETE: 'service_delete',
    SERVICE_VIEW: 'service_view',

    // Négociations
    NEGOTIATION_CREATE: 'negotiation_create',
    NEGOTIATION_UPDATE: 'negotiation_update',
    NEGOTIATION_ACCEPT: 'negotiation_accept',
    NEGOTIATION_REJECT: 'negotiation_reject',
    NEGOTIATION_CANCEL: 'negotiation_cancel',

    // Transactions
    TRANSACTION_CREATE: 'transaction_create',
    TRANSACTION_COMPLETE: 'transaction_complete',
    TRANSACTION_CANCEL: 'transaction_cancel',

    // Utilisateurs
    USER_UPDATE: 'user_update',
    USER_DELETE: 'user_delete',

    // Notifications
    NOTIFICATION_SEND: 'notification_send',
    NOTIFICATION_READ: 'notification_read',

    // Évaluations
    RATING_CREATE: 'rating_create',
    RATING_UPDATE: 'rating_update',

    // Administration
    ADMIN_ACTION: 'admin_action'
};

/**
 * Enregistre une action dans les logs
 * @param {number} userId - ID de l'utilisateur effectuant l'action
 * @param {string} action - Type d'action (utiliser LogActions)
 * @param {string} entityType - Type d'entité concernée (service, negotiation, transaction, etc.)
 * @param {number|null} entityId - ID de l'entité concernée
 * @param {object|null} details - Détails supplémentaires (sera converti en JSON)
 * @param {string|null} ipAddress - Adresse IP de l'utilisateur
 * @returns {Promise<number>} ID du log créé
 */
async function logAction(userId, action, entityType = null, entityId = null, details = null, ipAddress = null) {
    try {
        const [result] = await db.execute(
            `INSERT INTO logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [
                userId,
                action,
                entityType,
                entityId,
                details ? JSON.stringify(details) : null,
                ipAddress
            ]
        );

        return result.insertId;
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement du log:', error);
        // Ne pas bloquer l'application si le logging échoue
        return null;
    }
}

/**
 * Récupère les logs avec filtres optionnels
 * @param {object} filters - Filtres de recherche
 * @param {number} filters.userId - Filtrer par utilisateur
 * @param {string} filters.action - Filtrer par type d'action
 * @param {string} filters.entityType - Filtrer par type d'entité
 * @param {number} filters.entityId - Filtrer par ID d'entité
 * @param {Date} filters.startDate - Date de début
 * @param {Date} filters.endDate - Date de fin
 * @param {number} filters.limit - Nombre maximum de résultats (défaut: 100)
 * @param {number} filters.offset - Offset pour la pagination (défaut: 0)
 * @returns {Promise<Array>} Liste des logs
 */
async function getLogs(filters = {}) {
    try {
        let query = `
      SELECT 
        l.id,
        l.user_id,
        u.username,
        u.first_name,
        u.last_name,
        l.action,
        l.entity_type,
        l.entity_id,
        l.details,
        l.ip_address,
        l.created_at
      FROM logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE 1=1
    `;

        const params = [];

        if (filters.userId) {
            query += ' AND l.user_id = ?';
            params.push(filters.userId);
        }

        if (filters.action) {
            query += ' AND l.action = ?';
            params.push(filters.action);
        }

        if (filters.entityType) {
            query += ' AND l.entity_type = ?';
            params.push(filters.entityType);
        }

        if (filters.entityId) {
            query += ' AND l.entity_id = ?';
            params.push(filters.entityId);
        }

        if (filters.startDate) {
            query += ' AND l.created_at >= ?';
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += ' AND l.created_at <= ?';
            params.push(filters.endDate);
        }

        query += ' ORDER BY l.created_at DESC';

        const limit = filters.limit || 100;
        const offset = filters.offset || 0;
        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [logs] = await db.execute(query, params);

        // Parser les détails JSON
        return logs.map(log => ({
            ...log,
            details: log.details ? JSON.parse(log.details) : null
        }));
    } catch (error) {
        console.error('Erreur lors de la récupération des logs:', error);
        throw error;
    }
}

/**
 * Compte le nombre total de logs correspondant aux filtres
 * @param {object} filters - Filtres de recherche (mêmes que getLogs)
 * @returns {Promise<number>} Nombre de logs
 */
async function countLogs(filters = {}) {
    try {
        let query = 'SELECT COUNT(*) as total FROM logs WHERE 1=1';
        const params = [];

        if (filters.userId) {
            query += ' AND user_id = ?';
            params.push(filters.userId);
        }

        if (filters.action) {
            query += ' AND action = ?';
            params.push(filters.action);
        }

        if (filters.entityType) {
            query += ' AND entity_type = ?';
            params.push(filters.entityType);
        }

        if (filters.entityId) {
            query += ' AND entity_id = ?';
            params.push(filters.entityId);
        }

        if (filters.startDate) {
            query += ' AND created_at >= ?';
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += ' AND created_at <= ?';
            params.push(filters.endDate);
        }

        const [result] = await db.execute(query, params);
        return result[0].total;
    } catch (error) {
        console.error('Erreur lors du comptage des logs:', error);
        throw error;
    }
}

/**
 * Supprime les logs plus anciens qu'une certaine date
 * @param {Date} beforeDate - Supprimer les logs avant cette date
 * @returns {Promise<number>} Nombre de logs supprimés
 */
async function cleanOldLogs(beforeDate) {
    try {
        const [result] = await db.execute(
            'DELETE FROM logs WHERE created_at < ?',
            [beforeDate]
        );

        return result.affectedRows;
    } catch (error) {
        console.error('Erreur lors du nettoyage des logs:', error);
        throw error;
    }
}

module.exports = {
    LogActions,
    logAction,
    getLogs,
    countLogs,
    cleanOldLogs
};
