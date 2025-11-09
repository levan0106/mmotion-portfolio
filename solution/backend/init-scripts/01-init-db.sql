-- Initialize database with UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database if not exists (this will be handled by Docker)
-- CREATE DATABASE IF NOT EXISTS portfolio_db;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE portfolio_db TO postgres;
