const express = require("express");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();
const { requireRole } = require("../middleware/authenticateToken");
const {
  createTask,
  createPersonalTask,
  createTeamTask,
  getAllTasks,
  getTaskById,
  updateTaskById,
  deleteTaskById,
  getTaskByUserId,
  getTaskFileById,
  getAllTasksByTeamId,
  getAllPersonalTasksByMyJuridiction,
  getTaskReply,
  getTaskReplyFile,
  approveTaskById
} = require("../models/Task");

// Create a task
router.post("/", async (req, res) => {
  try {
    const task = req.body;
    const createdTask = await createTask(task);
    if (!createdTask) {
      return res.status(500).json({ message: "Failed to create task" });
    }
    res.status(201).json(createdTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Define storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Initialize multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 } // Limit file size to 1MB
});

// Route for creating personal task
router.post('/personal', upload.single('file'), async (req, res) => {
  try {
    const task = req.body;
    const file = req.file; // Access uploaded file data from req.file property

    // Create task and attach file data
    const createdTask = await createPersonalTask(task, file);
    if (!createdTask) {
      return res.status(500).json({ message: 'Failed to create task' });
    }
    res.status(201).json(createdTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../uploads', filename);

  res.sendFile(filePath);
});


// Get all tasks
router.get("/", async (req, res) => {
  try {
    const tasks = await getAllTasks();
    if (!tasks) {
      return res.status(404).json({ message: "No tasks found" });
    }
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all tasks by team id
router.get("/:teamId/team", async (req, res) => {
  try {
    const { teamId } = req.params;
    const tasks = await getAllTasksByTeamId(teamId);
    if (!tasks) {
      return res.status(404).json({ message: "No tasks found" });
    }
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a task by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const task = await getTaskById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a task reply by task ID
router.get("/reply/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const task = await getTaskReply(id);
    if (!task) {
      return res.status(404).json({ message: "Task reply not found" });
    }
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a task file by ID
router.get("/:id/file", async (req, res) => {
  try {
    const { id } = req.params;
    const task = await getTaskFileById(id);
    if (!task) {
      return res.status(404).json({ message: "File not found" });
    }
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all task by user id
router.get("/:userId/personal", async (req, res) => {
  try {
    const { userId } = req.params;
    const task = await getTaskByUserId(userId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all task by manager id
router.get("/:managerId/personal/manager", async (req, res) => {
  try {
    const { managerId } = req.params;
    const task = await getAllPersonalTasksByMyJuridiction(managerId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a task by ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const task = req.body;
    const updatedTask = await updateTaskById(id, task);
    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(updatedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Approv a task
router.put("/:id/approval", async (req, res) => {
  try {
    const { id } = req.params;
    const task = req.body;
    const updatedTask = await approveTaskById(id, task);
    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(updatedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a task by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTask = await deleteTaskById(id);
    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(deletedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

// // Create a daily task
// const upload = multer({ dest: "uploads/" });
// router.post("/", upload.single("file"), async (req, res) => {
//   try {
//     const { title, description, assignee_id, standard_hours } = req.body;
//     const file_path = req.file?.filename;
//     const result = await DailyTask.createDailyTask(
//       title,
//       description,
//       assignee_id,
//       standard_hours,
//       file_path
//     );
//     res.status(201).json(result);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Get a daily task by id
// router.get("/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const task = await DailyTask.getDailyTaskById(id);
//     if (!task) {
//       return res.status(404).json({ message: "Daily task not found" });
//     }
//     res.json(task);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Update a daily task by id
// router.put("/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const {
//       title,
//       description,
//       assignee_id,
//       start_time,
//       end_time,
//       pause_time,
//       file_path,
//       actual_hours,
//     } = req.body;
//     const result = await DailyTask.updateDailyTaskById(
//       id,
//       title,
//       description,
//       assignee_id,
//       start_time,
//       end_time,
//       pause_time,
//       file_path,
//       actual_hours
//     );
//     if (!result) {
//       return res.status(404).json({ message: "Daily task not found" });
//     }
//     res.json(result);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Delete a daily task by id
// router.delete("/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const result = await DailyTask.deleteDailyTaskById(id);
//     if (!result) {
//       return res.status(404).json({ message: "Daily task not found" });
//     }
//     res.json(result);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Upload a file as a reply to a daily task
// router.post("/:id/replies", upload.single("file"), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { reply_text, author_id } = req.body;
//     const file_path = req.file?.filename;
//     const result = await DailyTask.createDailyTaskReply(
//       id,
//       reply_text,
//       author_id,
//       file_path
//     );
//     res.status(201).json(result);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Download a file associated with a daily task reply
// router.get("/replies/:id/file", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const reply = await DailyTask.getDailyTaskReplyById(id);
//     if (!reply) {
//       return res.status(404).json({ message: "Daily task reply not found" });
//     }
//     if (!reply.file_path) {
//       return res
//         .status(400)
//         .json({ message: "File not found for this daily task reply" });
//     }
//     const file = path.join(__dirname, "..", "uploads", reply.file_path);
//     res.download(file);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Create a daily task reply
// router.post("/:task_id/replies", async (req, res) => {
//   try {
//     const { task_id } = req.params;
//     const { author_id, reply_text } = req.body;
//     const dailyTask = await DailyTask.getDailyTaskById(task_id);
//     if (!dailyTask) {
//       return res.status(404).json({ message: "Daily task not found" });
//     }
//     // File upload
//     const file = req.file;
//     let filePath = null;
//     if (file) {
//       const ext = path.extname(file.originalname);
//       const fileName = `${uuidv4()}${ext}`;
//       const uploadPath = path.join(__dirname, "..", "uploads", fileName);
//       await file.mv(uploadPath);
//       filePath = fileName;
//     }
//     const result = await DailyTask.createDailyTaskReply(
//       task_id,
//       reply_text,
//       author_id,
//       filePath
//     );
//     res.status(201).json(result);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Update a daily task reply by id
// router.put("/replies/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { reply_text } = req.body;
//     const reply = await DailyTask.getDailyTaskReplyById(id);
//     if (!reply) {
//       return res.status(404).json({ message: "Daily task reply not found" });
//     } // File upload
//     const file = req.file;
//     let filePath = reply.file_path;
//     if (file) {
//       const ext = path.extname(file.originalname);
//       const fileName = `${uuidv4()}${ext}`;
//       const uploadPath = path.join(__dirname, "..", "uploads", fileName);
//       await file.mv(uploadPath);
//       filePath = fileName;
//     }
//     const result = await DailyTask.updateDailyTaskReplyById(
//       id,
//       reply_text,
//       filePath
//     );
//     res.json(result);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Delete a daily task reply by id
// router.delete("/replies/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const reply = await DailyTask.getDailyTaskReplyById(id);
//     if (!reply) {
//       return res.status(404).json({ message: "Daily task reply not found" });
//     }
//     const result = await DailyTask.deleteDailyTaskReplyById(id);
//     res.json(result);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// module.exports = router;
