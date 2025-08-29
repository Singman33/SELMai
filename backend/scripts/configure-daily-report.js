#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Interface readline pour les interactions
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction pour poser une question
const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

// Couleurs pour l'affichage console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const c = (color, text) => `${colors[color]}${text}${colors.reset}`;

console.log(c('blue', '\n📧 Configuration du Rapport Quotidien SELMai'));
console.log(c('cyan', '═'.repeat(50)));

async function main() {
  try {
    console.log(c('yellow', '\n🔍 Vérification de l\'environnement...'));

    // Vérifier que nous sommes dans le bon répertoire
    const backendPath = path.resolve(__dirname, '..');
    const packageJsonPath = path.join(backendPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      console.log(c('red', '❌ Erreur: package.json non trouvé. Veuillez exécuter ce script depuis le dossier backend/scripts/'));
      process.exit(1);
    }

    // Vérifier si nodemailer est installé
    try {
      require('nodemailer');
      console.log(c('green', '✅ nodemailer est installé'));
    } catch (error) {
      console.log(c('yellow', '⚠️  nodemailer n\'est pas installé, installation...'));
      execSync('npm install nodemailer', { cwd: backendPath, stdio: 'inherit' });
      console.log(c('green', '✅ nodemailer installé avec succès'));
    }

    // Configuration des variables d'environnement
    console.log(c('yellow', '\n📝 Configuration de l\'email...'));
    
    const envPath = path.join(backendPath, '.env');
    let envContent = '';
    
    // Lire le fichier .env existant s'il existe
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      console.log(c('green', '✅ Fichier .env existant trouvé'));
    } else {
      console.log(c('yellow', '⚠️  Fichier .env non trouvé, création d\'un nouveau fichier'));
    }

    // Questions interactives
    const emailUser = await question(c('cyan', '📧 Adresse email d\'envoi (ex: your-email@gmail.com): '));
    
    if (!emailUser || !emailUser.includes('@')) {
      console.log(c('red', '❌ Adresse email invalide'));
      process.exit(1);
    }

    const emailPassword = await question(c('cyan', '🔑 Mot de passe d\'application Gmail: '));
    
    if (!emailPassword) {
      console.log(c('red', '❌ Mot de passe requis'));
      process.exit(1);
    }

    // Ajouter/mettre à jour les variables dans le fichier .env
    const updateEnvVar = (content, key, value) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const line = `${key}=${value}`;
      
      if (regex.test(content)) {
        return content.replace(regex, line);
      } else {
        return content + (content.endsWith('\n') ? '' : '\n') + line + '\n';
      }
    };

    envContent = updateEnvVar(envContent, 'EMAIL_USER', emailUser);
    envContent = updateEnvVar(envContent, 'EMAIL_PASSWORD', emailPassword);

    // Sauvegarder le fichier .env
    fs.writeFileSync(envPath, envContent);
    console.log(c('green', '✅ Configuration sauvegardée dans .env'));

    // Test du script
    console.log(c('yellow', '\n🧪 Test du script de rapport...'));
    
    const testChoice = await question(c('cyan', 'Voulez-vous tester le script maintenant ? (o/n): '));
    
    if (testChoice.toLowerCase().startsWith('o')) {
      console.log(c('blue', '🚀 Exécution du test...'));
      
      try {
        const testResult = execSync('node daily-services-report.js --test', {
          cwd: path.join(__dirname),
          encoding: 'utf8',
          stdio: 'inherit'
        });
        
        console.log(c('green', '✅ Test réussi ! Vérifiez le fichier HTML généré.'));
        
      } catch (error) {
        console.log(c('red', '❌ Erreur lors du test:'));
        console.error(error.message);
      }
    }

    // Configuration de la planification
    console.log(c('yellow', '\n⏰ Configuration de la planification...'));
    console.log(c('cyan', '1. Windows: Utiliser le Planificateur de tâches'));
    console.log(c('cyan', '2. Linux/Mac: Utiliser cron'));
    console.log(c('cyan', '3. Ignorer pour l\'instant'));
    
    const scheduleChoice = await question(c('cyan', 'Votre choix (1-3): '));
    
    switch (scheduleChoice) {
      case '1':
        console.log(c('blue', '\n🪟 Configuration Windows:'));
        console.log(c('yellow', 'Exécutez en tant qu\'administrateur:'));
        console.log(c('green', `powershell -ExecutionPolicy Bypass -File "${path.join(__dirname, 'setup-windows-task.ps1')}"`));
        break;
        
      case '2':
        console.log(c('blue', '\n🐧 Configuration Linux/Mac:'));
        console.log(c('yellow', 'Exécutez la commande suivante:'));
        console.log(c('green', `chmod +x "${path.join(__dirname, 'setup-cron.sh')}"`));
        console.log(c('green', `"${path.join(__dirname, 'setup-cron.sh')}" "${backendPath}"`));
        break;
        
      case '3':
        console.log(c('yellow', '⏭️  Configuration de la planification ignorée'));
        break;
        
      default:
        console.log(c('red', '❌ Choix invalide'));
        break;
    }

    console.log(c('green', '\n✅ Configuration terminée !'));
    console.log(c('cyan', '\n📋 Résumé:'));
    console.log(c('yellow', `📧 Email: ${emailUser}`));
    console.log(c('yellow', `📁 Chemin: ${backendPath}`));
    console.log(c('yellow', `📄 Fichier de test: ${path.join(backendPath, 'test-reports')}`));
    
    console.log(c('cyan', '\n🛠️  Commandes utiles:'));
    console.log(c('green', `node scripts/daily-services-report.js --test  # Test`));
    console.log(c('green', `node scripts/daily-services-report.js         # Envoi réel`));
    
    console.log(c('blue', '\n📚 Plus d\'infos: voir scripts/README-CRON.md'));

  } catch (error) {
    console.error(c('red', '❌ Erreur:'), error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Gestion du signal d'interruption
rl.on('SIGINT', () => {
  console.log(c('yellow', '\n👋 Configuration annulée'));
  process.exit(0);
});

main();