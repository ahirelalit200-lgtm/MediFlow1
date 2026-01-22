// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

// Middleware to protect routes
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey123");

    const resolvedUserId = decoded.id || decoded.userId;

    if (!resolvedUserId && !(typeof token === "string" && token.includes("@"))) {
      return res.status(401).json({ error: "Token is not valid" });
    }

    // Attach user info to request (support both formats)
    req.user = {
      id: resolvedUserId,
      email: decoded.email,
    };
    req.userId = resolvedUserId; // For compatibility with existing code

    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    
    // If JWT is malformed, try to handle email-based auth as fallback
    if (error.name === 'JsonWebTokenError' && error.message === 'jwt malformed') {
      // Check if the token is actually an email (fallback for older auth)
      if (token.includes('@')) {
        req.user = { email: token };
        req.userId = token;
        return next();
      }
    }
    
    res.status(401).json({ error: "Token is not valid" });
  }
};

module.exports = authMiddleware;
