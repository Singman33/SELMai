#!/bin/bash

# Script pour configurer le cron job du rapport quotidien SELMai
# À exécuter sur le serveur de production

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Chemin vers le projet (à adapter selon l'environnement)
PROJECT_PATH="${1:-/path/to/SELMai/backend}"
CRON_TIME="${2:-0 9}"  # Par défaut: 09h00 (format: minute heure)

echo -e "${BLUE}📋 Configuration du rapport quotidien SELMai${NC}"
echo -e "${YELLOW}Chemin du projet: $PROJECT_PATH${NC}"

# Vérifier que le chemin existe
if [ ! -d "$PROJECT_PATH" ]; then
    echo -e "${RED}❌ Erreur: Le chemin du projet n'existe pas: $PROJECT_PATH${NC}"
    echo -e "${YELLOW}Usage: $0 [/chemin/vers/SELMai/backend] [minute heure]${NC}"
    exit 1
fi

# Créer le répertoire pour les logs si nécessaire
mkdir -p "$PROJECT_PATH/logs"

# Créer le script wrapper pour le cron
cat > "$PROJECT_PATH/scripts/run-daily-report.sh" << EOF
#!/bin/bash

# Définir le répertoire de travail
cd $PROJECT_PATH

# Charger les variables d'environnement si un fichier .env existe
if [ -f .env ]; then
    export \$(cat .env | grep -v '#' | grep -v '^$' | xargs)
fi

# Charger NVM si disponible (pour Node.js)
if [ -f ~/.nvm/nvm.sh ]; then
    source ~/.nvm/nvm.sh
fi

# Exécuter le script de rapport quotidien
echo "\$(date): Démarrage du rapport quotidien" >> logs/daily-report.log
node scripts/daily-services-report.js >> logs/daily-report.log 2>&1
echo "\$(date): Rapport quotidien terminé" >> logs/daily-report.log
echo "----------------------------------------" >> logs/daily-report.log
EOF

# Rendre le script exécutable
chmod +x "$PROJECT_PATH/scripts/run-daily-report.sh"

# Créer la nouvelle entrée cron
CRON_ENTRY="$CRON_TIME * * * $PROJECT_PATH/scripts/run-daily-report.sh"

# Sauvegarder les tâches cron existantes
crontab -l > /tmp/current_cron 2>/dev/null || touch /tmp/current_cron

# Vérifier si la tâche existe déjà
if grep -q "run-daily-report.sh" /tmp/current_cron; then
    echo -e "${YELLOW}⚠️  Une tâche SELMai existe déjà, remplacement...${NC}"
    # Supprimer l'ancienne tâche
    grep -v "run-daily-report.sh" /tmp/current_cron > /tmp/new_cron
else
    cp /tmp/current_cron /tmp/new_cron
fi

# Ajouter la nouvelle tâche
echo "$CRON_ENTRY" >> /tmp/new_cron

# Installer la nouvelle crontab
crontab /tmp/new_cron

# Nettoyer les fichiers temporaires
rm -f /tmp/current_cron /tmp/new_cron

echo -e "${GREEN}✅ Cron job configuré avec succès!${NC}"
echo -e "${BLUE}⏰ Heure d'exécution: ${CRON_TIME#* }h${CRON_TIME% *} tous les jours${NC}"
echo -e "${BLUE}📁 Script: $PROJECT_PATH/scripts/run-daily-report.sh${NC}"
echo -e "${BLUE}📝 Logs: $PROJECT_PATH/logs/daily-report.log${NC}"
echo ""
echo -e "${YELLOW}Commandes utiles:${NC}"
echo -e "${GREEN}crontab -l${NC}                    # Voir les tâches cron actuelles"
echo -e "${GREEN}crontab -e${NC}                    # Éditer les tâches cron"
echo -e "${GREEN}tail -f $PROJECT_PATH/logs/daily-report.log${NC}  # Suivre les logs"
echo -e "${GREEN}$PROJECT_PATH/scripts/run-daily-report.sh${NC}           # Test manuel"
echo ""
echo -e "${RED}⚠️  N'oubliez pas de:${NC}"
echo -e "${YELLOW}1. Configurer les variables EMAIL_USER et EMAIL_PASSWORD dans .env${NC}"
echo -e "${YELLOW}2. Tester le script manuellement: node scripts/daily-services-report.js --test${NC}"
echo -e "${YELLOW}3. Vérifier que Node.js est accessible dans l'environnement cron${NC}"