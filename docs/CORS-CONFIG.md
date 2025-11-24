# Configuration CORS - SELMai

## Résumé

La configuration CORS du backend autorise les requêtes depuis plusieurs origines pour permettre l'accès à l'API depuis différents environnements.

## Origines autorisées

### Développement local
- `http://localhost:3000` - Frontend en développement
- `http://localhost:8080` - Frontend Docker
- `http://127.0.0.1:3000`
- `http://127.0.0.1:8080`

### Docker interne
- `http://backend:3001` - Communication interne
- `http://frontend:3000` - Frontend container
- `http://frontend:80`

### Production - selmai.fr
- `http://selmai.fr` et `https://selmai.fr`
- `http://selmai.fr:80` et `http://selmai.fr:8080`
- `https://selmai.fr:443` et `https://selmai.fr:8443`
- `http://www.selmai.fr` et `https://www.selmai.fr`
- `http://www.selmai.fr:80` et `http://www.selmai.fr:8080`
- `https://www.selmai.fr:443` et `https://www.selmai.fr:8443`

### Variable d'environnement
- `FRONTEND_URL` - Origine personnalisée via .env

## Règle flexible

En plus des origines explicites, **tout domaine** utilisant les ports suivants est automatiquement autorisé :
- Port 80 (HTTP standard)
- Port 8080 (HTTP alternatif)
- Port 443 (HTTPS standard)
- Port 8443 (HTTPS alternatif)
- Port 3000 (développement)
- Port vide (port par défaut du protocole)

Cela permet d'utiliser des domaines personnalisés comme `selmai.domain.lan:8080` sans modification du code.

## Ports utilisés

### En production (`docker-compose.prod.yml`)
- **3000** : Port frontend exposé (Docker)
- **3001** : Port backend exposé (Docker)
- **3306** : Port MySQL/MariaDB (exposé pour administration)

### En développement (`docker-compose.yml`)
- **3000** : Frontend React (exposé)
- **3001** : Backend Express (exposé)
- **3306** : MySQL/MariaDB (exposé)

## Notes importantes

1. **Requêtes sans origin** : Autorisées (Postman, curl, applications mobiles)
2. **Credentials** : Activé (`credentials: true`) pour les cookies et l'authentification
3. **Méthodes HTTP** : GET, POST, PUT, DELETE, OPTIONS, HEAD
4. **Headers autorisés** : Content-Type, Authorization, X-Requested-With, Accept, Origin

## Fichier de configuration

La configuration CORS se trouve dans [`backend/server.js`](../backend/server.js) aux lignes 23-75.

## Logs

Les requêtes CORS bloquées sont loguées avec le préfixe `❌ CORS blocked origin:` pour faciliter le débogage.
