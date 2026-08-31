const listingService = require("../services/listingService");

async function create(req, res, next) {
  try {
    const listing = await listingService.createListing(
      req.user,
      req.validatedBody,
    );
    res.status(201).json({ listing });
  } catch (err) {
    next(err);
  }
}

async function search(req, res, next) {
  try {
    const { product, region, price_max, farmer_id } = req.query;
    const listings = await listingService.searchListings(
      { product, region, price_max, farmer_id },
      req.user,
    );
    res.json({ listings });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const listing = await listingService.getListingDetail(req.params.id);
    res.json({ listing });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const listing = await listingService.updateListingStatus(
      req.user,
      req.params.id,
      req.validatedBody.status,
    );
    res.json({ listing });
  } catch (err) {
    next(err);
  }
}

async function contact(req, res, next) {
  try {
    const entry = await listingService.logContact(
      req.user,
      req.params.id,
      req.validatedBody.channel,
    );
    res.status(201).json({ contact: entry });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, search, getById, updateStatus, contact };
