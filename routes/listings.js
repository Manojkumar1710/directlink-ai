const express = require('express');
const router = express.Router();

const listingsController = require('../controllers/listingsController');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

const {
  createListingSchema,
  updateListingStatusSchema,
  contactSchema,
} = require('../services/validators');

// POST /listings - Farmer creates a new listing
router.post(
  '/',
  auth,
  validate(createListingSchema),
  listingsController.create,
);

// GET /listings - Public search; JWT optional for "farmer_id=me"
router.get('/', optionalAuth, listingsController.search);

// GET /listings/:id - View listing detail
router.get('/:id', listingsController.getById);

// PATCH /listings/:id - Farmer updates status
router.patch(
  '/:id',
  auth,
  validate(updateListingStatusSchema),
  listingsController.updateStatus,
);

// POST /listings/:id/contact - Buyer logs contact action
router.post(
  '/:id/contact',
  auth,
  validate(contactSchema),
  listingsController.contact,
);

module.exports = router;