const express = require("express");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();
const { requireRole } = require("../middleware/authenticateToken");
const DailyTask = require("../models/Task");

// Create a daily task
const upload = multer({ dest: "uploads/" });
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { title, description, assignee_id, standard_hours } = req.body;
    const file_path = req.file?.filename;
    const result = await DailyTask.createDailyTask(
      title,
      description,
      assignee_id,
      standard_hours,
      file_path
    );
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a daily task by id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const task = await DailyTask.getDailyTaskById(id);
    if (!task) {
      return res.status(404).json({ message: "Daily task not found" });
    }
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a daily task by id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      assignee_id,
      start_time,
      end_time,
      pause_time,
      file_path,
      actual_hours,
    } = req.body;
    const result = await DailyTask.updateDailyTaskById(
      id,
      title,
      description,
      assignee_id,
      start_time,
      end_time,
      pause_time,
      file_path,
      actual_hours
    );
    if (!result) {
      return res.status(404).json({ message: "Daily task not found" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a daily task by id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await DailyTask.deleteDailyTaskById(id);
    if (!result) {
      return res.status(404).json({ message: "Daily task not found" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Upload a file as a reply to a daily task
router.post("/:id/replies", upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;
    const { reply_text, author_id } = req.body;
    const file_path = req.file?.filename;
    const result = await DailyTask.createDailyTaskReply(
      id,
      reply_text,
      author_id,
      file_path
    );
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Download a file associated with a daily task reply
router.get("/replies/:id/file", async (req, res) => {
  try {
    const { id } = req.params;
    const reply = await DailyTask.getDailyTaskReplyById(id);
    if (!reply) {
      return res.status(404).json({ message: "Daily task reply not found" });
    }
    if (!reply.file_path) {
      return res
        .status(400)
        .json({ message: "File not found for this daily task reply" });
    }
    const file = path.join(__dirname, "..", "uploads", reply.file_path);
    res.download(file);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a daily task reply
router.post("/:task_id/replies", async (req, res) => {
  try {
    const { task_id } = req.params;
    const { author_id, reply_text } = req.body;
    const dailyTask = await DailyTask.getDailyTaskById(task_id);
    if (!dailyTask) {
      return res.status(404).json({ message: "Daily task not found" });
    }
    // File upload
    const file = req.file;
    let filePath = null;
    if (file) {
      const ext = path.extname(file.originalname);
      const fileName = `${uuidv4()}${ext}`;
      const uploadPath = path.join(__dirname, "..", "uploads", fileName);
      await file.mv(uploadPath);
      filePath = fileName;
    }
    const result = await DailyTask.createDailyTaskReply(
      task_id,
      reply_text,
      author_id,
      filePath
    );
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a daily task reply by id
router.put("/replies/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { reply_text } = req.body;
    const reply = await DailyTask.getDailyTaskReplyById(id);
    if (!reply) {
      return res.status(404).json({ message: "Daily task reply not found" });
    } // File upload
    const file = req.file;
    let filePath = reply.file_path;
    if (file) {
      const ext = path.extname(file.originalname);
      const fileName = `${uuidv4()}${ext}`;
      const uploadPath = path.join(__dirname, "..", "uploads", fileName);
      await file.mv(uploadPath);
      filePath = fileName;
    }
    const result = await DailyTask.updateDailyTaskReplyById(
      id,
      reply_text,
      filePath
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a daily task reply by id
router.delete("/replies/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const reply = await DailyTask.getDailyTaskReplyById(id);
    if (!reply) {
      return res.status(404).json({ message: "Daily task reply not found" });
    }
    const result = await DailyTask.deleteDailyTaskReplyById(id);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
