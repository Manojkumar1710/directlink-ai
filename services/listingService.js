const repo = require("../data/repository");

class NotFoundError extends Error {}
class ForbiddenError extends Error {}

async function createListing(user, data) {
  const product = await repo.getProductById(data.product_id);
  if (!product) {
    const err = new Error(`Unknown product_id: ${data.product_id}`);
    err.status = 400;
    throw err;
  }

  return repo.createListing({
    farmer_id: user.id,
    product_id: data.product_id,
    region: data.region,
    quantity: data.quantity,
    unit: data.unit,
    asking_price: data.asking_price,
  });
}

async function searchListings(query, user = null) {
  const effectiveQuery = { ...query };

  if (effectiveQuery.farmer_id === "me") {
    if (!user || !user.id) {
      const err = new Error("Authentication required to view your listings");
      err.status = 401;
      throw err;
    }
    effectiveQuery.farmer_id = user.id;
  }

  const listings = await repo.searchListings(effectiveQuery);
  // Attach product info so the buyer app doesn't need a second round trip
  const withProduct = await Promise.all(
    listings.map(async (l) => ({
      ...l,
      product: await repo.getProductById(l.product_id),
    })),
  );
  return withProduct;
}

async function getListingDetail(listingId) {
  const listing = await repo.getListingById(listingId);
  if (!listing) throw new NotFoundError("Listing not found");
  const product = await repo.getProductById(listing.product_id);
  return { ...listing, product };
}

async function updateListingStatus(user, listingId, status) {
  const listing = await repo.getListingById(listingId);
  if (!listing) throw new NotFoundError("Listing not found");
  if (listing.farmer_id !== user.id) {
    throw new ForbiddenError("Only the owning farmer can update this listing");
  }
  return repo.updateListingStatus(listingId, status);
}

async function logContact(user, listingId, channel) {
  const listing = await repo.getListingById(listingId);
  if (!listing) throw new NotFoundError("Listing not found");
  return repo.logContact({ listing_id: listingId, buyer_id: user.id, channel });
}

module.exports = {
  createListing,
  searchListings,
  getListingDetail,
  updateListingStatus,
  logContact,
  NotFoundError,
  ForbiddenError,
};
