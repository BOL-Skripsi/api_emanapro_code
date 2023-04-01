const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

module.exports = {
  async createTeam(name, manId, orgId, description) {
    const query = {
      text: "INSERT INTO tbl_team(name, manager_id, organization_id, description) VALUES($1, $2, $3, $4) RETURNING *",
      values: [name, manId, orgId, description],
    };

    const result = await pool.query(query);
    return result.rows[0];
  },

  async getAllTeamsByOrgId(orgId) {
    const query = {
      text: "SELECT id, uuid, name, description, manager_id, organization_id, (SELECT name FROM public.tbl_user WHERE manager_id::UUID = tbl_user.uuid ) AS manager_name, (SELECT COUNT(*) FROM public.tbl_team_member WHERE team_id::UUID = tbl_team.uuid) AS team_member_count FROM public.tbl_team WHERE organization_id = $1",
      values: [orgId],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async getTeamById(id) {
    const query = {
      text: "SELECT * FROM tbl_team WHERE uuid = $1",
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows[0];
  },

  async updateTeamById(id, name, description) {
    const query = {
      text: "UPDATE tbl_team SET name = $1, description = $2 WHERE uuid = $3 RETURNING *",
      values: [name, description, id],
    };

    const result = await pool.query(query);
    return result.rows[0];
  },

  async deleteTeamById(id) {
    const query = {
      text: "DELETE FROM tbl_team WHERE uuid = $1",
      values: [id],
    };

    await pool.query(query);
  },
};
