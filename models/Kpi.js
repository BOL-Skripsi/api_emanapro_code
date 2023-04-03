const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

module.exports = {
  async createKpiAssessmentPeriod(kpi_duedate) {
    const query =
      "INSERT INTO tbl_kpi_assessment_period (kpi_duedate) VALUES ($1) RETURNING *";
    const values = [kpi_duedate];
    const result = await pool.query(query, values);
    return result.rows[0];
  },
  async getKpiAssessmentData() {
    const query =
      "SELECT t.id, t.name, t.uuid as team_uuid, u.name AS manager_name, COUNT(DISTINCT tm.user_id) AS num_members, COALESCE(q.num_assessed, 0) AS num_assessed, p.kpi_duedate FROM public.tbl_team t LEFT JOIN public.tbl_team_member tm ON t.uuid = tm.team_id::uuid LEFT JOIN public.tbl_user u ON t.manager_id::uuid = u.uuid LEFT JOIN ( SELECT tm.team_id, COUNT(DISTINCT ka.user_id) AS num_assessed FROM public.tbl_kpi_assessment ka JOIN public.tbl_team_member tm ON tm.user_id::uuid = ka.user_id::uuid WHERE ka.score IS NOT NULL GROUP BY tm.team_id ) q ON t.uuid = q.team_id::uuid LEFT JOIN public.tbl_kpi_assessment_period p ON true GROUP BY t.id, t.name, u.name, q.num_assessed, p.kpi_duedate ORDER BY p.kpi_duedate DESC, t.name, u.name";
    const result = await pool.query(query);
    return result.rows;
  },

  async getKpiAssessmentDataByMember(team_id) {
    const query =
      "SELECT tm.team_id, tm.user_id, u.name, count(ar.id) AS num_rubric_assessments, COUNT(ka.id) AS num_assessments_with_score FROM public.tbl_team_member tm JOIN public.tbl_user u ON tm.user_id::uuid = u.uuid LEFT JOIN public.tbl_assessment_rubric ar ON tm.team_id::uuid = ar.team_id::uuid LEFT JOIN public.tbl_kpi_assessment ka ON ar.uuid = ka.rubric_id::uuid AND ka.score IS NOT NULL WHERE tm.team_id::uuid = $1 GROUP BY tm.team_id, tm.user_id, u.name";
      const values = [team_id];
    const result = await pool.query(query,values);
    return result.rows;
  },

  async getKpiAssessmentOpebByMember() {
    const query =
      "SELECT u.uuid AS user_id, tbl_user.name AS user_name, t.name AS team_name, COUNT(DISTINCT ar.uuid) AS num_rubrics, COUNT(ka.id) AS num_assessments_with_score, kap.kpi_duedate AS assessment_due_date, kap.uuid AS assessment_due_date_uuid FROM public.tbl_assessment_rubric ar JOIN public.tbl_team t ON ar.team_id::uuid = t.uuid JOIN public.tbl_team_member tm ON tm.team_id::uuid = ar.team_id::uuid JOIN public.tbl_user u ON u.uuid = tm.user_id::uuid LEFT JOIN public.tbl_kpi_assessment ka ON ar.uuid = ka.rubric_id::uuid AND ka.user_id::uuid = u.uuid AND ka.score IS NOT NULL LEFT JOIN public.tbl_kpi_assessment_period kap ON kap.uuid = COALESCE(ka.assessment_duedate::uuid, kap.uuid) JOIN public.tbl_user tbl_user ON u.uuid = tbl_user.uuid GROUP BY u.uuid, tbl_user.name, t.name, kap.kpi_duedate, kap.uuid";
    const result = await pool.query(query);
    return result.rows;
  },

  async getKpiAssessmentOpebByMemberDetail(userId, duedateId) {
    const query =
      "SELECT u.uuid AS user_id, tbl_user.name AS user_name, t.name AS team_name, ar.category, COUNT(DISTINCT ar.uuid) AS num_rubrics, COUNT(ka.id) AS num_assessments_with_score, kap.kpi_duedate AS assessment_due_date FROM public.tbl_assessment_rubric ar JOIN public.tbl_team t ON ar.team_id::uuid = t.uuid JOIN public.tbl_team_member tm ON tm.team_id::uuid = ar.team_id::uuid JOIN public.tbl_user u ON u.uuid = tm.user_id::uuid LEFT JOIN public.tbl_kpi_assessment ka ON ar.uuid = ka.rubric_id::uuid AND ka.user_id::uuid = u.uuid AND ka.score IS NOT NULL LEFT JOIN public.tbl_kpi_assessment_period kap ON kap.uuid = COALESCE(ka.assessment_duedate::uuid, kap.uuid) JOIN public.tbl_user tbl_user ON u.uuid = tbl_user.uuid WHERE u.uuid = $1 AND kap.uuid = $2 GROUP BY u.uuid, tbl_user.name, t.name, ar.category, kap.kpi_duedate";
      const values = [userId, duedateId]
    const result = await pool.query(query, values);
    return result.rows;
  },
};
