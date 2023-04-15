const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/authenticateToken");
const Organization = require("../models/Organization");
const Dashboard = require("../models/Dashboard");
const userModel = require("../models/User");
const nodemailer = require("nodemailer");

router.get("/hrd/kpi/", async (req, res) => {
  try {
    const result = await Dashboard.getHrdAllTeamScore();
    if (!result) {
      return res.status(404).json({ message: "KPI assessment data tidak ada" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/hrd/rubric", async (req, res) => {
  try {
    const result = await Dashboard.getHrdRubricToReview();
    if (!result) {
      return res.status(404).json({ message: "KPI assessment data tidak ada" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/employee/kpi/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await Dashboard.getEmployeePerformance(userId);
    if (!result) {
      return res.status(404).json({ message: "KPI assessment data tidak ada" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/employee/ongoing/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await Dashboard.getEmployeeOngoing(userId);
    if (!result) {
      return res.status(404).json({ message: "KPI assessment data tidak ada" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/employee/task/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await Dashboard.getEmployeeTask(userId);
    if (!result) {
      return res.status(404).json({ message: "KPI assessment data tidak ada" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/manager/kpi/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await Dashboard.getManagerTeamScore(userId);
    if (!result) {
      return res.status(404).json({ message: "KPI assessment data tidak ada" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/manager/task/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await Dashboard.getManagerTaskApprove(userId);
    if (!result) {
      return res.status(404).json({ message: "task data tidak ada" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/manager/assessment/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await Dashboard.getManagerAssessmentProgress(userId);
    if (!result) {
      return res.status(404).json({ message: "KPI assessment data tidak ada" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/notif/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await Dashboard.getNotification(userId);
    if (!result) {
      return res.status(404).json({ message: "No Notification" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
