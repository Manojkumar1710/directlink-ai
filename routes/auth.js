const express = require("express");
const { randomUUID } = require("crypto");
const pool = require("../db");

const router = express.Router();

const {
  generateOtp,
  saveOtp,
  verifyOtp,
} = require("../services/otpService");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../services/tokenService");

const { findOrCreateUser } = require("../services/userService");
const { refreshTokens } = require("../data/authStore");

// =====================================================
// REGISTER USER
// =====================================================

router.post("/register", async (req, res, next) => {
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

    if (!phone_number || !name || !role) {
      return res.status(400).json({
        error: "ValidationError",
        message: "phone_number, name and role are required",
      });
    }

    if (!/^\d{10}$/.test(phone_number)) {
      return res.status(400).json({
        error: "ValidationError",
        message: "phone_number must contain exactly 10 digits",
      });
    }

    if (!["farmer", "buyer"].includes(role)) {
      return res.status(400).json({
        error: "ValidationError",
        message: "role must be farmer or buyer",
      });
    }

    await client.query("BEGIN");

    const userId = randomUUID();

    const userResult = await client.query(
      `
      INSERT INTO users (id, phone_number, name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, phone_number, name, role, created_at
      `,
      [userId, phone_number, name, role]
    );

    if (role === "farmer") {
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

    if (role === "buyer") {
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

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Registration successful",
      user: userResult.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");

    if (err.code === "23505") {
      return res.status(409).json({
        error: "DuplicatePhone",
        message: "This phone number is already registered",
      });
    }

    next(err);
  } finally {
    client.release();
  }
});

// =====================================================
// REQUEST OTP
// =====================================================

router.post("/request-otp", (req, res) => {
  const { phone, role } = req.body;

  if (!phone || !/^\d{10}$/.test(phone)) {
    return res.status(400).json({
      error: "Invalid phone number",
    });
  }

  if (!["farmer", "buyer"].includes(role)) {
    return res.status(400).json({
      error: "Role must be farmer or buyer",
    });
  }

  const otp = generateOtp();

  saveOtp(phone, otp, role);

  // Development only.
  // Replace this with an SMS provider in production.
  console.log(`OTP for ${phone}: ${otp}`);

  return res.status(200).json({
    message: "OTP generated successfully",
  });
});

// =====================================================
// VERIFY OTP
// =====================================================

router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (
      !phone ||
      !/^\d{10}$/.test(phone) ||
      !otp ||
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).json({
        error: "Invalid phone number or OTP",
      });
    }

    const result = verifyOtp(phone, otp);

    if (!result.success) {
      return res.status(401).json({
        error: "OTP verification failed",
        message: result.message,
      });
    }

    // Find existing user or create a new user in PostgreSQL
    const user = await findOrCreateUser(phone, result.role);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    refreshTokens.set(refreshToken, user);

    return res.status(200).json({
      message: "OTP verified successfully",
      user: {
        id: user.id,
        phone_number: user.phone_number,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("OTP verification error:", err);

    return res.status(500).json({
      error: "InternalServerError",
      message: "Something went wrong during OTP verification",
    });
  }
});

module.exports = router;