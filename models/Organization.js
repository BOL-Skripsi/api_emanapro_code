const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

module.exports = {
    async createOrganization(name, description, owner_id) {
        const query = "INSERT INTO tbl_organization (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *";
        const values = [name, description, owner_id];
        const result = await pool.query(query, values);
        return result.rows[0];
      },
    
      async getAllOrganizations(owner_id) {
        const query = "SELECT * FROM tbl_organization WHERE owner_id = $1";
        const values = [owner_id];
        const result = await pool.query(query, values);
        return result.rows;
      },

      async getAllUserOrganizations(user_id) {
        const query = "SELECT * FROM tbl_organization WHERE user_id = $1";
        const values = [user_id];
        const result = await pool.query(query, values);
        return result.rows;
      },
    
      async getOrganizationById(id) {
        const query = "SELECT * FROM tbl_organization WHERE uuid = $1";
        const values = [id];
        const result = await pool.query(query, values);
        return result.rows[0];
      },
    
      async updateOrganizationById(id, name, description) {
        const query = "UPDATE tbl_organization SET name = $2, description = $3 WHERE uuid = $1 RETURNING *";
        const values = [id, name, description];
        const result = await pool.query(query, values);
        return result.rows[0];
      },
    
      async deleteOrganizationById(id) {
        const query = "DELETE FROM tbl_organization WHERE uuid = $1 RETURNING *";
        const values = [id];
        const result = await pool.query(query, values);
        return result.rows[0];
      }
};
