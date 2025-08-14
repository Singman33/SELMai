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
    balance DECIMAL(10,2) DEFAULT 0.00,
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
    price DECIMAL(10,2) NOT NULL,
    duration VARCHAR(100),
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
    proposed_price DECIMAL(10,2),
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
    amount DECIMAL(10,2) NOT NULL,
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

-- Création de l'utilisateur admin par défaut
INSERT INTO users (username, email, password_hash, first_name, last_name, balance, is_admin, is_active) VALUES
('admin', 'admin@selmai.local', '$2b$10$rQZ8kJz8k8k8k8k8k8k8kuO8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8', 'Admin', 'Système', 1000.00, TRUE, TRUE);

-- Création de quelques utilisateurs de test
INSERT INTO users (username, email, password_hash, first_name, last_name, balance, is_admin, is_active) VALUES
('marie.dupont', 'marie@selmai.local', '$2b$10$rQZ8kJz8k8k8k8k8k8k8kuO8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8', 'Marie', 'Dupont', 150.00, FALSE, TRUE),
('jean.martin', 'jean@selmai.local', '$2b$10$rQZ8kJz8k8k8k8k8k8k8kuO8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8', 'Jean', 'Martin', 75.50, FALSE, TRUE),
('sophie.bernard', 'sophie@selmai.local', '$2b$10$rQZ8kJz8k8k8k8k8k8k8kuO8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8', 'Sophie', 'Bernard', 200.00, FALSE, TRUE);