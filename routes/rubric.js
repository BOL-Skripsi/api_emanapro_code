const express = require("express");
const router = express.Router();
const KpiAssessmentRubric = require("../models/Rubric");
const Pusher = require('pusher');

const pusher = new Pusher({
  appId: process.env.APP_ID,
  key: process.env.APP_KEY,
  secret: process.env.APP_SECRET,
  cluster: process.env.APP_CLUSTER,
  useTLS: true
});

// Get all KPI assessment rubric
router.get("/", async (req, res) => {
  try {
    const result = await KpiAssessmentRubric.getKpiAssessmentRubric();
    if (!result) {
      return res
        .status(404)
        .json({ message: "KPI assessment rubric not found" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a KPI assessment rubric
router.post("/", async (req, res) => {
  try {
    const { category, metric, description, criteria ,weight, score_system, data_source, team_id } =
      req.body;
      console.log(weight)
    const result = await KpiAssessmentRubric.createKpiAssessmentRubric(
      category,
      metric,
      description,
      criteria,
      weight,
      score_system,
      data_source,
      team_id
    );
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a KPI assessment rubric by id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await KpiAssessmentRubric.getKpiAssessmentRubricById(id);
    if (!result) {
      return res
        .status(404)
        .json({ message: "KPI assessment rubric not found" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a KPI assessment rubric by team and organization
router.get("/:orgId/:teamId/list", async (req, res) => {
  try {
    const { orgId } = req.params;
    const { teamId } = req.params;
    const result = await KpiAssessmentRubric.getKpiAssessmentRubricByTeamInOrg(teamId);
    if (!result) {
      return res
        .status(404)
        .json({ message: "KPI assessment rubric not found" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a KPI assessment rubric by id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, weight, target, minimum, maximum, metric } =
      req.body;
    const result = await KpiAssessmentRubric.updateKpiAssessmentRubricById(
      id,
      name,
      description,
      weight,
      target,
      minimum,
      maximum,
      metric
    );
    if (!result) {
      return res
        .status(404)
        .json({ message: "KPI assessment rubric not found" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/review", async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, status_approval } = req.body;
    const result = await KpiAssessmentRubric.reviewKpiAssessmentRubric(
      id,
      comment,
      status_approval
    );
    if (!result) {
      return res
        .status(404)
        .json({ message: "KPI assessment rubric not found" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a KPI assessment rubric by id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await KpiAssessmentRubric.deleteKpiAssessmentRubricById(id);
    if (!result) {
      return res
        .status(404)
        .json({ message: "KPI assessment rubric not found" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a KPI assessment rubric review
router.post(
  "/:rubric_id/reviews",
  async (req, res) => {
    try {
      const { rubric_id } = req.params;
      const { reviewer_id, score, comment } = req.body;
      const result = await KpiAssessmentRubric.createKpiAssessmentRubricReview(
        rubric_id,
        reviewer_id,
        score,
        comment
      );
      res.status(201).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get a KPI assessment rubric review by id
router.get("/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result =
      await KpiAssessmentRubricReview.getKpiAssessmentRubricReviewById(id);
    if (!result) {
      return res
        .status(404)
        .json({ message: "KPI assessment rubric review not found" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a KPI assessment rubric review by id
router.put(
  "/reviews/:id",
  async (req, res) => {
    try {
      const { id } = req.params;
      const { score, comment } = req.body;
      const result =
        await KpiAssessmentRubricReview.updateKpiAssessmentRubricReviewById(
          id,
          score,
          comment
        );
      if (!result) {
        return res
          .status(404)
          .json({ message: "KPI assessment rubric review not found" });
      }
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Delete a KPI assessment rubric review by id
router.delete(
  "/reviews/:id",
  async (req, res) => {
    try {
      const { id } = req.params;
      const result =
        await KpiAssessmentRubricReview.deleteKpiAssessmentRubricReviewById(id);
      if (!result) {
        return res
          .status(404)
          .json({ message: "KPI assessment rubric review not found" });
      }
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
