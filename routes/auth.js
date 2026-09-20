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
  verifyRefreshToken,
} = require("../services/tokenService");

const { findOrCreateUser } = require("../services/userService");

const { refreshTokens } = require("../data/authStore");

const {
  sendSMSOTP,
  sendWhatsAppOTP,
} = require("../services/twilioService");

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
// REQUEST OTP THROUGH TWILIO
// =====================================================

router.post("/request-otp", async (req, res) => {
  try {
    const {
      phone,
      role,
      otpMethod = "whatsapp",
    } = req.body;

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        error: "InvalidPhoneNumber",
        message: "Phone number must contain exactly 10 digits",
      });
    }

    if (!["farmer", "buyer"].includes(role)) {
      return res.status(400).json({
        error: "InvalidRole",
        message: "Role must be farmer or buyer",
      });
    }

    if (!["sms", "whatsapp"].includes(otpMethod)) {
      return res.status(400).json({
        error: "InvalidOtpMethod",
        message: "otpMethod must be sms or whatsapp",
      });
    }

    const otp = generateOtp();

    // Save OTP in the existing OTP store
    saveOtp(phone, otp, role);

    // Send OTP through Twilio
    if (otpMethod === "sms") {
      await sendSMSOTP(phone, otp);
    } else {
      await sendWhatsAppOTP(phone, otp);
    }

    console.log(`${otpMethod.toUpperCase()} OTP sent to ${phone}`);

    return res.status(200).json({
      message: `OTP sent successfully through ${otpMethod}`,
    });
  } catch (err) {
    console.error("OTP sending error:", err);

    return res.status(500).json({
      error: "OtpSendingFailed",
      message: "Unable to send OTP",
    });
  }
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
        error: "InvalidInput",
        message: "Invalid phone number or OTP",
      });
    }

    const result = verifyOtp(phone, otp);

    if (!result.success) {
      return res.status(401).json({
        error: "OtpVerificationFailed",
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

// =====================================================
// REFRESH ACCESS TOKEN
// =====================================================

router.post("/refresh", (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: "ValidationError",
        message: "refreshToken is required",
      });
    }

    const decoded = verifyRefreshToken(refreshToken);

    const user = refreshTokens.get(refreshToken);

    if (!user || user.id !== decoded.id) {
      return res.status(401).json({
        error: "InvalidRefreshToken",
        message: "Refresh token is invalid or revoked",
      });
    }

    const accessToken = generateAccessToken(user);

    return res.status(200).json({
      message: "Access token refreshed successfully",
      accessToken,
    });
  } catch (err) {
    return res.status(401).json({
      error: "InvalidRefreshToken",
      message: "Refresh token is expired or invalid",
    });
  }
});

module.exports = router;