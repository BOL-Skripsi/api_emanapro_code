const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// Create a task
const createTask = async (task, file) => {
  const {
    task_name,
    description,
    due_datetime,
    start_time,
    priority,
    assign_to,
    task_category,
    score,
    revision_comment,
    status,
    team_id,
  } = task;
  const query = `
    INSERT INTO tbl_task (task_name, description, due_datetime, start_time, priority, assign_to, task_category, score, revision_comment, status, team_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;
  const values = [
    task_name,
    description,
    due_datetime,
    start_time,
    priority,
    assign_to,
    task_category,
    score,
    revision_comment,
    status,
    team_id,
  ];
  try {
    const { rows } = await pool.query(query, values);
    const taskId = rows[0].id;
    if (file) {
      const { originalname, mimetype, size, path } = file;
      const query = `
        INSERT INTO tbl_task_file (task_id, file_name, file_type, file_size, file_path)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const values = [taskId, originalname, mimetype, size, path];
      const { rows } = await pool.query(query, values);
      rows[0].task = rows[0].task_id;
      delete rows[0].task_id;
      return { task: rows[0] };
    }
    return { task: rows[0] };
  } catch (err) {
    console.error(err);
    return null;
  }
};

const createPersonalTask = async (task, file) => {
  try {
    const { task_name, description, due_datetime, priority, assign_to, status } = task;
    const query = `
      INSERT INTO tbl_task (task_name, description, due_datetime, priority, assign_to, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [task_name, description, due_datetime, priority, assign_to, status];
    const { rows } = await pool.query(query, values);
    const taskId = rows[0].uuid;
    // console.log(taskId)
    if (file) {
      const fileQuery = `
        INSERT INTO tbl_task_file (task_id, file_name, file_type, file_size, file_path)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const fileType = file.mimetype;
      const fileSize = file.size;
      const filePath = file.path;
      const fileValues = [taskId, file.filename, fileType, fileSize, filePath];
      const fileResult = await pool.query(fileQuery, fileValues);
      fileResult.rows[0].task = fileResult.rows[0].task_id;
      delete fileResult.rows[0].task_id;
      return { task: rows[0], file: fileResult.rows[0] };
    }
    return { task: rows[0] };
  } catch (err) {
    console.error(err);
    return null;
  }
};


// Create a task
const createTeamTask = async (task, file) => {
  try {
    const {
      task_name,
      description,
      due_datetime,
      start_time,
      priority,
      assign_to,
      task_category,
      score,
      revision_comment,
      status,
      team_id,
    } = task;
    const query = `
    INSERT INTO tbl_task (task_name, description, due_datetime, start_time, priority, assign_to, task_category, score, revision_comment, status, team_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;
    const values = [
      task_name,
      description,
      due_datetime,
      start_time,
      priority,
      assign_to,
      task_category,
      score,
      revision_comment,
      status,
      team_id,
    ];
    const { rows } = await pool.query(query, values);
    const taskId = rows[0].id;
    if (file) {
      const { originalname, mimetype, size, path } = file;
      const query = `
        INSERT INTO tbl_task_file (task_id, file_name, file_type, file_size, file_path)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const values = [taskId, originalname, mimetype, size, path];
      const { rows } = await pool.query(query, values);
      rows[0].task = rows[0].task_id;
      delete rows[0].task_id;
      return { task: rows[0] };
    }
    return { task: rows[0] };
  } catch (err) {
    console.error(err);
    return null;
  }
};

// Get all tasks
const getAllTasks = async () => {
  const query = `
    SELECT * FROM tbl_task
  `;
  try {
    const { rows } = await pool.query(query);
    return rows;
  } catch (err) {
    console.error(err);
    return null;
  }
};

// Get all tasks
const getAllTasksByTeamId = async (teamId) => {
  const query = `
    SELECT * FROM tbl_task where team_id = $1
  `;
  const value = [teamId];
  try {
    const { rows } = await pool.query(query, value);
    return rows;
  } catch (err) {
    console.error(err);
    return null;
  }
};

// Get all tasks
const getAllPersonalTasksByMyJuridiction = async (managerId) => {
  const query = `SELECT tsk.*, CASE WHEN tf.task_id IS NOT NULL THEN 'Yes' ELSE 'No' END AS has_files, u.name AS user_name FROM public.tbl_team_member tm LEFT JOIN public.tbl_team t ON tm.team_id::uuid = t.uuid LEFT JOIN public.tbl_user u ON tm.user_id::uuid = u.uuid LEFT JOIN public.tbl_task tsk ON u.uuid = tsk.assign_to::uuid LEFT JOIN public.tbl_task_file tf ON tsk.uuid = tf.task_id::uuid WHERE t.manager_id = $1`;
  const value = [managerId];
  try {
    const { rows } = await pool.query(query, value);
    return rows;
  } catch (err) {
    console.error(err);
    return null;
  }
};

// Get a task by ID
const getTaskById = async (id) => {
  const query = `
    SELECT * FROM tbl_task WHERE uuid = $1
  `;
  const values = [id];
  try {
    const { rows } = await pool.query(query, values);
    return rows[0];
  } catch (err) {
    console.error(err);
    return null;
  }
};

// Get task reply by ID
const getTaskReply = async (id) => {
  const query = `
  SELECT tr.*,(SELECT file_name FROM public.tbl_task_reply_file trf WHERE trf.task_reply_uuid::uuid = tr.uuid) AS file_name FROM public.tbl_task_reply tr WHERE tr.task_id = $1 ORDER BY tr.id
  `;
  const values = [id];
  try {
    const { rows } = await pool.query(query, values);
    return rows;
  } catch (err) {
    console.error(err);
    return null;
  }
};

// Get task reply by ID
const getTaskReplyFile = async (id) => {
  const query = `
    SELECT * FROM tbl_task WHERE uuid = $1
  `;
  const values = [id];
  try {
    const { rows } = await pool.query(query, values);
    return rows[0];
  } catch (err) {
    console.error(err);
    return null;
  }
};

// Get a task by user id
const getTaskByUserId = async (id) => {
  const query = `SELECT t.*, CASE WHEN tf.file_name IS NOT NULL THEN 'yes' ELSE 'no' END AS has_attachment FROM tbl_task t LEFT JOIN tbl_task_file tf ON t.uuid = tf.task_id::uuid WHERE assign_to = $1`;
  const values = [id];
  try {
    const { rows } = await pool.query(query, values);
    return rows;
  } catch (err) {
    console.error(err);
    return null;
  }
};

// Get a task file by task id
const getTaskFileById = async (id) => {
  const query = `SELECT * FROM tbl_task_file WHERE task_id = $1`;
  const values = [id];
  try {
    const { rows } = await pool.query(query, values);
    return rows;
  } catch (err) {
    console.error(err);
    return null;
  }
};

// Update a task by ID
const updateTaskById = async (id, task) => {
  const {
    task_name,
    description,
    due_datetime,
    start_time,
    priority,
    assign_to,
    task_category,
    score,
    revision_comment,
    status,
    team_id,
  } = task;
  const query = `
    UPDATE tbl_task SET task_name = $1, description = $2, due_datetime = $3, start_time = $4, priority = $5, assign_to = $6, task_category = $7, score = $8, revision_comment = $9, status = $10, team_id = $11
    WHERE id = $12
    RETURNING *
  `;
  const values = [
    task_name,
    description,
    due_datetime,
    start_time,
    priority,
    assign_to,
    task_category,
    score,
    revision_comment,
    status,
    team_id,
    id,
  ];
  try {
    const { rows } = await pool.query(query, values);
    return rows[0];
  } catch (err) {
    console.error(err);
    return null;
  }
};

// Approve a task
const approveTaskById = async (id, task) => {
  const {
    comment,
    status
  } = task;
  const query = `
    UPDATE tbl_task SET manager_comment= $1, status = $2
    WHERE uuid = $3
    RETURNING *
  `;
  const values = [
    comment,
    status,
    id
  ];
  try {
    const { rows } = await pool.query(query, values);
    return rows[0];
  } catch (err) {
    console.error(err);
    return null;
  }
};

// Delete a task by ID
const deleteTaskById = async (id) => {
  const query = `
    DELETE FROM tbl_task WHERE id = $1
    RETURNING *
  `;
  const values = [id];
  try {
    const { rows } = await pool.query(query, values);
    return rows[0];
  } catch (err) {
    console.error(err);
    return null;
  }
};

// Export the CRUD operations
module.exports = {
  createPersonalTask,
  createTeamTask,
  createTask,
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
};