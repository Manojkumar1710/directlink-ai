const jwt = require("jsonwebtoken");

function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
};