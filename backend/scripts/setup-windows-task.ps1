# Script PowerShell pour configurer la tâche planifiée Windows
# Exécuter en tant qu'administrateur

param(
    [string]$ProjectPath = "F:\SELMAI\Application\SELMai\backend",
    [string]$TaskTime = "09:00"
)

# Vérifier que le chemin existe
if (!(Test-Path $ProjectPath)) {
    Write-Error "Le chemin du projet n'existe pas: $ProjectPath"
    exit 1
}

# Nom de la tâche
$TaskName = "SELMai-Daily-Report"

# Supprimer la tâche existante si elle existe
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Suppression de la tâche existante..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Créer la nouvelle tâche planifiée
Write-Host "Création de la tâche planifiée..." -ForegroundColor Green

# Action : exécuter le script batch
$Action = New-ScheduledTaskAction -Execute "$ProjectPath\scripts\run-daily-report.bat"

# Déclencheur : tous les jours à l'heure spécifiée
$Trigger = New-ScheduledTaskTrigger -Daily -At $TaskTime

# Paramètres
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Principal : exécuter avec les privilèges les plus élevés disponibles
$Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest

# Créer et enregistrer la tâche
$Task = New-ScheduledTask -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Description "Envoie un rapport quotidien des nouveaux services SELMai"

Register-ScheduledTask -TaskName $TaskName -InputObject $Task

Write-Host "✅ Tâche planifiée créée avec succès!" -ForegroundColor Green
Write-Host "📅 Nom de la tâche: $TaskName" -ForegroundColor Cyan
Write-Host "⏰ Heure d'exécution: $TaskTime tous les jours" -ForegroundColor Cyan
Write-Host "📂 Script: $ProjectPath\scripts\run-daily-report.bat" -ForegroundColor Cyan

Write-Host ""
Write-Host "Pour vérifier la tâche:" -ForegroundColor Yellow
Write-Host "Get-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray

Write-Host ""
Write-Host "Pour exécuter la tâche manuellement:" -ForegroundColor Yellow
Write-Host "Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray

Write-Host ""
Write-Host "Pour supprimer la tâche:" -ForegroundColor Yellow
Write-Host "Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false" -ForegroundColor Gray

Write-Host ""
Write-Host "⚠️  N'oubliez pas de configurer les variables d'environnement EMAIL_USER et EMAIL_PASSWORD!" -ForegroundColor Red