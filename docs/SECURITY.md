# Guide de Sécurité - SELMai Production

Ce document décrit les meilleures pratiques de sécurité pour votre déploiement SELMai en production.

## 🔐 Secrets et Mots de Passe

### Génération de secrets sécurisés

```bash
# Générer un secret JWT fort
openssl rand -base64 64

# Générer des mots de passe de base de données
openssl rand -base64 32

# Alternative avec pwgen
pwgen -s 32 1
```

### Stockage des secrets

> [!CAUTION]
> **Ne commitez JAMAIS les secrets dans Git !**

- ✅ Utilisez le fichier `.env` (déjà dans `.gitignore`)
- ✅ Stockez une copie chiffrée des secrets hors du serveur
- ✅ Utilisez un gestionnaire de mots de passe (1Password, Bitwarden, etc.)
- ❌ Ne partagez jamais les secrets par email ou chat non chiffré

### Rotation des secrets

Changez régulièrement vos secrets (tous les 3-6 mois) :

```bash
# 1. Générer un nouveau JWT_SECRET
NEW_JWT_SECRET=$(openssl rand -base64 64)

# 2. Mettre à jour le fichier .env
nano .env

# 3. Redémarrer le backend
docker compose -f docker compose.prod.yml restart backend
```

## 🛡️ Hardening du Serveur

### 1. Configuration SSH

```bash
# Éditer la configuration SSH
sudo nano /etc/ssh/sshd_config
```

Recommandations :
```
# Désactiver la connexion root
PermitRootLogin no

# Utiliser uniquement les clés SSH
PasswordAuthentication no
PubkeyAuthentication yes

# Limiter les utilisateurs autorisés
AllowUsers votre_utilisateur

# Changer le port SSH (optionnel mais recommandé)
Port 2222
```

```bash
# Redémarrer SSH
sudo systemctl restart sshd
```

### 2. Fail2Ban

Protection contre les attaques par force brute :

```bash
# Installation
sudo apt install fail2ban -y

# Configuration
sudo nano /etc/fail2ban/jail.local
```

Configuration recommandée :
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
```

```bash
# Démarrer Fail2Ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Vérifier le statut
sudo fail2ban-client status
```

### 3. Mises à jour automatiques

```bash
# Installer unattended-upgrades
sudo apt install unattended-upgrades -y

# Configurer
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 🔒 Sécurité de la Base de Données

### Mots de passe forts

Assurez-vous d'utiliser des mots de passe forts pour :
- `DB_ROOT_PASSWORD` : Au moins 32 caractères
- `DB_PASSWORD` : Au moins 32 caractères

### Isolation réseau

La base de données n'est accessible que depuis le réseau Docker interne :

```yaml
# Dans docker compose.prod.yml - PAS de ports exposés publiquement
db:
  # ❌ NE PAS exposer le port 3306 publiquement
  # ports:
  #   - "3306:3306"
```

### Sauvegardes chiffrées

```bash
# Créer une sauvegarde chiffrée
./scripts/backup.sh
gpg --symmetric --cipher-algo AES256 backups/selmai_backup_*.sql.gz

# Déchiffrer une sauvegarde
gpg --decrypt backups/selmai_backup_*.sql.gz.gpg > backup_decrypted.sql.gz
```

## 🌐 Sécurité Nginx et SSL/TLS

### Configuration SSL optimale

Le fichier `nginx/nginx.conf` inclut déjà :
- ✅ TLS 1.2 et 1.3 uniquement
- ✅ Ciphers sécurisés
- ✅ HSTS (HTTP Strict Transport Security)
- ✅ Headers de sécurité

### Vérification SSL

```bash
# Tester la configuration SSL
curl -I https://votre-domaine.com

# Tester avec SSL Labs
# Visitez : https://www.ssllabs.com/ssltest/
```

### Renouvellement automatique des certificats

Le conteneur `certbot` renouvelle automatiquement les certificats. Vérifiez :

```bash
# Vérifier les certificats
docker compose -f docker compose.prod.yml exec certbot certbot certificates

# Test de renouvellement
docker compose -f docker compose.prod.yml run --rm certbot renew --dry-run
```

## 🚦 Rate Limiting

La configuration nginx inclut déjà du rate limiting :

- **API générale** : 10 requêtes/seconde
- **Login** : 5 tentatives/minute

Pour ajuster :

```nginx
# Dans nginx/nginx.conf
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
```

## 🔍 Audit et Logs

### Activer les logs d'audit

```bash
# Vérifier les logs nginx
docker compose -f docker compose.prod.yml logs nginx | grep -i error

# Vérifier les logs backend
docker compose -f docker compose.prod.yml logs backend | grep -i error

# Surveiller les tentatives de connexion
docker compose -f docker compose.prod.yml logs backend | grep -i "login"
```

### Rotation des logs

Les logs Docker sont déjà configurés avec rotation :

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 🔐 Sécurité de l'Application

### Changement du mot de passe admin

**IMPORTANT** : Changez le mot de passe admin par défaut immédiatement après le déploiement !

1. Connectez-vous avec `admin` / `1234`
2. Allez dans les paramètres du profil
3. Changez le mot de passe

### Politique de mots de passe

Recommandations pour les utilisateurs :
- Minimum 8 caractères
- Mélange de majuscules, minuscules, chiffres et symboles
- Pas de mots du dictionnaire

### Sessions et JWT

Les tokens JWT expirent automatiquement. Configuration dans le backend :

```javascript
// Durée de validité du token (défaut: 24h)
expiresIn: '24h'
```

## 🛡️ Protection DDoS

### Cloudflare (recommandé)

Pour une protection DDoS robuste, utilisez Cloudflare :

1. Créez un compte sur [Cloudflare](https://www.cloudflare.com)
2. Ajoutez votre domaine
3. Configurez les DNS selon les instructions
4. Activez le proxy (nuage orange)
5. Activez les règles de sécurité

### Rate limiting nginx

Déjà configuré dans `nginx/nginx.conf` :

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
```

## 📋 Checklist de Sécurité

Avant de mettre en production :

- [ ] Tous les secrets sont générés aléatoirement
- [ ] Le fichier `.env` n'est pas commité dans Git
- [ ] Le mot de passe admin par défaut a été changé
- [ ] SSH est configuré avec clés uniquement
- [ ] Fail2Ban est installé et actif
- [ ] Le pare-feu (UFW) est activé
- [ ] SSL/TLS est configuré avec Let's Encrypt
- [ ] Les certificats se renouvellent automatiquement
- [ ] Les sauvegardes automatiques sont configurées
- [ ] Les logs sont surveillés
- [ ] Les mises à jour automatiques sont activées
- [ ] Le port de la base de données n'est PAS exposé publiquement

## 🚨 En cas de Compromission

Si vous suspectez une compromission :

1. **Isoler immédiatement**
   ```bash
   docker compose -f docker compose.prod.yml down
   ```

2. **Analyser les logs**
   ```bash
   docker compose -f docker compose.prod.yml logs > incident_logs.txt
   ```

3. **Changer tous les secrets**
   - Générer de nouveaux secrets
   - Mettre à jour `.env`
   - Redéployer

4. **Restaurer depuis une sauvegarde saine**
   ```bash
   ./scripts/restore.sh backups/selmai_backup_SAFE.sql.gz
   ```

5. **Notifier les utilisateurs** si des données ont été compromises

## 📚 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)

---

**La sécurité est un processus continu, pas un état final.** 🔒
