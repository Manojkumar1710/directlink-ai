/**
 * Repository layer.
 *
 * Every other file talks to data through THIS module, never through
 * mockData.js directly. When Member 5 hands off the real Postgres schema,
 * you rewrite the function bodies below to use Prisma/Sequelize instead of
 * arrays — nothing in services/ or controllers/ has to change.
 */

const { v4: uuidv4 } = require("uuid");
const { products, listings, contactLogs } = require("./mockData");

// ---------- Products ----------

async function getAllProducts() {
  return products;
}

async function getProductById(productId) {
  return products.find((p) => p.id === productId) || null;
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
  const listing = {
    id: uuidv4(),
    farmer_id,
    product_id,
    region,
    quantity,
    unit,
    asking_price,
    status: "active",
    created_at: new Date().toISOString(),
  };
  listings.push(listing);
  return listing;
}

async function getListingById(listingId) {
  return listings.find((l) => l.id === listingId) || null;
}

/**
 * Search/filter listings. Mirrors GET /listings?product=&region=&price_max=
 * from TDD Section 6.
 */
async function searchListings({ product, region, price_max, farmer_id }) {
  return listings.filter((l) => {
    if (l.status !== "active") return false;
    if (product && l.product_id !== product) return false;
    if (region && l.region.toLowerCase() !== String(region).toLowerCase())
      return false;
    if (price_max && l.asking_price > Number(price_max)) return false;
    if (farmer_id && String(l.farmer_id) !== String(farmer_id)) return false;
    return true;
  });
}

async function updateListingStatus(listingId, status) {
  const listing = listings.find((l) => l.id === listingId);
  if (!listing) return null;
  listing.status = status;
  return listing;
}

// ---------- Contact logs (optional analytics, TDD 4.4 / BRD Section 11) ----------

async function logContact({ listing_id, buyer_id, channel }) {
  const entry = {
    id: uuidv4(),
    listing_id,
    buyer_id,
    channel,
    contacted_at: new Date().toISOString(),
  };
  contactLogs.push(entry);
  return entry;
}

module.exports = {
  getAllProducts,
  getProductById,
  createListing,
  getListingById,
  searchListings,
  updateListingStatus,
  logContact,
};
