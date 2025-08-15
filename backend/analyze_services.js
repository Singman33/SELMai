const data = require('./temp_services.json');

console.log('📊 Analyse des services retournés par l\'API:');
console.log('Nombre total de services:', data.length);
console.log('Services de Marie (id=2):', data.filter(s => s.userId === 2).length);
console.log('Services des autres utilisateurs:', data.filter(s => s.userId !== 2).length);

console.log('\n📋 Détail par utilisateur:');
const userServices = {};
data.forEach(service => {
  const userName = `${service.firstName} ${service.lastName}`;
  if (!userServices[userName]) {
    userServices[userName] = [];
  }
  userServices[userName].push(service.title);
});

Object.keys(userServices).forEach(user => {
  console.log(`- ${user}: ${userServices[user].length} service(s)`);
  userServices[user].forEach(title => console.log(`  * ${title}`));
});

console.log('\n🎯 Problème potentiel:');
console.log('Si Marie se connecte, elle devrait voir', data.filter(s => s.userId !== 2).length, 'services (tous sauf les siens)');