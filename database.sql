-- ============================================
-- DirectLink AI - PostgreSQL Database Schema
-- ============================================

-- 1. USERS
create table if not exists users (
   id           uuid primary key,
   phone_number varchar(20) unique not null,
   name         varchar(100) not null,
   role         varchar(20) not null check ( role in ( 'farmer',
                                               'buyer' ) ),
   created_at   timestamptz not null default now()
);

-- 2. FARMER PROFILES
create table if not exists farmer_profiles (
   id       uuid primary key,
   user_id  uuid unique not null
      references users ( id )
         on delete cascade,
   village  varchar(100),
   district varchar(100),
   state    varchar(100),
   geo_lat  numeric,
   geo_lng  numeric
);

-- 3. BUYER PROFILES
create table if not exists buyer_profiles (
   id            uuid primary key,
   user_id       uuid unique not null
      references users ( id )
         on delete cascade,
   business_name varchar(150),
   business_type varchar(100),
   address       text,
   geo_lat       numeric,
   geo_lng       numeric
);

-- 4. PRODUCTS
create table if not exists products (
   id       varchar(50) primary key,
   name     varchar(100) not null,
   category varchar(100) not null,
   unit     varchar(20) not null check ( unit in ( 'kg',
                                               'dozen',
                                               'litre' ) ),
   icon_url text
);

-- 5. PRICE REFERENCES
create table if not exists price_references (
   id             uuid primary key,
   product_id     varchar(50) not null
      references products ( id )
         on delete cascade,
   region         varchar(100) not null,
   price_per_unit numeric not null,
   source         varchar(150),
   updated_at     timestamptz not null default now()
);

-- 6. LISTINGS
create table if not exists listings (
   id           uuid primary key,
   farmer_id    uuid not null
      references farmer_profiles ( id )
         on delete cascade,
   product_id   varchar(50) not null
      references products ( id ),
      region varchar(100),
unit varchar(20),
   quantity     numeric not null,
   asking_price numeric not null,
   status       varchar(20) not null default 'active' check ( status in ( 'active',
                                                                    'sold',
                                                                    'closed' ) ),
   created_at   timestamptz not null default now()
);

-- 7. CONTACT LOGS
create table if not exists contact_logs (
   id           uuid primary key,
   listing_id   uuid not null
      references listings ( id )
         on delete cascade,
   buyer_id     uuid not null
      references buyer_profiles ( id )
         on delete cascade,
   contacted_at timestamptz not null default now(),
   channel      varchar(20) not null check ( channel in ( 'call',
                                                     'whatsapp' ) )
);

-- ============================================
-- INDEXES
-- ============================================

create index if not exists idx_farmer_profiles_user_id on
   farmer_profiles (
      user_id
   );

create index if not exists idx_buyer_profiles_user_id on
   buyer_profiles (
      user_id
   );

create index if not exists idx_price_references_product_id on
   price_references (
      product_id
   );

create index if not exists idx_listings_farmer_id on
   listings (
      farmer_id
   );

create index if not exists idx_listings_product_id on
   listings (
      product_id
   );

create index if not exists idx_listings_status on
   listings (
      status
   );

create index if not exists idx_contact_logs_listing_id on
   contact_logs (
      listing_id
   );

create index if not exists idx_contact_logs_buyer_id on
   contact_logs (
      buyer_id
   );