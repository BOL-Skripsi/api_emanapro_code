const express = require("express");
const router = express.Router();
const Kpi = require("../models/Kpi");
const nodemailer = require("nodemailer");

// Create KPI assessment due date
router.post("/period", async (req, res) => {
  try {
    const { kpi_period, kpi_duedate, kpi_startdate } = req.body;
    const result = await Kpi.createKpiAssessmentPeriod(kpi_period, kpi_duedate, kpi_startdate);
    if (!result) {
      return res
        .status(404)
        .json({ message: "KPI assessment period creation failed" });
    }
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// Create KPI assessment due date
router.post("/period/update", async (req, res) => {
  try {
    const kpi_period = req.body.kpi_period;
    // const result = await Kpi.createKpiAssessmentWithCheck(kpi_period);
    // if (!result) {
    //   return res
    //     .status(404)
    //     .json({ message: "KPI assessment period update failed" });
    // }
    // res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// Get all KPI assessment rubric
router.get("/", async (req, res) => {
  try {
    const result = await Kpi.getKpiAssessmentData();
    if (!result) {
      return res.status(404).json({ message: "KPI assessment data tidak ada" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all KPI assessment for hrd
router.get("/kpi_team_member/:teamId", async (req, res) => {
  try {
    const { teamId } = req.params;
    const result = await Kpi.getKpiAssessmentDataByMember(teamId);
    if (!result) {
      return res
        .status(404)
        .json({ message: "KPI assessment member data tidak ada" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all open KPI Assessment for manager
router.get("/open/", async (req, res) => {
  try {
    const result = await Kpi.getKpiAssessmentOpebByMember();
    if (!result) {
      return res
        .status(404)
        .json({ message: "KPI assessment member data tidak ada" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all open KPI Assessment for manager on certain user and duedate
router.get("/open/:userId/:duedateId/list", async (req, res) => {
  try {
    const userId = req.params.userId;
    const duedateId = req.params.duedateId;
    const result = await Kpi.getKpiAssessmentOpebByMemberDetail(userId, duedateId);
    if (!result) {
      return res
        .status(404)
        .json({ message: "KPI assessment member data tidak ada" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// Get all open KPI Assessment for manager on certain user and duedate
router.get("/open/:userId/:duedateId/:category/list", async (req, res) => {
  try {
    const userId = req.params.userId;
    const duedateId = req.params.duedateId;
    const category = req.params.category;
    const result = await Kpi.getKpiAssessmentForm(userId, duedateId, category);
    if (!result) {
      return res
        .status(404)
        .json({ message: "KPI assessment member data tidak ada" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all open KPI Assessment for manager on certain user and duedate
router.get("/open/:userId/:duedateId/:category/form", async (req, res) => {
  try {
    const userId = req.params.userId;
    const duedateId = req.params.duedateId;
    const category = req.params.category;
    const result = await Kpi.getKpiAssessmentForm(userId, duedateId, category);
    if (!result) {
      return res
        .status(404)
        .json({ message: "KPI assessment member data tidak ada" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all open KPI Assessment for manager on certain user and duedate
router.post("/open/:userId/:duedateId/fill", async (req, res) => {
  try {
    const userId = req.params.userId;
    const duedateId = req.params.duedateId;
    const result = await Kpi.updateKpiAssessmentOpenByMemberDetail(userId, duedateId);
    if (!result) {
      return res
        .status(404)
        .json({ message: "KPI assessment member data tidak ada" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;