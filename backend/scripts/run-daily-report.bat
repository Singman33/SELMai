@echo off
REM Script Windows pour exécuter le rapport quotidien SELMai

REM Aller dans le répertoire du backend
cd /d "F:\SELMAI\Application\SELMai\backend"

REM Créer le répertoire logs si nécessaire
if not exist "logs" mkdir logs

REM Exécuter le script de rapport quotidien
echo %date% %time%: Démarrage du rapport quotidien >> logs\daily-report.log
node scripts\daily-services-report.js >> logs\daily-report.log 2>&1
echo %date% %time%: Rapport quotidien terminé >> logs\daily-report.log

echo Rapport quotidien SELMai exécuté - Voir logs\daily-report.log pour les détails