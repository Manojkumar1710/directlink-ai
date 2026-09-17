const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token is required',
      });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid Authorization header format',
      });
    }

    const token = parts[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
if (
  !decoded.id ||
  !["farmer", "buyer"].includes(decoded.role)
) {
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
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}

module.exports = auth;