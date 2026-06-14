-- Supabase / PostgreSQL schema for Mini-E-commerce-App
-- Run this using psql or Supabase SQL editor

-- Users table
-- Requires pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegramUsername TEXT UNIQUE NOT NULL,
  displayName TEXT NOT NULL,
  contactPhone TEXT,
  joinedAt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  coinsBalance INTEGER DEFAULT 0,
  totalOrdersCount INTEGER DEFAULT 0,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updatedAt TIMESTAMP WITH TIME ZONE
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  category TEXT,
  packageName TEXT,
  amount INTEGER,
  priceMmk INTEGER,
  gameId TEXT,
  serverId TEXT,
  telegramUsername TEXT,
  contactPhone TEXT,
  paymentMethod TEXT,
  transactionId TEXT,
  screenshotUrl TEXT,
  status TEXT,
  ocrVerified BOOLEAN DEFAULT false,
  ocrStatusText TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  iconName TEXT,
  imageUrl TEXT,
  helpText TEXT,
  requiresServerId BOOLEAN DEFAULT false,
  isHot BOOLEAN DEFAULT false,
  isValue BOOLEAN DEFAULT false,
  packages JSONB DEFAULT '[]'::jsonb,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updatedAt TIMESTAMP WITH TIME ZONE
);

-- Data feeds table (for manual knowledgebase)
CREATE TABLE IF NOT EXISTS data_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger TEXT NOT NULL,
  response TEXT NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT now()
);
