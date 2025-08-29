-- Migration pour ajouter le champ service_category à la table services
-- Date: 2025-08-29
-- Description: Ajoute la distinction entre offres et demandes de services

USE selmai;

-- Ajouter le champ service_category à la table services
ALTER TABLE services 
ADD COLUMN service_category ENUM('offer', 'request') DEFAULT 'offer' 
COMMENT 'Catégorie de service: offer (offre de service), request (demande de service)'
AFTER service_type;

-- Mettre à jour les services existants pour être des offres par défaut
UPDATE services SET service_category = 'offer' WHERE service_category IS NULL;

-- Vérifier la structure mise à jour
DESCRIBE services;