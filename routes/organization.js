const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/authenticateToken");
const Organization = require("../models/Organization");

// Create an organization
router.post("/", requireRole(["owner"]), async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await Organization.createOrganization(name, description);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all organizations
router.get("/", async (req, res) => {
  try {
    const result = await Organization.getAllOrganizations();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get an organization by id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Organization.getOrganizationById(id);
    if (!result) {
      return res.status(404).json({ message: "Organization not found" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update an organization by id
router.put("/:id", requireRole(["owner"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await Organization.updateOrganizationById(id, name, description);
    if (!result) {
      return res.status(404).json({ message: "Organization not found" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete an organization by id
router.delete("/:id", requireRole(["owner"]), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Organization.deleteOrganizationById(id);
    if (!result) {
      return res.status(404).json({ message: "Organization not found" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
