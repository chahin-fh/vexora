CREATE DATABASE IF NOT EXISTS vexora
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE vexora;

CREATE TABLE IF NOT EXISTS guest_orders (
  id CHAR(36) NOT NULL,
  customer_name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address VARCHAR(300) NOT NULL,
  city VARCHAR(80) NOT NULL,
  items JSON NOT NULL,
  total DECIMAL(12,3) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  stock_reserved TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_guest_orders_status_created_at (status, created_at)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

SET @order_stock_reserved_column_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'guest_orders'
    AND column_name = 'stock_reserved'
);
SET @order_stock_reserved_migration = IF(
  @order_stock_reserved_column_exists = 0,
  'ALTER TABLE guest_orders ADD COLUMN stock_reserved TINYINT(1) NOT NULL DEFAULT 0 AFTER status',
  'SELECT 1'
);
PREPARE order_stock_reserved_migration FROM @order_stock_reserved_migration;
EXECUTE order_stock_reserved_migration;
DEALLOCATE PREPARE order_stock_reserved_migration;

CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(100) NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  price DECIMAL(12,3) NOT NULL,
  old_price DECIMAL(12,3) DEFAULT NULL,
  badge VARCHAR(60) NOT NULL DEFAULT '',
  image VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_products_category (category)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

SET @product_quantity_column_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'products'
    AND column_name = 'quantity'
);
SET @product_quantity_migration = IF(
  @product_quantity_column_exists = 0,
  'ALTER TABLE products ADD COLUMN quantity INT UNSIGNED NOT NULL DEFAULT 0 AFTER category',
  'SELECT 1'
);
PREPARE product_quantity_migration FROM @product_quantity_migration;
EXECUTE product_quantity_migration;
DEALLOCATE PREPARE product_quantity_migration;
