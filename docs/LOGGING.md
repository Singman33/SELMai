# Système de Logs SELMai

## Vue d'ensemble

Le système de logs de SELMai permet de tracer toutes les actions importantes des utilisateurs dans l'application. Il enregistre les connexions, les créations/modifications de services, les négociations, les transactions, et toutes les autres actions critiques.

## Architecture

### Fichiers principaux

- **`backend/logger.js`** : Module principal de gestion des logs
- **`backend/routes/logs.js`** : Routes API pour consulter et gérer les logs
- **`database/create_logs_table.sql`** : Schéma de la table logs

### Table de base de données

```sql
CREATE TABLE logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  details JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Installation

### 1. Créer la table logs

```bash
# Se connecter à la base de données
mysql -u root -p selmai

# Exécuter le script de création
source /path/to/database/create_logs_table.sql
```

Ou via Docker :

```bash
docker exec -i selmai-db mysql -u root -p"$MYSQL_ROOT_PASSWORD" selmai < database/create_logs_table.sql
```

### 2. Redémarrer le backend

Le système de logs est déjà intégré dans le serveur. Il suffit de redémarrer :

```bash
cd backend
npm restart
```

## Utilisation

### Enregistrer une action

```javascript
const { logAction, LogActions } = require('../logger');

// Exemple : enregistrer une connexion
await logAction(
  userId,                    // ID de l'utilisateur
  LogActions.LOGIN,          // Type d'action
  'user',                    // Type d'entité (optionnel)
  userId,                    // ID de l'entité (optionnel)
  { username: 'john' },      // Détails supplémentaires (optionnel)
  req.ip                     // Adresse IP (optionnel)
);
```

### Types d'actions disponibles

```javascript
LogActions = {
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
}
```

## API Endpoints

### GET /api/logs

Récupère les logs avec filtres (admin uniquement).

**Paramètres de requête :**
- `userId` : Filtrer par utilisateur
- `action` : Filtrer par type d'action
- `entityType` : Filtrer par type d'entité
- `entityId` : Filtrer par ID d'entité
- `startDate` : Date de début (ISO 8601)
- `endDate` : Date de fin (ISO 8601)
- `limit` : Nombre de résultats (max 1000, défaut 100)
- `offset` : Offset pour pagination (défaut 0)

**Exemple :**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs?action=login&limit=50"
```

**Réponse :**
```json
{
  "logs": [
    {
      "id": 123,
      "user_id": 1,
      "username": "john_doe",
      "first_name": "John",
      "last_name": "Doe",
      "action": "login",
      "entity_type": "user",
      "entity_id": 1,
      "details": { "username": "john_doe" },
      "ip_address": "192.168.1.100",
      "created_at": "2025-12-02T08:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1234,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### GET /api/logs/actions

Liste tous les types d'actions disponibles (admin uniquement).

### GET /api/logs/stats

Récupère des statistiques sur les logs (admin uniquement).

**Paramètres de requête :**
- `startDate` : Date de début
- `endDate` : Date de fin

**Réponse :**
```json
{
  "total": 5432,
  "byAction": {
    "login": 1234,
    "service_create": 567,
    "negotiation_create": 890
  },
  "byEntityType": {
    "service": 1200,
    "negotiation": 890,
    "transaction": 450
  },
  "period": {
    "startDate": "2025-11-01T00:00:00.000Z",
    "endDate": "2025-12-01T00:00:00.000Z"
  }
}
```

### GET /api/logs/user/:userId

Récupère les logs d'un utilisateur spécifique. Les utilisateurs peuvent voir leurs propres logs, les admins peuvent voir tous les logs.

**Paramètres de requête :** Mêmes que `/api/logs`

### DELETE /api/logs/cleanup

Supprime les logs plus anciens qu'une certaine date (admin uniquement).

**Body :**
```json
{
  "beforeDate": "2025-01-01T00:00:00.000Z"
}
```

## Exemples d'intégration

### Dans une route de création de service

```javascript
const { logAction, LogActions } = require('../logger');

router.post('/', authenticateToken, async (req, res) => {
  try {
    // Créer le service
    const [result] = await db.execute(
      'INSERT INTO services (...) VALUES (...)',
      [...]
    );
    
    const serviceId = result.insertId;
    
    // Logger l'action
    await logAction(
      req.user.id,
      LogActions.SERVICE_CREATE,
      'service',
      serviceId,
      { title: req.body.title, type: req.body.type },
      req.ip
    );
    
    res.json({ id: serviceId, message: 'Service créé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur' });
  }
});
```

### Dans une route de négociation

```javascript
router.post('/:id/accept', authenticateToken, async (req, res) => {
  try {
    const negotiationId = req.params.id;
    
    // Accepter la négociation
    await db.execute(
      'UPDATE negotiations SET status = ? WHERE id = ?',
      ['accepted', negotiationId]
    );
    
    // Logger l'action
    await logAction(
      req.user.id,
      LogActions.NEGOTIATION_ACCEPT,
      'negotiation',
      negotiationId,
      null,
      req.ip
    );
    
    res.json({ message: 'Négociation acceptée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur' });
  }
});
```

## Maintenance

### Nettoyage automatique

Il est recommandé de nettoyer régulièrement les anciens logs pour optimiser les performances.

**Script de nettoyage (à ajouter dans un cron) :**

```javascript
const { cleanOldLogs } = require('./logger');

// Supprimer les logs de plus de 6 mois
const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

cleanOldLogs(sixMonthsAgo)
  .then(count => console.log(`${count} logs supprimés`))
  .catch(err => console.error('Erreur:', err));
```

### Surveillance

Surveillez la taille de la table logs :

```sql
SELECT 
  COUNT(*) as total_logs,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(created_at) as oldest_log,
  MAX(created_at) as newest_log
FROM logs;
```

## Sécurité

- ✅ Seuls les administrateurs peuvent consulter tous les logs
- ✅ Les utilisateurs peuvent uniquement voir leurs propres logs
- ✅ Les adresses IP sont enregistrées pour la traçabilité
- ✅ Les erreurs de logging ne bloquent pas l'application
- ✅ Les données sensibles (mots de passe) ne sont jamais loggées

## Prochaines étapes

- [ ] Ajouter le logging dans toutes les routes critiques
- [ ] Créer une interface d'administration pour consulter les logs
- [ ] Implémenter des alertes pour les actions suspectes
- [ ] Ajouter des graphiques de statistiques
- [ ] Mettre en place un système d'archivage automatique
