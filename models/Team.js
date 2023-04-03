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

  async getAllTeamsForRubricByManagerId(orgId, manId) {
    const query = {
    text: "SELECT t.id, t.uuid AS team_uuid, t.name AS team_name, t.description, t.manager_id, (SELECT name FROM public.tbl_user WHERE uuid = t.manager_id::uuid) AS manager_name, COUNT(*) AS team_member_count, CASE WHEN COUNT(ar.status_approval) = 0 THEN 'No Data' WHEN COUNT(ar.id) = COUNT(CASE WHEN ar.status_approval = 'approve' THEN 1 END) THEN 'Approved' WHEN COUNT(ar.id) > 0 THEN 'Ongoing'ELSE 'No Data'END AS assessment_rubric_status,COUNT(ar.id) AS assessment_rubric_amount,COUNT(CASE WHEN ar.status_approval = 'approve' THEN 1 END) AS assessment_rubric_amount_approved_except_not_approve FROM public.tbl_team t LEFT JOIN public.tbl_assessment_rubric ar ON ar.team_id::uuid = t.uuid WHERE t.organization_id = $1 AND t.manager_id = $2 GROUP BY t.id, t.uuid, t.name, t.description, t.manager_id, manager_name ORDER BY t.id",
      values: [orgId, manId],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async addTeamMember(team_id, user_id) {
    const query = {
      text: "INSERT INTO tbl_team_member(team_id, user_id) VALUES($1, $2) RETURNING *",
      values: [team_id, user_id],
    };

    const result = await pool.query(query);
    return result.rows[0];
  },

  async getAllAvaliableUser() {
    const query = {
      text: "SELECT u.id, u.uuid, u.name, u.email FROM public.tbl_user u LEFT JOIN public.tbl_team_member tm ON u.uuid = tm.user_id::uuid LEFT JOIN public.organization_roles o ON u.uuid = o.user_id::uuid WHERE tm.user_id IS NULL AND o.organization_role NOT IN ('owner', 'manager', 'hrd')",
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async getAllTeamMember(teamId) {
    const query = {
      text: "SELECT tm.id, tm.uuid, tm.team_id, tm.user_id, u.name, u.email, u.password, u.refresh_token, u.reset_password_token, u.reset_password_token_expires, u.status FROM public.tbl_team_member tm JOIN public.tbl_user u ON tm.user_id::uuid = u.uuid WHERE tm.team_id = $1",
      values: [teamId],
    };

    const result = await pool.query(query);
    return result.rows;
  },


  async getAllTeamMember(teamId) {
    const query = {
      text: "SELECT u.uuid as user_id, u.name, u.email, COUNT(t.id) AS completed_tasks FROM public.tbl_team_member tm INNER JOIN public.tbl_user u ON tm.user_id::uuid = u.uuid LEFT JOIN public.tbl_task t ON t.assign_to::uuid = u.uuid AND t.status = 'complete' WHERE tm.team_id = $1 GROUP BY u.id, u.name, u.email",
      values: [teamId],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async getAllMyJuridictionTeamMember(managerId) {
    console.log(managerId)
    const query = {
      text: "SELECT u.name as user_name, u.uuid as user_id FROM public.tbl_team_member tm LEFT JOIN public.tbl_team t ON tm.team_id::uuid = t.uuid LEFT JOIN public.tbl_user u ON tm.user_id::uuid = u.uuid WHERE t.manager_id = $1",
      values: [managerId.managerId],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async getTeamByUserId(id) {
    const query = {
      text: "SELECT * FROM tbl_team_member WHERE user_id = $1",
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows[0];
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
