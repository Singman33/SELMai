-- Ajout de services de test pour la place du marché
USE selmai;

-- Services de Marie Dupont (user_id: 2)
INSERT INTO services (user_id, title, description, category_id, price, duration, is_active) VALUES
(2, 'Aide ménagère à domicile', 'Nettoyage complet de votre domicile : aspirateur, serpillière, poussière, salle de bain et cuisine. Service de qualité avec produits fournis.', 1, 25.00, '2 heures', TRUE),
(2, 'Garde d\'enfants en soirée', 'Garde vos enfants en soirée pour vous permettre de sortir en toute tranquillité. Expérience avec enfants de 3 à 12 ans.', 1, 15.00, 'Par heure', TRUE),
(2, 'Cours de cuisine française', 'Apprenez à cuisiner de délicieux plats français traditionnels. Cours personnalisés selon votre niveau et vos goûts.', 8, 35.00, '3 heures', TRUE);

-- Services de Jean Martin (user_id: 3)
INSERT INTO services (user_id, title, description, category_id, price, duration, is_active) VALUES
(3, 'Réparation de vélos', 'Réparation et entretien de tous types de vélos. Changement de pneus, réglage des freins, huilage de la chaîne.', 2, 20.00, '1 heure', TRUE),
(3, 'Montage de meubles IKEA', 'Je monte vos meubles IKEA rapidement et proprement. Outils fournis, expérience confirmée.', 2, 30.00, 'Variable', TRUE),
(3, 'Dépannage informatique', 'Résolution de problèmes informatiques : virus, lenteurs, installations logiciels, connexion internet.', 4, 40.00, '1-2 heures', TRUE);

-- Services de Sophie Bernard (user_id: 4)
INSERT INTO services (user_id, title, description, category_id, price, duration, is_active) VALUES
(4, 'Entretien de jardin', 'Taille des haies, tonte de pelouse, désherbage, plantation. Matériel fourni si nécessaire.', 3, 28.00, '3 heures', TRUE),
(4, 'Cours de yoga débutant', 'Séances de yoga pour débutants dans un cadre zen et bienveillant. Matériel de yoga fourni.', 9, 22.00, '1 heure', TRUE),
(4, 'Couture et retouches', 'Retouches de vêtements, ourlets, réparations. Travail soigné et rapide.', 7, 18.00, 'Variable', TRUE),
(4, 'Covoiturage Bordeaux', 'Trajets réguliers vers Bordeaux les mardis et jeudis. Départ 8h, retour 18h.', 6, 12.00, 'Aller-retour', TRUE);