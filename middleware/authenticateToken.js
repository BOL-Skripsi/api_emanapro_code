const jwt = require("jsonwebtoken");
const userModel = require("../models/User");

const requireRole = (role) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    if (userRole === role) {
      next();
    } else {
      res.status(403).json({ message: "Access denied" });
    }
  };
};

async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token not found" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
    if (err) {
      return res
        .status(403)
        .json({ message: "Access token invalid or expired" });
    }

    const userFromDb = await userModel.getUserByEmail(user.email);

    if (!userFromDb || userFromDb.refresh_token !== user.refresh_token) {
      return res
        .status(403)
        .json({ message: "Refresh token invalid or expired" });
    }

    // check if token is blacklisted
    const result = await userModel.checkRevokedTokens(token);

    if (result.rows.length > 0) {
      return res.status(401).json({ message: "Access token has been revoked" });
    }

    req.user = user;
    next();
  });
}

module.exports = { authenticateToken, requireRole };
