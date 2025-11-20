# Configuration Apache comme Reverse Proxy pour SELMai

Si vous souhaitez accéder à SELMai via les ports standards (80/443) tout en gardant Apache, vous pouvez configurer Apache comme reverse proxy.

## Prérequis

- Apache installé et fonctionnel
- Modules Apache nécessaires activés

## Activation des modules Apache

```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod headers
sudo a2enmod ssl
sudo systemctl restart apache2
```

## Configuration du VirtualHost

Créez un fichier de configuration pour SELMai :

```bash
sudo nano /etc/apache2/sites-available/selmai.conf
```

Ajoutez la configuration suivante :

```apache
<VirtualHost *:80>
    ServerName selmai.votredomaine.com
    ServerAdmin admin@votredomaine.com

    # Redirection vers HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}$1 [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName selmai.votredomaine.com
    ServerAdmin admin@votredomaine.com

    # SSL Configuration (utilisez vos certificats existants)
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/selmai.votredomaine.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/selmai.votredomaine.com/privkey.pem

    # Reverse Proxy vers l'application Docker
    ProxyPreserveHost On
    ProxyPass / http://localhost:8080/
    ProxyPassReverse / http://localhost:8080/

    # WebSocket support (si nécessaire)
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://localhost:8080/$1 [P,L]

    # Headers de sécurité
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"

    # Logs
    ErrorLog ${APACHE_LOG_DIR}/selmai-error.log
    CustomLog ${APACHE_LOG_DIR}/selmai-access.log combined
</VirtualHost>
```

## Activation du site

```bash
# Activer le site
sudo a2ensite selmai.conf

# Vérifier la configuration
sudo apache2ctl configtest

# Redémarrer Apache
sudo systemctl restart apache2
```

## Vérification

Votre application SELMai devrait maintenant être accessible via :
- http://selmai.votredomaine.com (redirigé vers HTTPS)
- https://selmai.votredomaine.com

Apache agit comme reverse proxy et redirige les requêtes vers l'application Docker sur le port 8080.

## Alternative : Accès direct

Si vous préférez accéder directement à l'application Docker sans reverse proxy :
- **HTTP** : http://votredomaine.com:8080
- **HTTPS** : https://votredomaine.com:8443

## Notes

- Assurez-vous que les ports 8080 et 8443 sont ouverts dans votre pare-feu
- Si vous utilisez Apache comme reverse proxy, seuls les ports 80 et 443 doivent être accessibles publiquement
- Les ports 8080 et 8443 peuvent rester accessibles uniquement en local (localhost)
