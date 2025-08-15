const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'selmai_user',
  password: 'selmai_password',
  database: 'selmai',
  charset: 'utf8mb4'
};

async function showAllServices() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion à la base de données réussie\n');

    // Récupérer tous les services avec les informations utilisateur et catégorie
    const [services] = await connection.execute(`
      SELECT 
        s.id,
        s.title,
        s.description,
        s.price,
        s.duration,
        s.is_active,
        s.created_at,
        u.id as user_id,
        u.username,
        u.first_name,
        u.last_name,
        u.is_admin,
        c.name as category_name
      FROM services s
      JOIN users u ON s.user_id = u.id
      JOIN categories c ON s.category_id = c.id
      ORDER BY s.created_at DESC
    `);

    console.log(`📋 Total des services en base de données: ${services.length}`);
    console.log('=' .repeat(80));

    services.forEach((service, index) => {
      console.log(`\n🔹 Service #${service.id} (${index + 1}/${services.length})`);
      console.log(`📝 Titre: ${service.title}`);
      console.log(`👤 Créé par: ${service.first_name} ${service.last_name} (@${service.username})${service.is_admin ? ' [ADMIN]' : ''}`);
      console.log(`🏷️ Catégorie: ${service.category_name}`);
      console.log(`💰 Prix: ${service.price} radis`);
      console.log(`⏱️ Durée: ${service.duration || 'Non spécifiée'}`);
      console.log(`✅ Actif: ${service.is_active ? 'Oui' : 'Non'}`);
      console.log(`📅 Créé le: ${new Date(service.created_at).toLocaleString('fr-FR')}`);
      console.log(`📄 Description: ${service.description}`);
      console.log('-'.repeat(60));
    });

    // Statistiques par utilisateur
    console.log('\n📊 STATISTIQUES PAR UTILISATEUR:');
    console.log('=' .repeat(50));
    
    const userStats = {};
    services.forEach(service => {
      const userKey = `${service.first_name} ${service.last_name}`;
      if (!userStats[userKey]) {
        userStats[userKey] = {
          count: 0,
          username: service.username,
          isAdmin: service.is_admin,
          services: []
        };
      }
      userStats[userKey].count++;
      userStats[userKey].services.push({
        title: service.title,
        price: service.price,
        active: service.is_active
      });
    });

    Object.entries(userStats).forEach(([userName, stats]) => {
      console.log(`\n👤 ${userName} (@${stats.username})${stats.isAdmin ? ' [ADMIN]' : ''}`);
      console.log(`   📈 Nombre de services: ${stats.count}`);
      stats.services.forEach(service => {
        console.log(`   - ${service.title} (${service.price} radis)${service.active ? '' : ' [INACTIF]'}`);
      });
    });

    // Statistiques par catégorie
    console.log('\n📊 STATISTIQUES PAR CATÉGORIE:');
    console.log('=' .repeat(50));
    
    const categoryStats = {};
    services.forEach(service => {
      if (!categoryStats[service.category_name]) {
        categoryStats[service.category_name] = 0;
      }
      categoryStats[service.category_name]++;
    });

    Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`🏷️ ${category}: ${count} service(s)`);
      });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

showAllServices();