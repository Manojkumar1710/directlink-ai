-- ============================================
-- DirectLink AI - PostgreSQL Database Schema
-- ============================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (
        role IN ('farmer', 'buyer')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. FARMER PROFILES
CREATE TABLE IF NOT EXISTS farmer_profiles (
    id UUID PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,
    village VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),
    geo_lat NUMERIC,
    geo_lng NUMERIC
);

-- 3. BUYER PROFILES
CREATE TABLE IF NOT EXISTS buyer_profiles (
    id UUID PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,
    business_name VARCHAR(150),
    business_type VARCHAR(100),
    address TEXT,
    geo_lat NUMERIC,
    geo_lng NUMERIC
);

-- 4. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL CHECK (
        unit IN ('kg', 'dozen', 'litre')
    ),
    icon_url TEXT
);

-- 5. PRICE REFERENCES
CREATE TABLE IF NOT EXISTS price_references (
    id UUID PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL
        REFERENCES products(id)
        ON DELETE CASCADE,
    region VARCHAR(100) NOT NULL,
    price_per_unit NUMERIC NOT NULL,
    source VARCHAR(150),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. LISTINGS
CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY,
    farmer_id UUID NOT NULL
        REFERENCES farmer_profiles(id)
        ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL
        REFERENCES products(id),
    region VARCHAR(100),
    unit VARCHAR(20),
    quantity NUMERIC NOT NULL,
    asking_price NUMERIC NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'sold', 'closed')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CONTACT LOGS
CREATE TABLE IF NOT EXISTS contact_logs (
    id UUID PRIMARY KEY,
    listing_id UUID NOT NULL
        REFERENCES listings(id)
        ON DELETE CASCADE,
    buyer_id UUID NOT NULL
        REFERENCES buyer_profiles(id)
        ON DELETE CASCADE,
    contacted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    channel VARCHAR(20) NOT NULL CHECK (
        channel IN ('call', 'whatsapp')
    )
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_farmer_profiles_user_id
ON farmer_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_buyer_profiles_user_id
ON buyer_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_price_references_product_id
ON price_references(product_id);

CREATE INDEX IF NOT EXISTS idx_listings_farmer_id
ON listings(farmer_id);

CREATE INDEX IF NOT EXISTS idx_listings_product_id
ON listings(product_id);

CREATE INDEX IF NOT EXISTS idx_listings_status
ON listings(status);

CREATE INDEX IF NOT EXISTS idx_contact_logs_listing_id
ON contact_logs(listing_id);

CREATE INDEX IF NOT EXISTS idx_contact_logs_buyer_id
ON contact_logs(buyer_id);