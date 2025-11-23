# Instructions de Migration vers Apache

Ce document contient les instructions pour finaliser la migration de Nginx vers Apache.

## ✅ Modifications effectuées

### 1. Docker Compose
- ✅ Supprimé le service `nginx` 
- ✅ Supprimé le service `certbot`
- ✅ Exposé le backend sur le port `3001`
- ✅ Exposé le frontend sur le port `3000`
- ✅ Supprimé les volumes Nginx (`nginx_cache`, `certbot_www`, `certbot_conf`)

### 2. Configuration Apache
- ✅ Créé le fichier `apache/selmai-le-ssl.conf` avec la configuration complète
- ✅ Ajouté les headers de sécurité
- ✅ Configuré la compression
- ✅ Configuré les proxys pour `/api/` et `/`

### 3. Documentation
- ✅ Mis à jour `DEPLOYMENT.md` avec les instructions Apache
- ✅ Mis à jour `.env.example` avec le domaine `selmai.fr`

## 🚀 Étapes de déploiement

### Étape 1 : Activer les modules Apache nécessaires

```bash
# Activer les modules (certains sont peut-être déjà activés)
sudo a2enmod headers
sudo a2enmod deflate
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod ssl
```

### Étape 2 : Configurer Apache pour écouter sur le port 3000

```bash
# Ajouter le port 3000 dans la configuration des ports
echo "Listen 3000" | sudo tee -a /etc/apache2/ports.conf

# Vérifier que les ports sont bien configurés
grep "^Listen" /etc/apache2/ports.conf
# Devrait afficher :
# Listen 80
# Listen 443
# Listen 3000
```

### Étape 3 : Copier la configuration Apache

```bash
# Sauvegarder la configuration actuelle
sudo cp /etc/apache2/sites-available/selmai-le-ssl.conf /etc/apache2/sites-available/selmai-le-ssl.conf.backup

# Copier la nouvelle configuration
sudo cp /home/eric/SELMai/apache/selmai-le-ssl.conf /etc/apache2/sites-available/selmai-le-ssl.conf

# Vérifier la syntaxe (maintenant que les modules sont activés)
sudo apache2ctl configtest
```

### Étape 4 : Configurer le pare-feu

```bash
# Autoriser le port 3000 pour l'application SELMai
sudo ufw allow 3000/tcp

# Vérifier le statut
sudo ufw status
```

### Étape 5 : Arrêter les conteneurs actuels

```bash
cd /home/eric/SELMai
docker compose -f docker-compose.prod.yml down
```

### Étape 6 : Démarrer les nouveaux conteneurs

```bash
# Démarrer les services (sans Nginx)
docker compose -f docker-compose.prod.yml up -d

# Vérifier que les services sont démarrés
docker compose -f docker-compose.prod.yml ps

# Vérifier que les ports sont exposés
netstat -tlnp | grep -E ':(3000|3001)'
```

### Étape 7 : Redémarrer Apache

```bash
# Recharger la configuration Apache
sudo systemctl reload apache2

# Vérifier le statut
sudo systemctl status apache2
```

### Étape 8 : Vérification

```bash
# Tester directement les services Docker (sans passer par Apache)
curl http://localhost:3001/health
curl http://localhost:3000/

# Tester le site web statique (port 443)
curl https://selmai.fr/

# Tester l'application SELMai (port 3000)
curl https://selmai.fr:3000/
curl https://selmai.fr:3000/health
curl https://selmai.fr:3000/api/categories

# Vérifier les logs Apache
sudo tail -f /var/log/apache2/error.log

# Vérifier les logs Docker
docker compose -f docker-compose.prod.yml logs -f
```

## 🔍 Tests à effectuer

- [ ] Le site web statique est accessible sur `https://selmai.fr` (port 443)
- [ ] L'application SELMai est accessible sur `https://selmai.fr:3000`
- [ ] Le health check répond sur `https://selmai.fr:3000/health`
- [ ] Les routes API fonctionnent (ex: `https://selmai.fr:3000/api/categories`)
- [ ] La connexion fonctionne sur l'application
- [ ] Les headers de sécurité sont présents (vérifier avec les outils de développement du navigateur)
- [ ] La compression fonctionne
- [ ] Les logs Apache ne montrent pas d'erreurs

## 🔄 Rollback en cas de problème

Si quelque chose ne fonctionne pas :

```bash
# Restaurer l'ancienne configuration Apache
sudo cp /etc/apache2/sites-available/selmai-le-ssl.conf.backup /etc/apache2/sites-available/selmai-le-ssl.conf
sudo systemctl reload apache2

# Revenir à la version précédente du projet
cd /home/eric/SELMai
git checkout HEAD~1 docker-compose.prod.yml
docker compose -f docker-compose.prod.yml up -d
```

## 📝 Notes importantes

1. **Architecture** : 
   - **Port 443** : Site web statique depuis `/var/www/html`
   - **Port 3000** : Application SELMai (React frontend + API backend via proxy)
2. **Ports Docker** : Les services Docker sont exposés sur les ports 3000 (frontend) et 3001 (backend)
3. **Apache** : Apache fait office de reverse proxy pour l'application sur le port 3000
4. **Certificats SSL** : Les certificats Let's Encrypt existants sont réutilisés pour les deux ports
5. **Logs** : Les logs sont dans `/var/log/apache2/` pour le proxy et dans Docker pour les applications

## ⚠️ Points d'attention

- Le répertoire `nginx/` peut être supprimé après vérification que tout fonctionne
- Les certificats SSL doivent être renouvelés via `certbot` directement sur le serveur (pas via Docker)
- Apache doit être redémarré après chaque modification de configuration
