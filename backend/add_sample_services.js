const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'selmai_user',
  password: 'selmai_password',
  database: 'selmai',
  charset: 'utf8mb4'
};

async function addSampleServices() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion à la base de données réussie');

    // Vérifier s'il y a déjà des services
    const [existingServices] = await connection.execute('SELECT COUNT(*) as count FROM services');
    
    // Afficher les services existants
    const [services] = await connection.execute(`
      SELECT s.id, s.title, u.first_name, u.last_name, s.is_active 
      FROM services s 
      JOIN users u ON s.user_id = u.id
    `);
    
    console.log(`ℹ️ Il y a ${existingServices[0].count} service(s) en base.`);
    console.log('\n📋 Services existants:');
    services.forEach(service => {
      console.log(`- ${service.title} par ${service.first_name} ${service.last_name} (actif: ${service.is_active})`);
    });

    // Vérifier s'il y a des services pour les utilisateurs non-admin
    const [nonAdminServices] = await connection.execute(`
      SELECT COUNT(*) as count FROM services s 
      JOIN users u ON s.user_id = u.id 
      WHERE u.is_admin = false
    `);
    
    if (nonAdminServices[0].count === 0) {
      console.log('➕ Ajout des services de test...');

      const services = [
        // Services de Marie Dupont (user_id: 2)
        [2, 'Aide ménagère à domicile', 'Nettoyage complet de votre domicile : aspirateur, serpillière, poussière, salle de bain et cuisine. Service de qualité avec produits fournis.', 1, 25.00, '2 heures', true],
        [2, 'Garde d\'enfants en soirée', 'Garde vos enfants en soirée pour vous permettre de sortir en toute tranquillité. Expérience avec enfants de 3 à 12 ans.', 1, 15.00, 'Par heure', true],
        [2, 'Cours de cuisine française', 'Apprenez à cuisiner de délicieux plats français traditionnels. Cours personnalisés selon votre niveau et vos goûts.', 8, 35.00, '3 heures', true],
        
        // Services de Jean Martin (user_id: 3)
        [3, 'Réparation de vélos', 'Réparation et entretien de tous types de vélos. Changement de pneus, réglage des freins, huilage de la chaîne.', 2, 20.00, '1 heure', true],
        [3, 'Montage de meubles IKEA', 'Je monte vos meubles IKEA rapidement et proprement. Outils fournis, expérience confirmée.', 2, 30.00, 'Variable', true],
        [3, 'Dépannage informatique', 'Résolution de problèmes informatiques : virus, lenteurs, installations logiciels, connexion internet.', 4, 40.00, '1-2 heures', true],
        
        // Services de Sophie Bernard (user_id: 4)
        [4, 'Entretien de jardin', 'Taille des haies, tonte de pelouse, désherbage, plantation. Matériel fourni si nécessaire.', 3, 28.00, '3 heures', true],
        [4, 'Cours de yoga débutant', 'Séances de yoga pour débutants dans un cadre zen et bienveillant. Matériel de yoga fourni.', 9, 22.00, '1 heure', true],
        [4, 'Couture et retouches', 'Retouches de vêtements, ourlets, réparations. Travail soigné et rapide.', 7, 18.00, 'Variable', true],
        [4, 'Covoiturage Bordeaux', 'Trajets réguliers vers Bordeaux les mardis et jeudis. Départ 8h, retour 18h.', 6, 12.00, 'Aller-retour', true]
      ];

      for (const service of services) {
        await connection.execute(
          'INSERT INTO services (user_id, title, description, category_id, price, duration, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
          service
        );
      }

      console.log(`✅ ${services.length} services de test ajoutés avec succès !`);
    }

    // Vérifier les utilisateurs
    const [users] = await connection.execute('SELECT id, username, first_name, last_name, is_active FROM users');
    console.log('\n👥 Utilisateurs en base:');
    users.forEach(user => {
      console.log(`- ID ${user.id}: ${user.first_name} ${user.last_name} (@${user.username}) - Actif: ${user.is_active}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addSampleServices();