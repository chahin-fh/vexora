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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_guest_orders_status_created_at (status, created_at)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
