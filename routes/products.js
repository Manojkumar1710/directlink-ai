const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');

// GET /products - list all products for the crop-selector grid
router.get('/', productsController.listProducts);

module.exports = router;
