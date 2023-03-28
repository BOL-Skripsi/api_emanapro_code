const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

module.exports = {
    async createOrganization(name, description) {
        const id = uuidv4();
        const query = "INSERT INTO organizations (id, name, description) VALUES ($1, $2, $3) RETURNING *";
        const values = [id, name, description];
        const result = await pool.query(query, values);
        return result.rows[0];
      },
    
      async getAllOrganizations() {
        const query = "SELECT * FROM organizations";
        const result = await pool.query(query);
        return result.rows;
      },
    
      async getOrganizationById(id) {
        const query = "SELECT * FROM organizations WHERE id = $1";
        const values = [id];
        const result = await pool.query(query, values);
        return result.rows[0];
      },
    
      async updateOrganizationById(id, name, description) {
        const query = "UPDATE organizations SET name = $2, description = $3 WHERE id = $1 RETURNING *";
        const values = [id, name, description];
        const result = await pool.query(query, values);
        return result.rows[0];
      },
    
      async deleteOrganizationById(id) {
        const query = "DELETE FROM organizations WHERE id = $1 RETURNING *";
        const values = [id];
        const result = await pool.query(query, values);
        return result.rows[0];
      }
};
