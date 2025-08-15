const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'selmai_user',
  password: 'selmai_password',
  database: 'selmai',
  charset: 'utf8mb4'
};

async function setAllPasswords() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion à la base de données réussie\n');

    // Générer un hash pour le mot de passe "1234"
    const passwordHash = await bcrypt.hash('1234', 10);
    console.log('🔑 Hash généré pour le mot de passe "1234"');
    console.log(`📝 Hash: ${passwordHash}\n`);

    // Récupérer tous les utilisateurs
    const [users] = await connection.execute('SELECT id, username, first_name, last_name FROM users WHERE is_active = TRUE');
    
    console.log(`👥 ${users.length} utilisateur(s) trouvé(s) en base de données:`);
    users.forEach(user => {
      console.log(`   - ID ${user.id}: ${user.first_name} ${user.last_name} (@${user.username})`);
    });
    
    console.log('\n🔄 Mise à jour des mots de passe...');

    // Mettre à jour le mot de passe pour tous les utilisateurs
    for (const user of users) {
      await connection.execute(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [passwordHash, user.id]
      );
      console.log(`✅ Mot de passe mis à jour pour ${user.first_name} ${user.last_name} (@${user.username})`);
    }

    console.log('\n🎉 SUCCÈS ! Tous les mots de passe ont été mis à jour !');
    console.log('=' .repeat(60));
    console.log('📋 RÉCAPITULATIF DES COMPTES:');
    console.log('=' .repeat(60));
    
    users.forEach(user => {
      console.log(`👤 ${user.first_name} ${user.last_name}`);
      console.log(`   📧 Username: ${user.username}`);
      console.log(`   🔐 Password: 1234`);
      console.log('');
    });

    console.log('💡 Vous pouvez maintenant vous connecter à l\'application avec:');
    console.log('   - N\'importe quel username ci-dessus');
    console.log('   - Mot de passe: 1234');

    // Vérifier que les mots de passe fonctionnent
    console.log('\n🧪 TEST DE VÉRIFICATION:');
    const testPassword = '1234';
    for (const user of users.slice(0, 2)) { // Tester seulement les 2 premiers pour ne pas surcharger
      const [result] = await connection.execute(
        'SELECT password_hash FROM users WHERE id = ?',
        [user.id]
      );
      
      const isValid = await bcrypt.compare(testPassword, result[0].password_hash);
      console.log(`${isValid ? '✅' : '❌'} Test mot de passe pour ${user.username}: ${isValid ? 'SUCCÈS' : 'ÉCHEC'}`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setAllPasswords();