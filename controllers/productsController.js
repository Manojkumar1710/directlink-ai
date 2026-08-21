const repo = require('../data/repository');

async function listProducts(req, res, next) {
  try {
    const products = await repo.getAllProducts();
    res.json({ products });
  } catch (err) {
    next(err);
  }
}

module.exports = { listProducts };
