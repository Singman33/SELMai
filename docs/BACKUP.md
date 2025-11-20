# Guide de Sauvegarde et Restauration - SELMai

Ce guide détaille les stratégies de sauvegarde et les procédures de restauration pour SELMai.

## 📦 Stratégie de Sauvegarde

### Qu'est-ce qui doit être sauvegardé ?

1. **Base de données MariaDB** (critique)
   - Toutes les données utilisateurs
   - Services, négociations, transactions
   - Configuration de l'application

2. **Fichiers de configuration** (important)
   - `.env` (secrets et configuration)
   - `docker compose.prod.yml`
   - Configuration nginx

3. **Uploads utilisateurs** (si applicable)
   - Images de profil
   - Photos de services

### Fréquence des sauvegardes

| Type | Fréquence | Rétention |
|------|-----------|-----------|
| Base de données | Quotidienne | 7 jours |
| Configuration | Hebdomadaire | 4 semaines |
| Complète | Mensuelle | 3 mois |

## 🔄 Sauvegardes Automatiques

### Configuration de la sauvegarde quotidienne

```bash
# Éditer le crontab
crontab -e

# Ajouter cette ligne pour une sauvegarde quotidienne à 2h du matin
0 2 * * * cd /opt/selmai && ./scripts/backup.sh >> /var/log/selmai-backup.log 2>&1
```

### Vérifier les sauvegardes planifiées

```bash
# Lister les tâches cron
crontab -l

# Vérifier les logs de sauvegarde
tail -f /var/log/selmai-backup.log
```

## 💾 Sauvegarde Manuelle

### Sauvegarde de la base de données

```bash
# Utiliser le script fourni
cd /opt/selmai
./scripts/backup.sh
```

Le script crée automatiquement :
- Un dump SQL de la base de données
- Compression gzip
- Horodatage dans le nom du fichier
- Rotation automatique (garde les 7 dernières sauvegardes)

### Sauvegarde manuelle avancée

```bash
# Sauvegarde avec timestamp personnalisé
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
docker exec selmai-db-1 mysqldump \
  -u selmai_user \
  -p'votre_mot_de_passe' \
  selmai > backup_${TIMESTAMP}.sql

# Compression
gzip backup_${TIMESTAMP}.sql
```

### Sauvegarde des fichiers de configuration

```bash
# Créer une archive des configurations
tar -czf config_backup_$(date +%Y%m%d).tar.gz \
  .env \
  docker compose.prod.yml \
  nginx/ \
  --exclude=nginx/ssl
```

## 🔐 Sauvegardes Chiffrées

Pour une sécurité maximale, chiffrez vos sauvegardes :

```bash
# Créer une sauvegarde chiffrée
./scripts/backup.sh
cd backups
gpg --symmetric --cipher-algo AES256 selmai_backup_*.sql.gz

# Vous serez invité à entrer une passphrase
# Conservez cette passphrase en lieu sûr !
```

### Déchiffrer une sauvegarde

```bash
gpg --decrypt selmai_backup_20250120_020000.sql.gz.gpg > backup_decrypted.sql.gz
```

## 📤 Stockage Externe des Sauvegardes

> [!IMPORTANT]
> **Ne stockez jamais uniquement les sauvegardes sur le même serveur !**

### Option 1 : Copie vers un serveur distant (SCP)

```bash
# Copier la dernière sauvegarde vers un serveur distant
LATEST_BACKUP=$(ls -t backups/selmai_backup_*.sql.gz | head -1)
scp $LATEST_BACKUP user@backup-server:/path/to/backups/
```

### Option 2 : Synchronisation avec rsync

```bash
# Synchroniser le dossier backups
rsync -avz --delete backups/ user@backup-server:/path/to/backups/
```

### Option 3 : Stockage cloud (AWS S3)

```bash
# Installer AWS CLI
sudo apt install awscli -y

# Configurer AWS
aws configure

# Uploader vers S3
LATEST_BACKUP=$(ls -t backups/selmai_backup_*.sql.gz | head -1)
aws s3 cp $LATEST_BACKUP s3://votre-bucket/selmai-backups/
```

### Script de sauvegarde avec upload automatique

Créez `/opt/selmai/scripts/backup-and-upload.sh` :

```bash
#!/bin/bash
set -e

# Créer la sauvegarde
cd /opt/selmai
./scripts/backup.sh

# Obtenir la dernière sauvegarde
LATEST_BACKUP=$(ls -t backups/selmai_backup_*.sql.gz | head -1)

# Chiffrer
gpg --batch --yes --passphrase-file /root/.backup-passphrase \
  --symmetric --cipher-algo AES256 "$LATEST_BACKUP"

# Uploader vers serveur distant
scp "${LATEST_BACKUP}.gpg" backup-user@backup-server:/backups/selmai/

# Nettoyer le fichier chiffré local
rm "${LATEST_BACKUP}.gpg"

echo "Backup uploaded successfully: ${LATEST_BACKUP}.gpg"
```

## 🔄 Restauration

### Restauration complète

```bash
# 1. Arrêter l'application
cd /opt/selmai
docker compose -f docker compose.prod.yml down

# 2. Lister les sauvegardes disponibles
ls -lh backups/

# 3. Restaurer la sauvegarde
./scripts/restore.sh backups/selmai_backup_20250120_020000.sql.gz

# 4. Redémarrer l'application
docker compose -f docker compose.prod.yml up -d
```

### Restauration depuis une sauvegarde chiffrée

```bash
# 1. Déchiffrer
gpg --decrypt backups/selmai_backup_20250120_020000.sql.gz.gpg > backup_temp.sql.gz

# 2. Restaurer
./scripts/restore.sh backup_temp.sql.gz

# 3. Nettoyer
rm backup_temp.sql.gz
```

### Restauration depuis un serveur distant

```bash
# Télécharger depuis le serveur de backup
scp backup-user@backup-server:/backups/selmai/latest.sql.gz ./backups/

# Restaurer
./scripts/restore.sh backups/latest.sql.gz
```

## 🧪 Test de Restauration

> [!TIP]
> **Testez régulièrement vos sauvegardes !** Une sauvegarde non testée est une sauvegarde qui pourrait ne pas fonctionner.

### Procédure de test mensuelle

```bash
# 1. Créer un environnement de test
mkdir -p /tmp/selmai-test
cd /tmp/selmai-test

# 2. Copier les fichiers de configuration
cp -r /opt/selmai/{docker compose.prod.yml,nginx,backend,frontend,database} .

# 3. Modifier les ports pour éviter les conflits
sed -i 's/80:80/8080:80/g' docker compose.prod.yml
sed -i 's/443:443/8443:443/g' docker compose.prod.yml

# 4. Restaurer la dernière sauvegarde
# ... suivre la procédure de restauration

# 5. Vérifier que l'application fonctionne
curl http://localhost:8080

# 6. Nettoyer
docker compose -f docker compose.prod.yml down -v
cd /opt/selmai
rm -rf /tmp/selmai-test
```

## 📊 Monitoring des Sauvegardes

### Vérifier l'espace disque

```bash
# Vérifier l'espace disponible
df -h

# Taille du dossier backups
du -sh backups/
```

### Alertes de sauvegarde

Script pour vérifier que les sauvegardes sont récentes :

```bash
#!/bin/bash
# /opt/selmai/scripts/check-backup.sh

BACKUP_DIR="/opt/selmai/backups"
MAX_AGE_HOURS=26  # 26 heures pour une sauvegarde quotidienne

LATEST_BACKUP=$(ls -t $BACKUP_DIR/selmai_backup_*.sql.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ ALERT: No backup found!"
    exit 1
fi

BACKUP_AGE=$(($(date +%s) - $(stat -c %Y "$LATEST_BACKUP")))
BACKUP_AGE_HOURS=$((BACKUP_AGE / 3600))

if [ $BACKUP_AGE_HOURS -gt $MAX_AGE_HOURS ]; then
    echo "❌ ALERT: Latest backup is $BACKUP_AGE_HOURS hours old!"
    exit 1
else
    echo "✅ OK: Latest backup is $BACKUP_AGE_HOURS hours old"
    exit 0
fi
```

Ajouter au crontab :

```bash
# Vérifier les sauvegardes tous les jours à 10h
0 10 * * * /opt/selmai/scripts/check-backup.sh || echo "Backup check failed!" | mail -s "SELMai Backup Alert" admin@example.com
```

## 📋 Checklist de Sauvegarde

- [ ] Sauvegardes automatiques configurées (cron)
- [ ] Script de sauvegarde testé et fonctionnel
- [ ] Sauvegardes stockées sur un serveur distant
- [ ] Sauvegardes chiffrées (si données sensibles)
- [ ] Procédure de restauration documentée
- [ ] Test de restauration effectué au moins une fois
- [ ] Monitoring de l'espace disque en place
- [ ] Alertes configurées en cas d'échec de sauvegarde
- [ ] Rotation des sauvegardes configurée
- [ ] Documentation des mots de passe de chiffrement

## 🚨 Plan de Reprise d'Activité (PRA)

### Scénario 1 : Perte de données récentes

```bash
# Restaurer la dernière sauvegarde
./scripts/restore.sh backups/latest.sql.gz
```

**RTO** (Recovery Time Objective) : 15 minutes  
**RPO** (Recovery Point Objective) : 24 heures max

### Scénario 2 : Serveur complètement perdu

1. Provisionner un nouveau serveur
2. Suivre le guide [DEPLOYMENT.md](../DEPLOYMENT.md)
3. Restaurer la dernière sauvegarde depuis le stockage externe
4. Mettre à jour les DNS si nécessaire

**RTO** : 2-4 heures  
**RPO** : 24 heures max

### Scénario 3 : Corruption de base de données

1. Identifier le point de corruption
2. Restaurer depuis une sauvegarde antérieure à la corruption
3. Rejouer les transactions si possible

## 📚 Ressources

- [MariaDB Backup Best Practices](https://mariadb.com/kb/en/backup-and-restore-overview/)
- [Docker Volume Backup](https://docs.docker.com/storage/volumes/#backup-restore-or-migrate-data-volumes)

---

**Une bonne stratégie de sauvegarde = tranquillité d'esprit** 💾
