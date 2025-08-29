# 📧 Configuration du Rapport Quotidien Automatisé SELMai

Ce système envoie automatiquement un email récapitulatif des nouveaux services créés chaque jour à `selmai@gmail.com`.

## 📋 Contenu du Rapport

Le rapport inclut pour chaque service créé dans les dernières 24h :
- **Libellé** : Titre et description du service
- **Type** : Offre (fond bleu) ou Demande (fond rose)
- **Catégorie** : Catégorie du service
- **Utilisateur** : Username et nom complet
- **Fréquence** : Renouvelable ou Consommable
- **Prix** : Montant en euros
- **Date de création** : Horodatage précis

## 🚀 Installation et Configuration

### 1. Variables d'environnement

Créer un fichier `.env` dans le dossier `backend/` avec :

```env
# Configuration Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Important** : Pour Gmail, utilisez un mot de passe d'application :
1. Allez sur [Google Account Security](https://myaccount.google.com/security)
2. Activez la validation en 2 étapes
3. Générez un mot de passe d'application : [App Passwords](https://myaccount.google.com/apppasswords)

### 2. Test manuel

```bash
cd backend
node scripts/daily-services-report.js
```

### 3. Configuration automatique

#### Sur Linux/Mac (Production)

```bash
chmod +x scripts/setup-cron.sh
# Éditer le chemin dans setup-cron.sh avant d'exécuter
./scripts/setup-cron.sh
```

#### Sur Windows (Développement)

Utiliser le Planificateur de tâches Windows :
1. Ouvrir "Planificateur de tâches"
2. Créer une tâche de base
3. Déclencheur : Quotidien à 09h00
4. Action : Démarrer un programme
5. Programme : `F:\SELMAI\Application\SELMai\backend\scripts\run-daily-report.bat`

## 📊 Planification par défaut

- **Heure** : 09h00 chaque matin
- **Fréquence** : Quotidienne
- **Email de destination** : selmai@gmail.com

## 📝 Logs

Les logs sont stockés dans `backend/logs/daily-report.log` :
- Nombre de services trouvés
- Statut d'envoi de l'email
- Erreurs éventuelles

## 🛠 Personnalisation

### Changer l'heure d'exécution

Modifier la ligne dans le cron (Linux/Mac) :
```bash
# 0 9 * * * : 09h00 tous les jours
# 0 18 * * * : 18h00 tous les jours
crontab -e
```

### Changer l'email de destination

Modifier directement dans `scripts/daily-services-report.js` :
```javascript
to: 'nouveau-email@example.com',
```

### Modifier la période de rapport

Changer la requête SQL dans le script :
```javascript
// Pour les 7 derniers jours
WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)

// Pour la semaine en cours
WHERE YEARWEEK(s.created_at, 1) = YEARWEEK(NOW(), 1)
```

## 🔧 Dépannage

### Email non reçu
1. Vérifier les variables d'environnement
2. Vérifier les logs : `cat backend/logs/daily-report.log`
3. Tester manuellement le script

### Cron ne s'exécute pas
1. Vérifier les tâches cron : `crontab -l`
2. Vérifier les logs système : `tail -f /var/log/syslog`
3. Tester le script manuellement

### Base de données inaccessible
1. Vérifier que le serveur MySQL est démarré
2. Vérifier les paramètres de connexion dans `config/database.js`

## 📧 Exemple d'Email

```
Sujet: 📊 Récapitulatif quotidien SELMai - 3 nouveaux services

Contenu:
┌─────────────────────────────────────────────────────────────────┐
│                    📊 Récapitulatif quotidien SELMai            │
│                           29/08/2025                           │
│                                                                 │
│                     3 nouveaux services créés                  │
│                                                                 │
│  Service          │ Type    │ Catégorie │ Utilisateur │ Prix   │
│  ─────────────────│─────────│───────────│─────────────│────────│
│  Cours de yoga    │ Offre   │ Sport     │ marie_yoga  │ 15 €   │
│  Aide ménage      │ Demande │ Ménage    │ paul_aide   │ 20 €   │
│  Réparation vélo  │ Offre   │ Bricolage │ alex_velo   │ 25 €   │
└─────────────────────────────────────────────────────────────────┘
```