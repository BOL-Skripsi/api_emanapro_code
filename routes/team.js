const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/authenticateToken");
const teamModel = require("../models/Team");
const organizationModel = require("../models/Organization");

// Create a new team
router.post("/:orgId", async (req, res) => {
  try {
    const { name } = req.body;
    const { description } = req.body;
    const { manager } = req.body;
    const orgId = req.params.orgId;

    const organization = await organizationModel.getOrganizationById(orgId);

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }
    const team = await teamModel.createTeam(name, manager, orgId, description);
    res.status(201).json({ team });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get all teams of an organization
router.get("/:orgId/list", async (req, res) => {
  try {
    const orgId = req.params.orgId;

    const organization = await organizationModel.getOrganizationById(orgId);

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const teams = await teamModel.getAllTeamsByOrgId(orgId);

    res.status(200).json({ teams });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get a team by ID
router.get("/:orgId/teams/:teamId", async (req, res) => {
  try {
    const { orgId, teamId } = req.params;

    const organization = await organizationModel.getOrganizationById(orgId);

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const team = await teamModel.getTeamById(teamId);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.org_id !== orgId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json({ team });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update a team by ID
router.patch("/:orgId/teams/:teamId", async (req, res) => {
  try {
    const { orgId, teamId } = req.params;
    const { name } = req.body;

    const organization = await organizationModel.getOrganizationById(orgId);

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const team = await teamModel.getTeamById(teamId);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.org_id !== orgId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updatedTeam = await teamModel.updateTeamById(teamId, name);

    res.status(200).json({ team: updatedTeam });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete a team by ID
router.delete("/:orgId/teams/:teamId", async (req, res) => {
  try {
    const { orgId, teamId } = req.params;

    const organization = await organizationModel.getOrganizationById(orgId);

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const team = await teamModel.getTeamById(teamId);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.org_id !== orgId) {
      return res.status(403).json({ message: "Access denied" });
    }

    await teamModel.deleteTeamById(teamId);

    res.status(204).json();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
