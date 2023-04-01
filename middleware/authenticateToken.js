const jwt = require("jsonwebtoken");
const userModel = require("../models/User");

// const requireRole = (roles) => {
//   return async (req, res, next) => {
//     const organizationId = req.params.id;
//     const user = await userModel.getUserOrganizationRoleById(req.user.userId, organizationId);
//     const userRole = user.organization_role;
//     console.log(userRole)
//     if (roles.includes(userRole)) {
//       next();
//     } else {
//       res.status(403).json({ message: "Access denied" });
//     }
//   };
// };


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

    const userFromDb = await userModel.getUserByEmail(user.userEmail);

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

module.exports = { authenticateToken };
