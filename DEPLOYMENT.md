# Guide de Déploiement en Production - SELMai

Ce guide vous accompagne pas à pas pour déployer l'application SELMai en production sur un serveur VPS avec Apache.

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
- Apache2 avec SSL configuré
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

```bash
# Autoriser SSH
sudo ufw allow OpenSSH

# Autoriser HTTP et HTTPS pour Apache
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

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
DOMAIN=selmai.fr
REACT_APP_API_URL=https://selmai.fr/api
```

> [!IMPORTANT]
> **Sauvegardez ces valeurs dans un endroit sûr !** Vous en aurez besoin pour les restaurations.

### 5. Configuration Apache

#### Activer les modules Apache nécessaires

```bash
# Activer les modules proxy et headers
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod deflate
sudo a2enmod ssl
sudo a2enmod rewrite

# Redémarrer Apache pour appliquer les changements
sudo systemctl restart apache2
```

#### Copier la configuration Apache

```bash
# Sauvegarder la configuration actuelle
sudo cp /etc/apache2/sites-available/selmai-le-ssl.conf /etc/apache2/sites-available/selmai-le-ssl.conf.backup

# Copier la nouvelle configuration
sudo cp apache/selmai-le-ssl.conf /etc/apache2/sites-available/selmai-le-ssl.conf

# Vérifier la configuration
sudo apache2ctl configtest
```

Si la configuration est correcte, vous devriez voir : `Syntax OK`

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

### 7. Redémarrer Apache

```bash
# Recharger la configuration Apache
sudo systemctl reload apache2

# Vérifier le statut
sudo systemctl status apache2
```

### 8. Vérification du déploiement

```bash
# Vérifier que tous les conteneurs sont en cours d'exécution
docker compose -f docker-compose.prod.yml ps

# Vérifier que les ports sont exposés
netstat -tlnp | grep -E ':(3000|3001)'

# Vérifier les logs
docker compose -f docker-compose.prod.yml logs -f

# Tester l'accès à l'application
curl https://selmai.fr
curl https://selmai.fr/api/health
```

Accédez à votre application via : **https://selmai.fr**

### 9. Connexion initiale

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

# Recharger Apache si la configuration a changé
sudo systemctl reload apache2
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
# Logs Docker
docker compose -f docker-compose.prod.yml logs -f

# Un service spécifique
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f db

# Logs Apache
sudo tail -f /var/log/apache2/error.log
sudo tail -f /var/log/apache2/access.log
```

### Vérifier l'état des services

```bash
# Statut des conteneurs
docker compose -f docker-compose.prod.yml ps

# Utilisation des ressources
docker stats

# Statut Apache
sudo systemctl status apache2
```

### Health checks

```bash
# Backend API
curl https://selmai.fr/api/health

# Frontend
curl https://selmai.fr/
```

## 🛠️ Maintenance

### Redémarrer un service

```bash
# Redémarrer un service Docker spécifique
docker compose -f docker-compose.prod.yml restart backend

# Redémarrer tous les services Docker
docker compose -f docker-compose.prod.yml restart

# Redémarrer Apache
sudo systemctl restart apache2
```

### Arrêter l'application

```bash
# Arrêter les conteneurs Docker
docker compose -f docker-compose.prod.yml down

# Arrêter Apache (déconseillé si d'autres sites sont hébergés)
sudo systemctl stop apache2
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

### Erreurs de proxy Apache

```bash
# Vérifier la configuration Apache
sudo apache2ctl configtest

# Vérifier les logs Apache
sudo tail -f /var/log/apache2/error.log

# Vérifier que les services Docker sont accessibles
curl http://localhost:3000
curl http://localhost:3001/api/health
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

## 🔒 Sécurité

### Renouvellement SSL

Si vous utilisez Let's Encrypt avec Apache :

```bash
# Renouveler le certificat
sudo certbot renew

# Recharger Apache
sudo systemctl reload apache2
```

### Mise à jour des headers de sécurité

Les headers de sécurité sont configurés dans Apache :
- `X-Frame-Options`
- `X-Content-Type-Options`
- `X-XSS-Protection`
- `Referrer-Policy`
- `Strict-Transport-Security`

## 📚 Architecture

L'application utilise l'architecture suivante :

```
Internet
    ↓
Apache (Port 443 HTTPS)
    ↓
    ├─→ /api/* → Docker Backend (Port 3001)
    └─→ /* → Docker Frontend (Port 3000)
```

## 🆘 Support

En cas de problème :
1. Consultez les logs Docker : `docker compose -f docker-compose.prod.yml logs`
2. Consultez les logs Apache : `sudo tail -f /var/log/apache2/error.log`
3. Vérifiez la documentation dans le dossier `docs/`
4. Créez une issue sur GitHub avec les détails de l'erreur

---

**SELMai** - Déploiement en production réussi ! 🎉
