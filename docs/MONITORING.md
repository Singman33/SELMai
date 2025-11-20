# Guide de Monitoring et Maintenance - SELMai

Ce guide vous aide à surveiller et maintenir votre installation SELMai en production.

## 📊 Monitoring des Services

### Vérification rapide de l'état

```bash
# Statut de tous les conteneurs
docker compose -f docker compose.prod.yml ps

# Vérification de santé
docker compose -f docker compose.prod.yml ps | grep -E "(healthy|unhealthy)"
```

### Health Checks

Tous les services ont des health checks configurés :

```bash
# Vérifier le statut de santé d'un conteneur
docker inspect --format='{{.State.Health.Status}}' selmai-backend-1
docker inspect --format='{{.State.Health.Status}}' selmai-frontend-1
docker inspect --format='{{.State.Health.Status}}' selmai-db-1
docker inspect --format='{{.State.Health.Status}}' selmai-nginx-1

# Endpoints de health check
curl https://votre-domaine.com/health          # Frontend
curl https://votre-domaine.com/api/health      # Backend
```

## 📝 Gestion des Logs

### Consulter les logs

```bash
# Tous les services (temps réel)
docker compose -f docker compose.prod.yml logs -f

# Un service spécifique
docker compose -f docker compose.prod.yml logs -f backend
docker compose -f docker compose.prod.yml logs -f frontend
docker compose -f docker compose.prod.yml logs -f db
docker compose -f docker compose.prod.yml logs -f nginx

# Dernières 100 lignes
docker compose -f docker compose.prod.yml logs --tail=100

# Logs depuis une date
docker compose -f docker compose.prod.yml logs --since 2024-01-20T10:00:00
```

### Recherche dans les logs

```bash
# Rechercher les erreurs
docker compose -f docker compose.prod.yml logs | grep -i error

# Rechercher les tentatives de connexion
docker compose -f docker compose.prod.yml logs backend | grep -i login

# Rechercher par code HTTP
docker compose -f docker compose.prod.yml logs nginx | grep " 500 "
docker compose -f docker compose.prod.yml logs nginx | grep " 404 "
```

### Rotation des logs

Les logs sont automatiquement limités par la configuration Docker :

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"    # Taille max par fichier
    max-file: "3"      # Nombre de fichiers conservés
```

### Exporter les logs

```bash
# Exporter tous les logs vers un fichier
docker compose -f docker compose.prod.yml logs > logs_$(date +%Y%m%d).txt

# Exporter les logs d'une période
docker compose -f docker compose.prod.yml logs \
  --since "2024-01-20T00:00:00" \
  --until "2024-01-21T00:00:00" > logs_20240120.txt
```

## 💻 Monitoring des Ressources

### Utilisation en temps réel

```bash
# Vue d'ensemble de tous les conteneurs
docker stats

# Un conteneur spécifique
docker stats selmai-backend-1

# Format personnalisé
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
```

### Espace disque

```bash
# Espace disque du serveur
df -h

# Espace utilisé par Docker
docker system df

# Détails par type
docker system df -v

# Taille des volumes
docker volume ls -q | xargs docker volume inspect | grep -A 5 Mountpoint
```

### Nettoyage des ressources

```bash
# Nettoyer les images inutilisées
docker image prune -a

# Nettoyer les conteneurs arrêtés
docker container prune

# Nettoyer tout (ATTENTION: supprime les volumes non utilisés)
docker system prune -a --volumes

# Nettoyage sécurisé (sans les volumes)
docker system prune -a
```

## 🔍 Monitoring de la Base de Données

### Connexion à la base de données

```bash
# Se connecter à MariaDB
docker exec -it selmai-db-1 mysql -u selmai_user -p
```

### Requêtes de monitoring

```sql
-- Taille de la base de données
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'selmai'
GROUP BY table_schema;

-- Nombre d'enregistrements par table
SELECT 
    table_name AS 'Table',
    table_rows AS 'Rows'
FROM information_schema.tables
WHERE table_schema = 'selmai'
ORDER BY table_rows DESC;

-- Processus en cours
SHOW PROCESSLIST;

-- Variables de performance
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Queries';
SHOW STATUS LIKE 'Uptime';
```

### Performance de la base de données

```bash
# Logs de requêtes lentes (si activé)
docker exec selmai-db-1 cat /var/log/mysql/slow-query.log

# Statistiques de performance
docker exec selmai-db-1 mysqladmin -u root -p status
docker exec selmai-db-1 mysqladmin -u root -p extended-status
```

## 🌐 Monitoring Nginx

### Statistiques nginx

```bash
# Vérifier la configuration
docker exec selmai-nginx-1 nginx -t

# Recharger la configuration sans downtime
docker exec selmai-nginx-1 nginx -s reload

# Logs d'accès
docker compose -f docker compose.prod.yml logs nginx | grep "GET\|POST"

# Codes de statut HTTP
docker compose -f docker compose.prod.yml logs nginx | awk '{print $9}' | sort | uniq -c | sort -rn
```

### Analyse des logs nginx

```bash
# Top 10 des IPs
docker compose -f docker compose.prod.yml logs nginx | \
  awk '{print $1}' | sort | uniq -c | sort -rn | head -10

# Top 10 des URLs
docker compose -f docker compose.prod.yml logs nginx | \
  awk '{print $7}' | sort | uniq -c | sort -rn | head -10

# Requêtes par heure
docker compose -f docker compose.prod.yml logs nginx | \
  awk '{print $4}' | cut -d: -f2 | sort | uniq -c
```

## 📈 Métriques Applicatives

### Métriques Backend

Créez un endpoint de métriques dans le backend (`/api/metrics`) :

```bash
# Obtenir les métriques
curl https://votre-domaine.com/api/metrics
```

Exemple de métriques à surveiller :
- Nombre d'utilisateurs actifs
- Nombre de services publiés
- Nombre de négociations en cours
- Temps de réponse moyen

### Métriques de l'application

```bash
# Nombre d'utilisateurs (depuis la DB)
docker exec selmai-db-1 mysql -u selmai_user -p -e \
  "SELECT COUNT(*) as total_users FROM selmai.users;"

# Services actifs
docker exec selmai-db-1 mysql -u selmai_user -p -e \
  "SELECT COUNT(*) as active_services FROM selmai.services WHERE status='active';"

# Transactions du jour
docker exec selmai-db-1 mysql -u selmai_user -p -e \
  "SELECT COUNT(*) as today_transactions FROM selmai.transactions WHERE DATE(created_at) = CURDATE();"
```

## 🚨 Alertes et Notifications

### Script de monitoring simple

Créez `/opt/selmai/scripts/monitor.sh` :

```bash
#!/bin/bash

ALERT_EMAIL="admin@example.com"
DOMAIN="votre-domaine.com"

# Vérifier que les services sont up
if ! docker compose -f /opt/selmai/docker compose.prod.yml ps | grep -q "Up"; then
    echo "⚠️ Some services are down!" | mail -s "SELMai Alert: Services Down" $ALERT_EMAIL
fi

# Vérifier l'accès web
if ! curl -f -s https://$DOMAIN/health > /dev/null; then
    echo "⚠️ Website is not accessible!" | mail -s "SELMai Alert: Website Down" $ALERT_EMAIL
fi

# Vérifier l'API
if ! curl -f -s https://$DOMAIN/api/health > /dev/null; then
    echo "⚠️ API is not accessible!" | mail -s "SELMai Alert: API Down" $ALERT_EMAIL
fi

# Vérifier l'espace disque
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "⚠️ Disk usage is at ${DISK_USAGE}%!" | mail -s "SELMai Alert: Disk Space" $ALERT_EMAIL
fi
```

### Planifier le monitoring

```bash
# Ajouter au crontab (vérification toutes les 5 minutes)
*/5 * * * * /opt/selmai/scripts/monitor.sh
```

## 🛠️ Maintenance Régulière

### Checklist quotidienne

```bash
# Vérifier l'état des services
docker compose -f docker compose.prod.yml ps

# Vérifier les logs pour les erreurs
docker compose -f docker compose.prod.yml logs --since 24h | grep -i error

# Vérifier l'espace disque
df -h
```

### Checklist hebdomadaire

```bash
# Vérifier les sauvegardes
ls -lh /opt/selmai/backups/

# Nettoyer les images Docker inutilisées
docker image prune -a -f

# Vérifier les certificats SSL
docker compose -f docker compose.prod.yml exec certbot certbot certificates

# Vérifier les mises à jour système
sudo apt update && sudo apt list --upgradable
```

### Checklist mensuelle

```bash
# Tester une restauration de backup
# (voir docs/BACKUP.md)

# Vérifier les logs nginx pour les patterns suspects
docker compose -f docker compose.prod.yml logs nginx | grep -E "404|500" | wc -l

# Analyser les performances de la base de données
docker exec selmai-db-1 mysqlcheck -u root -p --optimize --all-databases

# Revoir les utilisateurs et permissions
docker exec selmai-db-1 mysql -u root -p -e "SELECT user, host FROM mysql.user;"
```

## 📊 Outils de Monitoring Avancés (Optionnel)

### Prometheus + Grafana

Pour un monitoring professionnel, ajoutez Prometheus et Grafana :

```yaml
# Ajouter à docker compose.prod.yml
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - selmai-network

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3002:3000"
    networks:
      - selmai-network
```

### Uptime Monitoring

Services externes gratuits pour surveiller la disponibilité :
- [UptimeRobot](https://uptimerobot.com/) - Gratuit jusqu'à 50 monitors
- [Pingdom](https://www.pingdom.com/) - Version gratuite limitée
- [StatusCake](https://www.statuscake.com/) - Plan gratuit disponible

## 🔧 Commandes Utiles

### Redémarrage des services

```bash
# Redémarrer un service spécifique
docker compose -f docker compose.prod.yml restart backend

# Redémarrer tous les services
docker compose -f docker compose.prod.yml restart

# Redémarrage complet (down + up)
docker compose -f docker compose.prod.yml down
docker compose -f docker compose.prod.yml up -d
```

### Mise à jour de l'application

```bash
# Voir le script de déploiement
./scripts/deploy.sh
```

### Accès aux conteneurs

```bash
# Shell dans un conteneur
docker exec -it selmai-backend-1 sh
docker exec -it selmai-frontend-1 sh
docker exec -it selmai-db-1 bash

# Exécuter une commande
docker exec selmai-backend-1 node --version
docker exec selmai-db-1 mysql --version
```

## 📋 Checklist de Monitoring

- [ ] Health checks configurés pour tous les services
- [ ] Logs consultables et rotation configurée
- [ ] Monitoring des ressources (CPU, RAM, disque)
- [ ] Alertes configurées pour les services critiques
- [ ] Sauvegardes vérifiées régulièrement
- [ ] Certificats SSL surveillés
- [ ] Espace disque surveillé
- [ ] Métriques applicatives collectées
- [ ] Plan de maintenance documenté
- [ ] Contacts d'urgence définis

## 📚 Ressources

- [Docker Monitoring Best Practices](https://docs.docker.com/config/daemon/prometheus/)
- [Nginx Monitoring](https://www.nginx.com/blog/monitoring-nginx/)
- [MariaDB Monitoring](https://mariadb.com/kb/en/monitoring-and-troubleshooting/)

---

**Un bon monitoring = des problèmes détectés avant qu'ils n'impactent les utilisateurs** 📊
