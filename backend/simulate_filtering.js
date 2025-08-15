const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'selmai_user',
  password: 'selmai_password',
  database: 'selmai',
  charset: 'utf8mb4'
};

async function simulateFiltering() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // Récupérer tous les services
    const [allServices] = await connection.execute(`
      SELECT s.id, s.title, s.user_id, u.first_name, u.last_name, u.username
      FROM services s
      JOIN users u ON s.user_id = u.id
      WHERE s.is_active = TRUE
      ORDER BY s.id
    `);

    // Récupérer tous les utilisateurs
    const [users] = await connection.execute(`
      SELECT id, first_name, last_name, username, is_admin
      FROM users
      WHERE is_active = TRUE
    `);

    console.log('🔍 SIMULATION DU FILTRAGE DE LA PLACE DU MARCHÉ');
    console.log('=' .repeat(60));
    console.log(`📋 Total services en base: ${allServices.length}`);
    console.log('=' .repeat(60));

    users.forEach(user => {
      console.log(`\n👤 UTILISATEUR CONNECTÉ: ${user.first_name} ${user.last_name} (ID: ${user.id})${user.is_admin ? ' [ADMIN]' : ''}`);
      
      // Simuler le filtrage: exclure ses propres services
      const visibleServices = allServices.filter(service => service.user_id !== user.id);
      const ownServices = allServices.filter(service => service.user_id === user.id);
      
      console.log(`📈 Services visibles: ${visibleServices.length}/${allServices.length}`);
      console.log(`🚫 Services filtrés (ses propres services): ${ownServices.length}`);
      
      if (ownServices.length > 0) {
        console.log('   Services filtrés:');
        ownServices.forEach(service => {
          console.log(`   - ${service.title}`);
        });
      }
      
      console.log('   Services visibles dans la place du marché:');
      visibleServices.forEach(service => {
        console.log(`   ✅ ${service.title} (par ${service.first_name} ${service.last_name})`);
      });
      
      console.log('-'.repeat(50));
    });

    console.log('\n💡 EXPLICATION:');
    console.log('La différence entre le nombre total de services (11) et ce qui s\'affiche');
    console.log('dans la place du marché dépend de qui est connecté:');
    console.log('- La place du marché filtre automatiquement les services de l\'utilisateur connecté');
    console.log('- C\'est normal: on ne peut pas négocier avec soi-même !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

simulateFiltering();