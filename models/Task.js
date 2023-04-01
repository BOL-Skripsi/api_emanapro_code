const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

module.exports = {
  async createDailyTask(title, description, assignee_id, standard_hours) {
    const query =
      "INSERT INTO daily_task (title, description, assignee_id, standard_hours) VALUES ($1, $2, $3, $4) RETURNING *";
    const values = [title, description, assignee_id, standard_hours];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async getDailyTaskById(id) {
    const query = "SELECT * FROM daily_task WHERE id = $1";
    const values = [id];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async updateDailyTaskById(
    id,
    title,
    description,
    assignee_id,
    start_time,
    end_time,
    pause_time,
    file_path,
    actual_hours
  ) {
    const query =
      "UPDATE daily_task SET title = $2, description = $3, assignee_id = $4, start_time = $5, end_time = $6, pause_time = $7, file_path = $8, actual_hours = $9 WHERE id = $1 RETURNING *";
    const values = [
      id,
      title,
      description,
      assignee_id,
      start_time,
      end_time,
      pause_time,
      file_path,
      actual_hours,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async deleteDailyTaskById(id) {
    const query = "DELETE FROM daily_task WHERE id = $1 RETURNING *";
    const values = [id];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async createDailyTaskReply(daily_task_id, reply_text, author_id, file_path) {
    const query =
      "INSERT INTO daily_task_reply (daily_task_id, reply_text, author_id, file_path) VALUES ($1, $2, $3, $4) RETURNING *";
    const values = [daily_task_id, reply_text, author_id, file_path];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async getDailyTaskReplyById(id) {
    const query = "SELECT * FROM daily_task_reply WHERE id = $1";
    const values = [id];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async updateDailyTaskReplyById(id, reply_text, file_path) {
    const query =
      "UPDATE daily_task_reply SET reply_text = $2, file_path = $3 WHERE id = $1 RETURNING *";
    const values = [id, reply_text, file_path];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async deleteDailyTaskReplyById(id) {
    const query = "DELETE FROM daily_task_reply WHERE id = $1 RETURNING *";
    const values = [id];
    const result = await pool.query(query, values);
    return result.rows[0];
  },
};
