const express = require('express');
const router = express.Router();

const listingsController = require('../controllers/listingsController');
const validate = require('../middleware/validate');
const { createListingSchema, updateListingStatusSchema, contactSchema } = require('../services/validators');

// POST /listings - Farmer creates a new listing
router.post('/', validate(createListingSchema), listingsController.create);

// GET /listings?product=&region=&price_max= - Buyer searches/filters listings
router.get('/', listingsController.search);

// GET /listings/:id - View listing detail
router.get('/:id', listingsController.getById);

// PATCH /listings/:id - Farmer updates status (sold/closed)
router.patch('/:id', validate(updateListingStatusSchema), listingsController.updateStatus);

// POST /listings/:id/contact - Log a buyer's contact action
router.post('/:id/contact', validate(contactSchema), listingsController.contact);

module.exports = router;
