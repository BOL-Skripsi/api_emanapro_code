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
  approveTaskById,
  startTask,
  replyTask,
  managerReplyTask,
  getAllTeamTasksByMyJuridiction,
  getTeamTaskByUserId,
  getTeamTaskBySimiliarity,
  getTeamTaskReply
} = require("../models/Task");
const Pusher = require('pusher');

const pusher = new Pusher({
  appId: process.env.APP_ID,
  key: process.env.APP_KEY,
  secret: process.env.APP_SECRET,
  cluster: process.env.APP_CLUSTER,
  useTLS: true
});
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

// Route for creating personal task
router.post('/team', upload.single('file'), async (req, res) => {
  try {
    const task = req.body;
    const file = req.file; // Access uploaded file data from req.file property
    const assign_to = JSON.parse(task.assign_to);
    //Create task and attach file data for each assignee
    const createdTasks = [];
    for (const assignee of assign_to) {
      const createdTask = await createTeamTask(task,assignee.value,file);
      createdTasks.push(createdTask);
    } 
    if (!createdTasks.length) {
      return res.status(500).json({ message: 'Failed to create tasks' });
    }
    res.status(201).json(createdTasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route for reply task
router.post('/:userId/:taskId/reply', upload.single('file'), async (req, res) => {
  try {
    const {userId, taskId} = req.params
    const reply_comment = req.body.description;
    const file = req.file; // Access uploaded file data from req.file property

    // Create task and attach file data
    const replyingTask = await replyTask(taskId, reply_comment, file);
    if (!replyingTask) {
      return res.status(500).json({ message: 'Failed to reply task' });
    }
    res.status(201).json(replyingTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route for reply task
router.put('/:taskId/manager_reply', upload.single('file'), async (req, res) => {
  try {
    const {taskId} = req.params
    const reply_comment = req.body.description;
    const reply_status = req.body.status;
    // Create task and attach file data
    const replyingTask = await managerReplyTask(taskId, reply_comment, reply_status);
    if (!replyingTask) {
      return res.status(500).json({ message: 'Failed to reply task' });
    }
    res.status(201).json(replyingTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route for reply task
router.post('/team/manager_reply', upload.single('file'), async (req, res) => {
  try {
    const {} = req.body;

    // Create manager reply
    const replyingTask = await replyTask(taskId, reply_comment, file);
    if (!replyingTask) {
      return res.status(500).json({ message: 'Failed to reply task' });
    }
    res.status(201).json(replyingTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route for reply task
router.put('/:taskId/manager_reply', upload.single('file'), async (req, res) => {
  try {
    const {taskId} = req.params
    const reply_comment = req.body.description;
    const reply_status = req.body.status;
    // Create task and attach file data
    const replyingTask = await managerReplyTask(taskId, reply_comment, reply_status);
    if (!replyingTask) {
      return res.status(500).json({ message: 'Failed to reply task' });
    }
    res.status(201).json(replyingTask);
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
router.get("/:userId/team", async (req, res) => {
  try {
    const { userId } = req.params;
    const tasks = await getTeamTaskByUserId(userId);
    if (!tasks) {
      return res.status(404).json({ message: "No tasks found" });
    }
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all tasks by similiarity
router.post("/:userId/team/detail", async (req, res) => {
  try {
    const { userId } = req.params;
    const {task_name, task_description, task_category, task_duedate} = req.body;
    console.log(req.body);
    const tasks = await getTeamTaskBySimiliarity(task_name, task_description, task_category, task_duedate);
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

// Get All Reply For Team
router.post("/team/reply/", async (req, res) => {
  try {
    const {task_name, description, due_datetime} = req.body
    const task = await getTeamTaskReply(task_name, description, due_datetime);
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

// Get all personal task by manager id
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

// Get all team task by manager id
router.get("/:managerId/team/manager", async (req, res) => {
  try {
    const { managerId } = req.params;
    const task = await getAllTeamTasksByMyJuridiction(managerId);
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

// Start a task
router.put("/:userId/:taskId/start", async (req, res) => {
  try {
    const { userId, taskId } = req.params;
    const start_time = req.body.start_time;
    console.log(start_time)
    const updatedTask = await startTask(userId, taskId, start_time);
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