-- Supabase / Postgres schema for Mini-E-commerce-App
-- Run this using the Supabase SQL editor or psql connected to your Supabase DB

-- Requires pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "users" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "telegramUsername" text UNIQUE NOT NULL,
  "displayName" text,
  "contactPhone" text,
  "joinedAt" timestamptz,
  "coinsBalance" integer DEFAULT 0,
  "totalOrdersCount" integer DEFAULT 0,
  "approved" boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  "updatedAt" timestamptz
);

CREATE TABLE IF NOT EXISTS "products" (
  id text PRIMARY KEY,
  name text,
  tagline text,
  "iconName" text,
  "imageUrl" text,
  "helpText" text,
  "requiresServerId" boolean DEFAULT false,
  "isHot" boolean DEFAULT false,
  "isValue" boolean DEFAULT false,
  packages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "orders" (
  id text PRIMARY KEY,
  category text,
  "packageName" text,
  amount integer,
  "priceMmk" integer,
  "gameId" text,
  "serverId" text,
  "telegramUsername" text,
  "contactPhone" text,
  "paymentMethod" text,
  "transactionId" text,
  "screenshotUrl" text,
  status text,
  "ocrVerified" boolean DEFAULT false,
  "ocrStatusText" text,
  createdAt timestamptz,
  updatedAt timestamptz
);

CREATE TABLE IF NOT EXISTS "data_feeds" (
  id text PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger text,
  response text,
  "createdAt" timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_telegram ON "orders" ("telegramUsername");
CREATE INDEX IF NOT EXISTS idx_orders_status ON "orders" (status);
CREATE INDEX IF NOT EXISTS idx_users_telegram ON "users" ("telegramUsername");
