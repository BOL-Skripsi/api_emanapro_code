const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/authenticateToken");
const Organization = require("../models/Organization");
const userModel = require("../models/User");
const nodemailer = require("nodemailer");

// Create an organization
router.post("/", async (req, res) => {
  try {
    const { name, description, owner_id } = req.body;
    const result = await Organization.createOrganization(
      name,
      description,
      owner_id
    );
    userModel.assignOrganizationRole(owner_id, result.uuid, "owner");
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all organizations for a specific owner
router.get("/:owner_id/list", async (req, res) => {
  const owner_id = req.params.owner_id;
  try {
    const result = await Organization.getAllOrganizations(owner_id);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get role for a specific user
router.get("/:userId/:orgId/roles", async (req, res) => {
  const userId = req.params.userId;
  const orgId = req.params.orgId;
  try {
    const result = await userModel.getUserOrganizationRoleById(userId, orgId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all organizations for a specific owner
router.get("/:user_id/myOrg", async (req, res) => {
  const user_id = req.params.user_id;
  try {
    const result = await Organization.getAllOrganizations(user_id);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Invite users by email and assign to role
router.post("/:id/invite/:role", async (req, res) => {
  try {
    const { id, role } = req.params;
    const { email } = req.body;
    const { name } = req.body;

    // Check if the organization exists
    const organization = await Organization.getOrganizationById(id);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    // // Invite users by email
    const invitePromises = userModel.inviteUserByEmail(email, name);
    const invitedUsers = await invitePromises;
    console.log(invitedUsers);
    // // Assign role to the invited users
    const userRolePromises = userModel.assignOrganizationRole(invitedUsers.user.uuid, id, role)
    await userRolePromises;
    // Send email invitations
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const emailPromises = [invitedUsers].map(({ user, password }) => {
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: user.email,
        subject: `Invitation to ${role} role`,
        text: `Hi ${name},\n\nYou have been invited to join the ${role} role for the ${organization.name} organization.\n\nYour temporary password is \n\npassword : ${password}. \n\nPlease login to your account to accept the invitation and change your password.\n\nThank you!`,
      };
      return transporter.sendMail(mailOptions);
    });
    await Promise.all(emailPromises);

    res.status(200).json({ message: "Emails sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all user in organization
router.get("/:id/employee", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await userModel.getAllUser();
    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }
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
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await Organization.updateOrganizationById(
      id,
      name,
      description
    );
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
router.delete("/:id", async (req, res) => {
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
