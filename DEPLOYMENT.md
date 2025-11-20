# Guide de Déploiement en Production - SELMai

Ce guide vous accompagne pas à pas pour déployer l'application SELMai en production sur un serveur VPS.

## 📋 Prérequis

### Serveur
- **OS** : Ubuntu 20.04 LTS ou supérieur (ou Debian 11+)
- **RAM** : Minimum 2 GB (4 GB recommandé)
- **Stockage** : Minimum 20 GB
- **CPU** : 2 cœurs minimum
- **Accès** : Accès root ou sudo

### Logiciels requis
- Docker (version 20.10+)
- Docker Compose (version 2.0+)
- Git
- Nom de domaine pointant vers votre serveur

## 🚀 Installation

### 1. Préparation du serveur

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation des dépendances
sudo apt install -y git curl wget nano ufw

# Installation de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter votre utilisateur au groupe docker
sudo usermod -aG docker $USER

# Docker Compose est maintenant intégré à Docker
# Vérification des installations
docker --version
docker compose version

# Redémarrer la session pour appliquer les changements de groupe
exit
# Reconnectez-vous au serveur
```

### 2. Configuration du pare-feu

> [!IMPORTANT]
> **Configuration des ports** : L'application SELMai est configurée pour utiliser les ports **8080** (HTTP) et **8443** (HTTPS) pour éviter les conflits avec Apache qui utilise déjà les ports 80 et 443.

```bash
# Autoriser SSH
sudo ufw allow OpenSSH

# Autoriser les ports de l'application SELMai
sudo ufw allow 8080/tcp
sudo ufw allow 8443/tcp

# Activer le pare-feu
sudo ufw enable

# Vérifier le statut
sudo ufw status
```

### 3. Clonage du projet

```bash
# Créer un répertoire pour l'application
sudo mkdir -p /opt/selmai
sudo chown $USER:$USER /opt/selmai
cd /opt/selmai

# Cloner le dépôt
git clone https://github.com/votre-username/SELMai.git .

# Vérifier que tous les fichiers sont présents
ls -la
```

### 4. Configuration des variables d'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env
nano .env
```

**Variables à configurer obligatoirement :**

```bash
# Générer un mot de passe sécurisé pour la base de données
DB_ROOT_PASSWORD=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 32)

# Générer un secret JWT sécurisé
JWT_SECRET=$(openssl rand -base64 64)

# Configurer votre domaine
DOMAIN=votre-domaine.com
REACT_APP_API_URL=https://votre-domaine.com/api
```

> [!IMPORTANT]
> **Sauvegardez ces valeurs dans un endroit sûr !** Vous en aurez besoin pour les restaurations.

### 5. Configuration SSL avec Let's Encrypt

Avant de démarrer l'application, configurez SSL :

```bash
# Créer les répertoires nécessaires
mkdir -p nginx/ssl

# Modifier temporairement nginx.conf pour la validation HTTP
# Commentez les lignes SSL dans nginx/nginx.conf (lignes 73-78)
nano nginx/nginx.conf
```

Commentez temporairement ces lignes :
```nginx
# ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
```

```bash
# Démarrer uniquement nginx pour obtenir le certificat
docker compose -f docker-compose.prod.yml up -d nginx certbot

# Obtenir le certificat SSL
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email votre-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d votre-domaine.com

# Décommentez les lignes SSL dans nginx.conf
nano nginx/nginx.conf

# Remplacez 'yourdomain.com' par votre vrai domaine
sed -i 's/yourdomain.com/votre-domaine.com/g' nginx/nginx.conf
```

### 6. Déploiement de l'application

```bash
# Rendre le script de déploiement exécutable (si ce n'est pas déjà fait)
chmod +x scripts/deploy.sh

# Lancer le déploiement
./scripts/deploy.sh
```

Le script va :
1. ✅ Vérifier les prérequis
2. 🔨 Construire les images Docker
3. 🚀 Démarrer tous les services
4. 🏥 Vérifier la santé des services

### 7. Vérification du déploiement

```bash
# Vérifier que tous les conteneurs sont en cours d'exécution
docker compose -f docker-compose.prod.yml ps

# Vérifier les logs
docker compose -f docker-compose.prod.yml logs -f

# Tester l'accès à l'application
curl https://votre-domaine.com
curl https://votre-domaine.com/api/health
```

Accédez à votre application via : 
- **HTTP** : http://votre-domaine.com:8080
- **HTTPS** : https://votre-domaine.com:8443

### 8. Connexion initiale

Utilisez les identifiants par défaut :
- **Nom d'utilisateur** : `admin`
- **Mot de passe** : `1234`

> [!WARNING]
> **Changez immédiatement le mot de passe administrateur après la première connexion !**

## 🔄 Mises à jour

Pour mettre à jour l'application :

```bash
cd /opt/selmai

# Sauvegarder la base de données avant la mise à jour
./scripts/backup.sh

# Déployer la nouvelle version
./scripts/deploy.sh
```

## 🗄️ Sauvegardes

### Sauvegarde manuelle

```bash
./scripts/backup.sh
```

Les sauvegardes sont stockées dans `./backups/`

### Sauvegarde automatique

Configurez une tâche cron pour des sauvegardes quotidiennes :

```bash
# Éditer le crontab
crontab -e

# Ajouter cette ligne pour une sauvegarde quotidienne à 2h du matin
0 2 * * * cd /opt/selmai && ./scripts/backup.sh >> /var/log/selmai-backup.log 2>&1
```

### Restauration

```bash
# Lister les sauvegardes disponibles
ls -lh ./backups/

# Restaurer une sauvegarde
./scripts/restore.sh ./backups/selmai_backup_YYYYMMDD_HHMMSS.sql.gz
```

## 📊 Monitoring

### Vérifier les logs

```bash
# Tous les services
docker compose -f docker-compose.prod.yml logs -f

# Un service spécifique
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f db
docker compose -f docker-compose.prod.yml logs -f nginx
```

### Vérifier l'état des services

```bash
# Statut des conteneurs
docker compose -f docker-compose.prod.yml ps

# Utilisation des ressources
docker stats
```

### Health checks

```bash
# Backend API
curl https://votre-domaine.com/api/health

# Frontend
curl https://votre-domaine.com/health
```

## 🛠️ Maintenance

### Redémarrer un service

```bash
# Redémarrer un service spécifique
docker compose -f docker-compose.prod.yml restart backend

# Redémarrer tous les services
docker compose -f docker-compose.prod.yml restart
```

### Arrêter l'application

```bash
docker compose -f docker-compose.prod.yml down
```

### Nettoyer les ressources Docker

```bash
# Nettoyer les images inutilisées
docker system prune -a

# Nettoyer les volumes (ATTENTION : supprime les données non montées)
docker volume prune
```

## 🐛 Dépannage

### Les conteneurs ne démarrent pas

```bash
# Vérifier les logs d'erreur
docker compose -f docker-compose.prod.yml logs

# Vérifier la configuration
docker compose -f docker-compose.prod.yml config
```

### Problèmes de connexion à la base de données

```bash
# Vérifier que la base de données est accessible
docker exec -it selmai-db-1 mysql -u selmai_user -p

# Vérifier les variables d'environnement
docker compose -f docker-compose.prod.yml config | grep DB_
```

### Erreur SSL/TLS

```bash
# Renouveler le certificat manuellement
docker compose -f docker-compose.prod.yml run --rm certbot renew

# Redémarrer nginx
docker compose -f docker-compose.prod.yml restart nginx
```

### L'application est lente

```bash
# Vérifier l'utilisation des ressources
docker stats

# Vérifier l'espace disque
df -h

# Nettoyer les logs volumineux
docker compose -f docker-compose.prod.yml logs --tail=100 > /dev/null
```

## 📚 Documentation supplémentaire

- [Guide de sécurité](docs/SECURITY.md)
- [Guide de sauvegarde](docs/BACKUP.md)
- [Guide de monitoring](docs/MONITORING.md)
- [Configuration Apache Reverse Proxy](docs/APACHE_REVERSE_PROXY.md)

## 🆘 Support

En cas de problème :
1. Consultez les logs : `docker compose -f docker-compose.prod.yml logs`
2. Vérifiez la documentation dans le dossier `docs/`
3. Créez une issue sur GitHub avec les détails de l'erreur

---

**SELMai** - Déploiement en production réussi ! 🎉
