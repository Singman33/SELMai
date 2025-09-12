-- Ajout de services de type "demande" pour diversifier la place du marché
USE selmai;

-- Services de type "demande" pour Marie Dupont (user_id: 2)
INSERT INTO services (user_id, title, description, category_id, price, duration, service_type, service_category, is_active) VALUES
(2, 'Recherche prof de piano', 'Je cherche un professeur de piano pour des cours hebdomadaires. Niveau débutant, disponible en soirée.', 8, 30.00, '1 heure', 'renewable', 'request', TRUE),
(2, 'Besoin aide déménagement', 'Je cherche quelqu\'un pour m\'aider à déménager le weekend prochain. Appartement 3 pièces, 2ème étage.', 2, 80.00, '1 journée', 'consumable', 'request', TRUE);

-- Services de type "demande" pour Jean Martin (user_id: 3)
INSERT INTO services (user_id, title, description, category_id, price, duration, service_type, service_category, is_active) VALUES
(3, 'Garde de chat pendant vacances', 'Je pars en vacances 2 semaines et cherche quelqu\'un pour garder mon chat à domicile. Chat très gentil.', 10, 15.00, 'Par jour', 'consumable', 'request', TRUE),
(3, 'Cours d\'anglais conversationnel', 'Je cherche quelqu\'un pour pratiquer l\'anglais en conversation. Niveau intermédiaire.', 8, 25.00, '1 heure', 'renewable', 'request', TRUE);

-- Services de type "demande" pour Sophie Bernard (user_id: 4)
INSERT INTO services (user_id, title, description, category_id, price, duration, service_type, service_category, is_active) VALUES
(4, 'Réparation fuite d\'eau', 'J\'ai une fuite sous mon évier de cuisine. Cherche plombier compétent pour intervention rapide.', 2, 60.00, '2 heures', 'consumable', 'request', TRUE),
(4, 'Covoiturage vers Paris', 'Je cherche une place en covoiturage pour Paris le vendredi 15. Participation aux frais d\'essence.', 6, 25.00, 'Aller simple', 'consumable', 'request', TRUE),
(4, 'Cours de guitare', 'Je souhaite apprendre la guitare acoustique. Cherche professeur patient pour débutant complet.', 8, 35.00, '1 heure', 'renewable', 'request', TRUE);

-- Vérifier les services ajoutés
SELECT 
    s.id, 
    s.title, 
    s.service_category,
    u.first_name,
    u.last_name
FROM services s 
JOIN users u ON s.user_id = u.id 
WHERE s.service_category = 'request'
ORDER BY s.created_at DESC;