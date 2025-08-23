-- Migration pour ajouter les types de services
-- Ajout de la colonne service_type à la table services

USE selmai;

-- Ajouter la nouvelle colonne service_type
ALTER TABLE services 
ADD COLUMN service_type ENUM('renewable', 'consumable') DEFAULT 'consumable' 
AFTER duration;

-- Ajouter un commentaire pour documenter les types
ALTER TABLE services 
MODIFY COLUMN service_type ENUM('renewable', 'consumable') DEFAULT 'consumable' 
COMMENT 'Type de service: renewable (renouvelable - peut être accepté plusieurs fois), consumable (consommable - une seule utilisation)';

-- Mettre à jour quelques services existants pour les tests
-- (Cette partie peut être adaptée selon les données existantes)
UPDATE services SET service_type = 'consumable' WHERE title LIKE '%formation%' OR title LIKE '%cours%';
UPDATE services SET service_type = 'renewable' WHERE service_type IS NULL OR service_type = '';

-- Créer une table pour tracker les services consommés
CREATE TABLE service_consumptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    buyer_id INT NOT NULL,
    negotiation_id INT,
    consumed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (negotiation_id) REFERENCES negotiations(id) ON DELETE SET NULL,
    UNIQUE KEY unique_service_consumption (service_id, buyer_id),
    INDEX idx_service_consumptions_service (service_id),
    INDEX idx_service_consumptions_buyer (buyer_id)
) COMMENT 'Tracking des services consommables utilisés par les acheteurs';

-- Vérification
SELECT id, title, service_type FROM services LIMIT 10;