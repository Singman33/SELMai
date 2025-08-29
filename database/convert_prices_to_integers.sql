-- Migration pour convertir tous les prix/montants en entiers
-- Date: 2025-08-29
-- Description: Supprime les décimales de tous les prix et montants

USE selmai;

-- Arrondir les valeurs existantes à l'entier le plus proche
-- (supprime simplement les décimales car les prix sont en général des entiers)

UPDATE services SET price = ROUND(price);
UPDATE users SET balance = ROUND(balance);
UPDATE negotiations SET proposed_price = ROUND(proposed_price) WHERE proposed_price IS NOT NULL;
UPDATE transactions SET amount = ROUND(amount);

-- Maintenant modifier les types de colonnes
-- 1. Services : prix
ALTER TABLE services MODIFY COLUMN price INT NOT NULL COMMENT 'Prix en radis (entier)';

-- 2. Users : balance
ALTER TABLE users MODIFY COLUMN balance INT DEFAULT 0 COMMENT 'Solde en radis (entier)';

-- 3. Negotiations : proposed_price
ALTER TABLE negotiations MODIFY COLUMN proposed_price INT NULL COMMENT 'Prix proposé en radis (entier)';

-- 4. Transactions : amount
ALTER TABLE transactions MODIFY COLUMN amount INT NOT NULL COMMENT 'Montant en radis (entier)';

-- Vérifier les changements
SELECT 'services' as table_name, COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'selmai' AND TABLE_NAME = 'services' AND COLUMN_NAME = 'price'
UNION ALL
SELECT 'users' as table_name, COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'selmai' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'balance'
UNION ALL
SELECT 'negotiations' as table_name, COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'selmai' AND TABLE_NAME = 'negotiations' AND COLUMN_NAME = 'proposed_price'
UNION ALL
SELECT 'transactions' as table_name, COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'selmai' AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'amount';