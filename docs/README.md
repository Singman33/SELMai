# Documentation SELMai - Production

Ce dossier contient toute la documentation nécessaire pour déployer et maintenir SELMai en production.

## 📚 Guides Disponibles

### [SECURITY.md](SECURITY.md)
Guide complet de sécurité pour votre déploiement en production :
- Gestion des secrets et mots de passe
- Hardening du serveur (SSH, Fail2Ban, mises à jour)
- Sécurité de la base de données
- Configuration SSL/TLS optimale
- Protection DDoS et rate limiting
- Checklist de sécurité complète

### [BACKUP.md](BACKUP.md)
Stratégie de sauvegarde et restauration :
- Stratégie de sauvegarde (quotidienne, hebdomadaire, mensuelle)
- Sauvegardes automatiques avec cron
- Sauvegardes chiffrées avec GPG
- Stockage externe (SCP, rsync, S3)
- Procédures de restauration
- Tests de restauration
- Plan de Reprise d'Activité (PRA)

### [MONITORING.md](MONITORING.md)
Monitoring et maintenance de votre installation :
- Monitoring des services et health checks
- Gestion et analyse des logs
- Monitoring des ressources (CPU, RAM, disque)
- Monitoring de la base de données
- Alertes et notifications
- Checklists de maintenance (quotidienne, hebdomadaire, mensuelle)
- Outils de monitoring avancés (Prometheus, Grafana)

## 🚀 Démarrage Rapide

1. **Déploiement initial** : Consultez [../DEPLOYMENT.md](../DEPLOYMENT.md)
2. **Sécurisation** : Suivez [SECURITY.md](SECURITY.md)
3. **Sauvegardes** : Configurez selon [BACKUP.md](BACKUP.md)
4. **Monitoring** : Mettez en place selon [MONITORING.md](MONITORING.md)

## 📋 Ordre de Lecture Recommandé

Pour un nouveau déploiement :

1. **[../DEPLOYMENT.md](../DEPLOYMENT.md)** - Déployer l'application
2. **[SECURITY.md](SECURITY.md)** - Sécuriser le serveur
3. **[BACKUP.md](BACKUP.md)** - Configurer les sauvegardes
4. **[MONITORING.md](MONITORING.md)** - Mettre en place le monitoring

## 🆘 En Cas de Problème

- **Problème de déploiement** → [../DEPLOYMENT.md](../DEPLOYMENT.md) section Dépannage
- **Incident de sécurité** → [SECURITY.md](SECURITY.md) section "En cas de Compromission"
- **Perte de données** → [BACKUP.md](BACKUP.md) section "Plan de Reprise d'Activité"
- **Service down** → [MONITORING.md](MONITORING.md) section "Commandes Utiles"

---

**Bonne mise en production !** 🚀
