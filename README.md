# SELMai - Système d'échange local Martignas / Saint Jean d'Illac

SELMai est une application web de gestion d'un système d'échange local (SEL) pour les communes de Martignas-sur-Jalle et Saint-Jean-d'Illac. Cette plateforme permet aux habitants d'échanger services et biens en utilisant une monnaie locale : le radis.

## 🌟 Fonctionnalités

### Pour les utilisateurs
- **Place du marché** : Consultation et recherche des services disponibles
- **Mes services** : Création, modification et suppression d'annonces de services
- **Négociations** : Gestion des négociations d'achat et de vente
- **Porte-monnaie** : Suivi du solde en radis et historique des transactions
- **Communauté** : Annuaire des membres avec leurs notes et soldes
- **Notifications** : Réception de messages sur les négociations et transactions

### Pour les administrateurs
- **Gestion des utilisateurs** : Création, modification, suppression et activation/désactivation
- **Gestion des soldes** : Ajustement des soldes des utilisateurs
- **Gestion globale des services** : Administration de tous les services
- **Gestion des négociations** : Supervision et modération
- **Notifications** : Envoi de messages ciblés ou en diffusion

## 🚀 Démarrage rapide

### Prérequis
- Docker et Docker Compose
- Git

### Installation

1. **Clonez le dépôt**
   ```bash
   git clone https://github.com/[votre-username]/SELMai.git
   cd SELMai
   ```

2. **Lancez l'application**
   ```bash
   docker-compose up -d
   ```

3. **Accédez à l'application**
   - Frontend : http://localhost:3000
   - API : http://localhost:3001

### Compte administrateur par défaut
- **Nom d'utilisateur** : `admin`
- **Mot de passe** : `1234`

## 🏗️ Architecture

L'application utilise une architecture moderne en conteneurs :

```
SELMai/
├── frontend/          # Application React TypeScript
├── backend/           # API Node.js Express
├── database/          # Scripts SQL MariaDB
└── docker-compose.yml # Configuration des conteneurs
```

### Technologies utilisées

**Frontend**
- React 18 avec TypeScript
- React Router pour la navigation
- Axios pour les requêtes HTTP
- CSS-in-JS pour le styling

**Backend**
- Node.js avec Express
- JWT pour l'authentification
- bcryptjs pour le hashage des mots de passe
- Middleware de sécurité (helmet, cors, rate limiting)

**Base de données**
- MariaDB 10.9
- Schema avec tables relationnelles optimisées

**DevOps**
- Docker et Docker Compose
- Configuration multi-conteneurs
- Volumes persistants pour les données

## 📊 Structure de la base de données

### Tables principales
- `users` : Utilisateurs du système
- `categories` : Catégories de services
- `services` : Annonces de services
- `negotiations` : Négociations entre utilisateurs
- `transactions` : Historique des paiements
- `notifications` : Messages et alertes
- `ratings` : Évaluations des utilisateurs

## 🔧 Configuration

### Variables d'environnement

Le backend utilise les variables suivantes (configurées dans docker-compose.yml) :

```bash
DB_HOST=database
DB_PORT=3306
DB_NAME=selmai
DB_USER=selmai_user
DB_PASSWORD=selmai_password
JWT_SECRET=your-secret-key-here
```

### Ports utilisés
- **3000** : Frontend React
- **3001** : Backend API
- **3306** : Base de données MariaDB

## 📋 API Documentation

### Authentification
- `POST /api/auth/login` : Connexion
- `GET /api/auth/verify` : Vérification du token
- `POST /api/auth/logout` : Déconnexion

### Services
- `GET /api/services` : Liste des services
- `POST /api/services` : Créer un service
- `PUT /api/services/:id` : Modifier un service
- `DELETE /api/services/:id` : Supprimer un service

### Négociations
- `GET /api/negotiations` : Mes négociations
- `POST /api/negotiations` : Créer une négociation
- `PUT /api/negotiations/:id/respond` : Répondre à une négociation

[Documentation complète de l'API disponible via les commentaires dans le code]

## 🛠️ Développement

### Démarrage en mode développement

1. **Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

### Structure du code

**Frontend**
```
src/
├── components/     # Composants réutilisables
├── pages/         # Pages de l'application
├── context/       # Contextes React (auth, etc.)
├── services/      # Services API
├── types/         # Types TypeScript
└── utils/         # Utilitaires
```

**Backend**
```
backend/
├── routes/        # Routes Express
├── middleware/    # Middlewares personnalisés
├── config/        # Configuration (DB, etc.)
└── server.js      # Point d'entrée
```

## 🔒 Sécurité

- Authentification JWT avec expiration
- Hashage des mots de passe avec bcrypt
- Protection CORS configurée
- Rate limiting pour prévenir les abus
- Validation des données d'entrée
- Protection contre les injections SQL

## 🧪 Tests

```bash
# Tests backend
cd backend
npm test

# Tests frontend
cd frontend
npm test
```

## 📈 Monitoring

L'application inclut :
- Logs structurés
- Gestion d'erreurs centralisée
- Health check endpoints
- Métriques de base

## 🚀 Déploiement

### Production avec Docker

1. **Configuration**
   ```bash
   # Copiez et modifiez les variables d'environnement
   cp .env.example .env
   ```

2. **Build et déploiement**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Recommandations production
- Utilisez des secrets sécurisés pour JWT_SECRET
- Configurez un reverse proxy (nginx)
- Activez HTTPS
- Configurez des sauvegardes automatiques de la DB
- Monitoring et alertes

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📝 Changelog

### Version 1.0.0 (2024)
- ✅ Système d'authentification complet
- ✅ Gestion des services et annonces
- ✅ Négociations entre utilisateurs
- ✅ Système de paiement en radis
- ✅ Interface d'administration
- ✅ Notifications en temps réel
- ✅ Annuaire de la communauté

## 🐛 Problèmes connus

Consultez les [Issues GitHub](https://github.com/[votre-username]/SELMai/issues) pour les problèmes connus et les demandes de fonctionnalités.

## 📞 Support

Pour obtenir de l'aide :
1. Consultez cette documentation
2. Vérifiez les issues GitHub existantes
3. Créez une nouvelle issue si nécessaire

## 👥 Auteurs

- **Équipe SELMai** - Développement initial

## 🙏 Remerciements

- Communautés de Martignas-sur-Jalle et Saint-Jean-d'Illac
- Projet open source inspiré des SEL français
- Contributions de la communauté

## 📄 Licence

Ce projet est sous licence Apache 2.0 - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**SELMai** - *Échanger local, vivre solidaire* 🌱