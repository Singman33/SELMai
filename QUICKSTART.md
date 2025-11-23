# 🚀 Guide de Déploiement Rapide - SELMai

## Déploiement en Production

Pour déployer SELMai en production, suivez ces étapes :

### 1️⃣ Prérequis
- Serveur Ubuntu 20.04+ (2GB RAM, 20GB disque)
- Docker et Docker Compose installés
- Nom de domaine configuré

### 2️⃣ Configuration

```bash
# Copier le template des variables d'environnement
cp .env.example .env

# Générer des secrets sécurisés
openssl rand -base64 64  # Pour JWT_SECRET
openssl rand -base64 32  # Pour DB_PASSWORD

# Éditer .env avec vos valeurs
nano .env
```

### 3️⃣ Déploiement

```bash
# Lancer le script de déploiement
./scripts/deploy.sh
```

### 4️⃣ Configuration SSL

Suivez les instructions dans [DEPLOYMENT.md](DEPLOYMENT.md) section "Configuration SSL avec Let's Encrypt"

---

## 📚 Documentation Complète

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guide complet de déploiement (350+ lignes)
- **[docs/SECURITY.md](docs/SECURITY.md)** - Sécurisation de votre installation
- **[docs/BACKUP.md](docs/BACKUP.md)** - Stratégie de sauvegarde et restauration
- **[docs/MONITORING.md](docs/MONITORING.md)** - Monitoring et maintenance

---

## 🛠️ Scripts Disponibles

```bash
./scripts/deploy.sh    # Déploiement automatisé
./scripts/backup.sh    # Sauvegarde de la base de données
./scripts/restore.sh   # Restauration d'une sauvegarde
```

---

## 📦 Fichiers de Configuration Production

- `docker-compose.prod.yml` - Configuration Docker Compose production
- `frontend/Dockerfile.prod` - Build optimisé du frontend
- `backend/Dockerfile.prod` - Build optimisé du backend
- `apache/selmai-le-ssl.conf` - Configuration Apache avec reverse proxy et SSL
- `.env.example` - Template des variables d'environnement

---

## ⚡ Démarrage Rapide (Développement)

Pour le développement local, utilisez :

```bash
docker compose up -d
```

Accédez à :
- Frontend : http://localhost:3000
- API : http://localhost:3001

---

**Pour plus de détails, consultez [DEPLOYMENT.md](DEPLOYMENT.md)** 📖
