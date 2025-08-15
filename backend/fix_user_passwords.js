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

async function fixUserPasswords() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion à la base de données réussie');

    // Générer un hash pour le mot de passe "1234"
    const passwordHash = await bcrypt.hash('1234', 10);
    console.log('🔑 Hash généré pour le mot de passe "1234"');

    // Mettre à jour les mots de passe des utilisateurs de test
    const users = ['marie.dupont', 'jean.martin', 'sophie.bernard'];
    
    for (const username of users) {
      await connection.execute(
        'UPDATE users SET password_hash = ? WHERE username = ?',
        [passwordHash, username]
      );
      console.log(`✅ Mot de passe mis à jour pour ${username}`);
    }

    console.log('\n🎉 Tous les mots de passe ont été mis à jour !');
    console.log('📝 Vous pouvez maintenant vous connecter avec:');
    console.log('   - Username: marie.dupont, jean.martin, sophie.bernard ou admin');
    console.log('   - Password: 1234');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixUserPasswords();