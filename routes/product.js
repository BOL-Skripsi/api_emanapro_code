const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authenticateToken");

// Dummy product data
const products = [
  { id: 1, name: "Product 1" },
  { id: 2, name: "Product 2" },
  { id: 3, name: "Product 3" },
];

// Product route
router.get("/", authenticateToken, (req, res) => {
  // Return the list of products if authenticated
  res.json(products);
});

module.exports = router;
