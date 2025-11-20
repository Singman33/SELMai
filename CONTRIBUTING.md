# Guide de contribution - SELMai

Merci de votre intérêt pour contribuer à SELMai ! Ce document décrit le processus de contribution au projet.

## 🤝 Comment contribuer

### Signaler un bug

1. Vérifiez d'abord que le bug n'a pas déjà été signalé dans les [Issues](https://github.com/[votre-username]/SELMai/issues)
2. Créez une nouvelle issue en utilisant le template de bug report
3. Décrivez le problème de manière détaillée avec :
   - Les étapes pour reproduire le bug
   - Le comportement attendu vs observé
   - Votre environnement (OS, navigateur, version Docker, etc.)
   - Des captures d'écran si pertinentes

### Proposer une fonctionnalité

1. Vérifiez que la fonctionnalité n'existe pas déjà ou n'est pas en cours de développement
2. Créez une issue avec le label "enhancement"
3. Décrivez :
   - Le besoin ou problème que cela résoudrait
   - La solution proposée
   - Des alternatives considérées
   - L'impact sur les utilisateurs existants

### Soumettre du code

1. **Fork** le dépôt
2. **Clonez** votre fork localement
3. **Créez une branche** pour votre contribution :
   ```bash
   git checkout -b feature/nom-de-votre-fonctionnalite
   ```
4. **Implémentez** vos changements
5. **Testez** vos modifications
6. **Committez** avec des messages clairs
7. **Poussez** votre branche
8. **Créez une Pull Request**

## 📋 Standards de code

### Frontend (React TypeScript)

- Utilisez TypeScript strict
- Suivez les conventions de nommage React
- Utilisez des functional components avec hooks
- Commentez le code complexe
- Respectez la structure des dossiers existante

```typescript
// ✅ Bon
interface User {
  id: number;
  name: string;
}

const UserCard: React.FC<{ user: User }> = ({ user }) => {
  return <div>{user.name}</div>;
};

// ❌ Évitez
const userCard = (props) => {
  return <div>{props.user.name}</div>;
};
```

### Backend (Node.js Express)

- Utilisez les middlewares de sécurité
- Validez toutes les entrées utilisateur
- Gérez les erreurs de manière appropriée
- Utilisez des requêtes SQL préparées
- Respectez l'architecture REST

```javascript
// ✅ Bon
router.get('/users/:id', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'ID utilisateur invalide' });
    }
    
    const [users] = await db.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    res.json(users[0]);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur interne' });
  }
});

// ❌ Évitez
router.get('/users/:id', (req, res) => {
  db.query(`SELECT * FROM users WHERE id = ${req.params.id}`, (err, result) => {
    res.json(result);
  });
});
```

### Base de données

- Utilisez des migrations pour les changements de schéma
- Indexez les colonnes fréquemment utilisées
- Respectez les contraintes de clés étrangères
- Documentez les requêtes complexes

## 🧪 Tests

### Avant de soumettre

1. **Tests unitaires** : Assurez-vous que vos tests passent
   ```bash
   cd backend && npm test
   cd frontend && npm test
   ```

2. **Tests d'intégration** : Testez avec Docker
   ```bash
   docker compose up -d
   # Testez manuellement les fonctionnalités
   ```

3. **Linting** : Vérifiez le code
   ```bash
   npm run lint
   ```

### Écrire des tests

- Testez les cas normaux et les cas d'erreur
- Mockez les dépendances externes
- Utilisez des données de test réalistes
- Nommez vos tests clairement

## 📦 Process de Pull Request

### Checklist avant soumission

- [ ] Le code compile sans erreur
- [ ] Tous les tests passent
- [ ] Le linting est propre
- [ ] La documentation est mise à jour si nécessaire
- [ ] Les migrations de DB sont incluses si nécessaire
- [ ] Les changements sont testés manuellement

### Template de Pull Request

```markdown
## Description
Décrivez brièvement les changements apportés.

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Tests
- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Tests manuels effectués
- [ ] Tous les tests passent

## Captures d'écran (si applicable)

## Notes supplémentaires
```

### Review process

1. Au moins un maintainer doit approuver la PR
2. Tous les commentaires doivent être résolus
3. Le CI doit passer (quand configuré)
4. Le code sera mergé par un maintainer

## 🏗️ Architecture et conventions

### Structure des commits

Utilisez des messages de commit descriptifs :

```
type(scope): description

feat(auth): ajouter authentification à deux facteurs
fix(api): corriger validation des emails
docs(readme): mettre à jour installation Docker
style(frontend): améliorer responsive design
refactor(backend): optimiser requêtes de base de données
test(negotiations): ajouter tests unitaires
```

### Branches

- `main` : Code de production stable
- `develop` : Intégration des nouvelles fonctionnalités
- `feature/nom-fonctionnalite` : Développement de fonctionnalités
- `hotfix/nom-fix` : Corrections urgentes
- `release/version` : Préparation des releases

## 🔒 Sécurité

### Signaler une vulnérabilité

Pour les problèmes de sécurité sensibles :

1. **NE PAS** créer d'issue publique
2. Envoyez un email à l'équipe de sécurité
3. Attendez une réponse avant de divulguer publiquement
4. Nous nous engageons à répondre sous 48h

### Bonnes pratiques de sécurité

- Ne jamais committer de secrets (mots de passe, clés API, etc.)
- Valider et assainir toutes les entrées utilisateur
- Utiliser HTTPS en production
- Implémenter une authentification robuste
- Suivre le principe du moindre privilège

## 📞 Aide et support

### Où obtenir de l'aide

1. **Documentation** : Consultez d'abord le README et cette documentation
2. **Issues existantes** : Recherchez dans les issues fermées et ouvertes
3. **Discussions** : Utilisez les GitHub Discussions pour les questions générales
4. **Contact direct** : Pour les cas urgents ou sensibles

### Communauté

- Soyez respectueux et constructif
- Aidez les nouveaux contributeurs
- Partagez vos connaissances
- Célébrez les réussites ensemble

## 🙏 Reconnaissance

Tous les contributeurs seront reconnus dans :
- Le fichier AUTHORS
- Les notes de release
- La section remerciements du README

Merci de contribuer à rendre SELMai meilleur ! 🌱