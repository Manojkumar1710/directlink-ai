const jwt = require("jsonwebtoken");

function optionalAuth(req, res, next) {
  const authHeader = req.header("Authorization");

  // No token → continue as a public request
  if (!authHeader) {
    return next();
  }

  try {
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid Authorization header format",
      });
    }

    const decoded = jwt.verify(parts[1], process.env.JWT_SECRET);

    if (!decoded.id || !["farmer", "buyer"].includes(decoded.role)) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token claims",
      });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired token",
    });
  }
}

module.exports = optionalAuth;