const nodemailer = require('nodemailer');
const db = require('../config/database');

// Configuration du transporteur email
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
  });
};

// Fonction pour récupérer les services créés dans les dernières 24h
const getServicesFromLastDay = async () => {
  try {
    const [services] = await db.execute(`
      SELECT 
        s.id,
        s.title,
        s.description,
        s.price,
        s.duration,
        s.service_type,
        s.service_category,
        s.created_at,
        u.username,
        u.first_name,
        u.last_name,
        c.name as category_name
      FROM services s
      JOIN users u ON s.user_id = u.id
      JOIN categories c ON s.category_id = c.id
      WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
      ORDER BY s.created_at DESC
    `);

    return services;
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    throw error;
  }
};

// Fonction pour formater le type de service
const formatServiceType = (type) => {
  return type === 'renewable' ? 'Renouvelable' : 'Consommable';
};

// Fonction pour formater la catégorie de service
const formatServiceCategory = (category) => {
  return category === 'offer' ? 'Offre' : 'Demande';
};

// Fonction pour formater la date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Fonction pour générer le contenu HTML de l'email
const generateEmailHTML = (services) => {
  const today = new Date().toLocaleDateString('fr-FR');
  
  if (services.length === 0) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Récapitulatif quotidien SELMai</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #3498db; }
          .header h1 { color: #2c3e50; margin: 0; }
          .date { color: #7f8c8d; margin-top: 10px; }
          .no-services { text-align: center; color: #7f8c8d; font-size: 18px; margin: 40px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Récapitulatif quotidien SELMai</h1>
            <div class="date">${today}</div>
          </div>
          
          <div class="no-services">
            🔍 Aucun nouveau service créé aujourd'hui
          </div>
        </div>
      </body>
      </html>
    `;
  }

  const servicesHTML = services.map(service => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #ecf0f1;">
        <strong>${service.title}</strong><br>
        <small style="color: #7f8c8d;">${service.description}</small>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #ecf0f1; text-align: center;">
        <span class="badge ${service.service_category === 'offer' ? 'offer' : 'request'}">
          ${formatServiceCategory(service.service_category)}
        </span>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #ecf0f1; text-align: center;">
        ${service.category_name}
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #ecf0f1; text-align: center;">
        ${service.username}<br>
        <small style="color: #7f8c8d;">${service.first_name} ${service.last_name}</small>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #ecf0f1; text-align: center;">
        ${formatServiceType(service.service_type)}
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #ecf0f1; text-align: center; font-weight: bold; color: #27ae60;">
        ${service.price} €
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #ecf0f1; text-align: center; color: #7f8c8d;">
        ${formatDate(service.created_at)}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Récapitulatif quotidien SELMai</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #3498db; }
        .header h1 { color: #2c3e50; margin: 0; }
        .date { color: #7f8c8d; margin-top: 10px; }
        .summary { background-color: #ecf0f1; padding: 20px; border-radius: 6px; margin-bottom: 30px; text-align: center; }
        .summary h2 { color: #2c3e50; margin: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #3498db; color: white; padding: 15px; text-align: left; font-weight: bold; }
        th.center { text-align: center; }
        .badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; color: white; }
        .badge.offer { background-color: #3498db; }
        .badge.request { background-color: #e91e63; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1; text-align: center; color: #7f8c8d; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Récapitulatif quotidien SELMai</h1>
          <div class="date">${today}</div>
        </div>
        
        <div class="summary">
          <h2>${services.length} nouveau${services.length > 1 ? 'x' : ''} service${services.length > 1 ? 's' : ''} créé${services.length > 1 ? 's' : ''}</h2>
        </div>

        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th class="center">Type</th>
              <th class="center">Catégorie</th>
              <th class="center">Utilisateur</th>
              <th class="center">Fréquence</th>
              <th class="center">Prix</th>
              <th class="center">Créé le</th>
            </tr>
          </thead>
          <tbody>
            ${servicesHTML}
          </tbody>
        </table>

        <div class="footer">
          <p>📧 Rapport généré automatiquement par SELMai</p>
          <p>Système d'Échange Local Mutualiste - Plateforme de services communautaires</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Fonction principale pour envoyer le rapport
const sendDailyReport = async (testMode = false) => {
  try {
    console.log('🚀 Démarrage du rapport quotidien...');
    
    // Récupérer les services de la journée
    const services = await getServicesFromLastDay();
    console.log(`📊 ${services.length} service(s) trouvé(s) pour aujourd'hui`);

    // Générer le contenu de l'email
    const htmlContent = generateEmailHTML(services);
    
    // En mode test, sauvegarder le HTML et ne pas envoyer l'email
    if (testMode) {
      const fs = require('fs');
      const path = require('path');
      
      // Créer le dossier de test s'il n'existe pas
      const testDir = path.join(__dirname, '../test-reports');
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      
      // Sauvegarder le rapport HTML
      const filename = `daily-report-${new Date().toISOString().split('T')[0]}.html`;
      const filepath = path.join(testDir, filename);
      fs.writeFileSync(filepath, htmlContent);
      
      console.log('✅ Mode test - Rapport sauvegardé:', filepath);
      return {
        success: true,
        servicesCount: services.length,
        testFile: filepath
      };
    }
    
    // Mode production - envoyer l'email
    const transporter = createTransporter();
    
    // Options de l'email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'selmai-noreply@gmail.com',
      to: 'selmai@gmail.com',
      subject: `📊 Récapitulatif quotidien SELMai - ${services.length} nouveau${services.length > 1 ? 'x' : ''} service${services.length > 1 ? 's' : ''}`,
      html: htmlContent
    };

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email envoyé avec succès:', info.messageId);
    
    return {
      success: true,
      servicesCount: services.length,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du rapport:', error);
    throw error;
  }
};

// Si le script est exécuté directement
if (require.main === module) {
  // Vérifier si on est en mode test
  const testMode = process.argv.includes('--test');
  
  sendDailyReport(testMode)
    .then((result) => {
      if (testMode) {
        console.log('✅ Rapport test généré avec succès');
        console.log(`📊 Services traités: ${result.servicesCount}`);
        console.log(`📄 Fichier: ${result.testFile}`);
      } else {
        console.log('✅ Rapport quotidien envoyé avec succès');
        console.log(`📊 Services traités: ${result.servicesCount}`);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur lors de l\'exécution:', error);
      process.exit(1);
    });
}

module.exports = { sendDailyReport };