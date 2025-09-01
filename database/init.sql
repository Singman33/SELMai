-- Base de données SELMai - Système d'échange local

CREATE DATABASE IF NOT EXISTS selmai;
USE selmai;

-- Table des utilisateurs
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    balance INT DEFAULT 0 COMMENT 'Solde en radis (entier)',
    rating DECIMAL(3,2) DEFAULT 0.00,
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des catégories
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des annonces/services
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category_id INT NOT NULL,
    price INT NOT NULL COMMENT 'Prix en radis (entier)',
    duration VARCHAR(100),
    service_type ENUM('renewable', 'consumable') DEFAULT 'consumable' COMMENT 'Type de service: renewable (renouvelable), consumable (consommable - une seule utilisation)',
    service_category ENUM('offer', 'request') DEFAULT 'offer' COMMENT 'Catégorie de service: offer (offre de service), request (demande de service)',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Table des négociations
CREATE TABLE negotiations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    proposed_price INT COMMENT 'Prix proposé en radis (entier)',
    message TEXT,
    status ENUM('pending', 'accepted', 'rejected', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (seller_id) REFERENCES users(id)
);

-- Table des transactions
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_user_id INT,
    to_user_id INT NOT NULL,
    amount INT NOT NULL COMMENT 'Montant en radis (entier)',
    description TEXT,
    transaction_type ENUM('payment', 'admin_adjustment', 'refund') DEFAULT 'payment',
    service_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
);

-- Table des notifications
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    notification_type ENUM('negotiation', 'transaction', 'admin', 'system') DEFAULT 'system',
    related_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table des évaluations
CREATE TABLE ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rater_id INT NOT NULL,
    rated_id INT NOT NULL,
    service_id INT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rater_id) REFERENCES users(id),
    FOREIGN KEY (rated_id) REFERENCES users(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
);

-- Table pour tracker les services consommés
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
);

-- Insertion des catégories par défaut
INSERT INTO categories (name, description) VALUES
('Services à la personne', 'Aide ménagère, garde d\'enfants, courses...'),
('Bricolage', 'Réparations, montage de meubles, peinture...'),
('Jardinage', 'Entretien de jardin, taille, plantation...'),
('Informatique', 'Dépannage, formation, installation...'),
('Enseignement', 'Cours particuliers, formations...'),
('Transport', 'Covoiturage, déménagement...'),
('Artisanat', 'Couture, tricot, poterie...'),
('Cuisine', 'Préparation de repas, pâtisserie...'),
('Bien-être', 'Massage, relaxation, sport...'),
('Autre', 'Services divers');

-- Création de l'utilisateur admin par défaut (mot de passe: 1234)
INSERT INTO users (username, email, password_hash, first_name, last_name, balance, is_admin, is_active) VALUES
('admin', 'admin@selmai.local', '$2a$10$oCxk.vmb3antkOIiS/35DOozB1ANkc2VDvXlkW0LI8TugbmY0f4la', 'Admin', 'Système', 1000, TRUE, TRUE);

-- Création de quelques utilisateurs de test
INSERT INTO users (username, email, password_hash, first_name, last_name, balance, is_admin, is_active) VALUES
('nathalie.jordana', 'nathalie.j@selmai.local', '$2b$10$rQZ8kJz8k8k8k8k8k8k8kuO8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8', 'Nathalie', 'Jordana', 200, FALSE, TRUE),
('philippe.paya', 'philippe.p@selmai.local', '$2b$10$rQZ8kJz8k8k8k8k8k8k8kuO8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8', 'Philippe', 'Paya', 200, FALSE, TRUE),
('laurent.laval', 'laurent.l@selmai.local', '$2b$10$rQZ8kJz8k8k8k8k8k8k8kuO8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8', 'Laurent', 'Laval', 200, FALSE, TRUE);