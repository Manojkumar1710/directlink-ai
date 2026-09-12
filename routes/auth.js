const express = require('express');
const { randomUUID } = require('crypto');
const pool = require('../db');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  const client = await pool.connect();

  try {
    const {
      phone_number,
      name,
      role,
      village,
      district,
      state,
      business_name,
      business_type,
      address,
    } = req.body;

    // Basic validation
    if (!phone_number || !name || !role) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'phone_number, name and role are required',
      });
    }

    if (!['farmer', 'buyer'].includes(role)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'role must be farmer or buyer',
      });
    }

    await client.query('BEGIN');

    // Generate UUID automatically
    const userId = randomUUID();

    // Create user
    const userResult = await client.query(
      `
      INSERT INTO users (id, phone_number, name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, phone_number, name, role, created_at
      `,
      [userId, phone_number, name, role]
    );

    // Create profile according to role
    if (role === 'farmer') {
      await client.query(
        `
        INSERT INTO farmer_profiles
        (id, user_id, village, district, state)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          randomUUID(),
          userId,
          village || null,
          district || null,
          state || null,
        ]
      );
    }

    if (role === 'buyer') {
      await client.query(
        `
        INSERT INTO buyer_profiles
        (id, user_id, business_name, business_type, address)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          randomUUID(),
          userId,
          business_name || null,
          business_type || null,
          address || null,
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Registration successful',
      user: userResult.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');

    // Duplicate phone number
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'DuplicatePhone',
        message: 'This phone number is already registered',
      });
    }

    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;