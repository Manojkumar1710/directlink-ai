const pool = require("../db");

// ---------- Products ----------

async function getAllProducts() {
  const result = await pool.query(`
    SELECT id, name, category, unit, icon_url
    FROM products
    ORDER BY name
  `);

  return result.rows;
}

async function getProductById(productId) {
  const result = await pool.query(
    `
    SELECT id, name, category, unit, icon_url
    FROM products
    WHERE id = $1
    `,
    [productId]
  );

  return result.rows[0] || null;
}

// ---------- Listings ----------

async function createListing({
  farmer_id,
  product_id,
  region,
  quantity,
  unit,
  asking_price,
}) {
  const result = await pool.query(
    `
    INSERT INTO listings (
      id,
      farmer_id,
      product_id,
      region,
      quantity,
      unit,
      asking_price,
      status,
      created_at
    )
    VALUES (
      gen_random_uuid(),
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      'active',
      NOW()
    )
    RETURNING *
    `,
    [
      farmer_id,
      product_id,
      region,
      quantity,
      unit,
      asking_price,
    ]
  );

  return result.rows[0];
}

async function getListingById(listingId) {
  const result = await pool.query(
    `
    SELECT
      l.*,
      p.id AS product_id,
      p.name AS product_name,
      p.category AS product_category,
      p.unit AS product_unit,
      p.icon_url AS product_icon_url
    FROM listings l
    JOIN products p ON l.product_id = p.id
    WHERE l.id = $1
    `,
    [listingId]
  );

  return result.rows[0] || null;
}

// ---------- Search Listings ----------

async function searchListings({ product, region, price_max, farmer_id }) {
  let query = `
    SELECT
      l.*,
      p.id AS product_id,
      p.name AS product_name,
      p.category AS product_category,
      p.unit AS product_unit,
      p.icon_url AS product_icon_url
    FROM listings l
    JOIN products p ON l.product_id = p.id
    WHERE 1 = 1
  `;

  const values = [];
  let index = 1;

  // Normal marketplace search = active listings only.
  // My Listings = all statuses.
  if (!farmer_id) {
    query += ` AND l.status = 'active'`;
  }

  if (product) {
    query += ` AND l.product_id = $${index}`;
    values.push(product);
    index++;
  }

  if (region) {
    query += ` AND LOWER(l.region) = LOWER($${index})`;
    values.push(region);
    index++;
  }

  if (price_max) {
    query += ` AND l.asking_price <= $${index}`;
    values.push(Number(price_max));
    index++;
  }

  if (farmer_id) {
    query += ` AND l.farmer_id = $${index}`;
    values.push(farmer_id);
    index++;
  }

  query += ` ORDER BY l.created_at DESC`;

  const result = await pool.query(query, values);

  return result.rows;
}

// ---------- Update Listing Status ----------

async function updateListingStatus(listingId, status) {
  const result = await pool.query(
    `
    UPDATE listings
    SET status = $1
    WHERE id = $2
    RETURNING *
    `,
    [status, listingId]
  );

  return result.rows[0] || null;
}

// ---------- Contact Logs ----------

async function logContact({ listing_id, buyer_id, channel }) {
  const result = await pool.query(
    `
    INSERT INTO contact_logs (
      id,
      listing_id,
      buyer_id,
      channel,
      contacted_at
    )
    VALUES (
      gen_random_uuid(),
      $1,
      $2,
      $3,
      NOW()
    )
    RETURNING *
    `,
    [listing_id, buyer_id, channel]
  );

  return result.rows[0];
}

// ---------- Profiles ----------

async function getFarmerProfileByUserId(userId) {
  const result = await pool.query(
    `
    SELECT id, user_id, village, district, state, geo_lat, geo_lng
    FROM farmer_profiles
    WHERE user_id = $1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function getBuyerProfileByUserId(userId) {
  const result = await pool.query(
    `
    SELECT id, user_id, business_name, business_type, address, geo_lat, geo_lng
    FROM buyer_profiles
    WHERE user_id = $1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

// ---------- Exports ----------

module.exports = {
  getAllProducts,
  getProductById,
  getFarmerProfileByUserId,
  getBuyerProfileByUserId,
  createListing,
  getListingById,
  searchListings,
  updateListingStatus,
  logContact,
};