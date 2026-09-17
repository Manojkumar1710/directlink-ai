const express = require('express');
const cors = require('cors');

const authRouter = require('./routes/auth');
const listingsRouter = require('./routes/listings');
const productsRouter = require('./routes/products');

const { NotFoundError, ForbiddenError } = require('./services/listingService');

const app = express();

app.use(cors());
app.use(express.json());

// Authentication routes
app.use('/auth', authRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/products', productsRouter);
app.use('/listings', listingsRouter);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: `No route for ${req.method} ${req.originalUrl}`,
  });
});

// Central error handler
app.use((err, req, res, next) => {
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      error: 'NotFound',
      message: err.message,
    });
  }

  if (err instanceof ForbiddenError) {
    return res.status(403).json({
      error: 'Forbidden',
      message: err.message,
    });
  }

  const status = err.status || 500;

  console.error(err);

  res.status(status).json({
    error: 'ServerError',
    message: err.message || 'Something went wrong',
  });
});

module.exports = app;