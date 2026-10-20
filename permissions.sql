-- Create user 'store_manager' and grant SELECT, INSERT, UPDATE permissions
CREATE USER IF NOT EXISTS 'store_manager'@'localhost' IDENTIFIED BY 'password123';
GRANT SELECT, INSERT, UPDATE ON retail_store.* TO 'store_manager'@'localhost';
-- Revoke UPDATE permission from 'store_manager'
REVOKE UPDATE ON retail_store.* FROM 'store_manager'@'localhost';
-- Grant DELETE permission ONLY on Sales table
GRANT DELETE ON retail_store.Sales TO 'store_manager'@'localhost';
-- Apply changes
FLUSH PRIVILEGES;