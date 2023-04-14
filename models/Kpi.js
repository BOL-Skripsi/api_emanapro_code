const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

module.exports = {
  async createKpiAssessmentPeriod(kpi_period, kpi_duedate, kpi_startdate) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const assessmentPeriodQuery =
        "INSERT INTO tbl_kpi_assessment_period (kpi_period, kpi_duedate, kpi_startdate) VALUES ($1, $2, $3) RETURNING *";
      const assessmentPeriodValues = [kpi_period, kpi_duedate, kpi_startdate];
      const assessmentPeriodResult = await client.query(
        assessmentPeriodQuery,
        assessmentPeriodValues
      );
      const assessmentRubricQuery = `INSERT INTO tbl_kpi_assessment (assessment_period, user_id, rubric_id, assessment_duedate) SELECT $1, tm.user_id, ar.uuid, $2 FROM public.tbl_team_member tm JOIN public.tbl_assessment_rubric ar ON tm.team_id = ar.team_id WHERE tm.status = $3 AND ar.status_approval = $4 RETURNING *`;
      const assessmentRubricValues = [
        assessmentPeriodResult.rows[0].kpi_period,
        assessmentPeriodResult.rows[0].uuid,
        "active",
        "approve",
      ];
      const assessmentRubricResult = await client.query(
        assessmentRubricQuery,
        assessmentRubricValues
      );
      await client.query("COMMIT");
      return assessmentRubricResult.rows;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async kpiAssessmentScore(assessmentId, score, uraian) {
    const query =
      "UPDATE tbl_kpi_assessment SET score = $2, uraian_kinerja = $3 WHERE uuid = $1 RETURNING *";
    const values = [assessmentId, score, uraian];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async kpiSelfAssessmentScore(assessmentId, score, description) {
    const query =
      "UPDATE tbl_kpi_assessment SET score = $2, data_source_detail = $3 WHERE uuid = $1 RETURNING *";
    const values = [assessmentId, score, description];
    console.log(values);
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async kpiAssessmentChangeScore(assessmentId, score) {
    const query =
      "UPDATE tbl_kpi_assessment SET score = $2 WHERE uuid = $1 RETURNING *";
    const values = [assessmentId, score];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async updateKpiAssessmentRubric(manager_id, team_id) {
    const query = "";
    const values = [manager_id, team_id];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async getKpiRunning(userId) {
    const query = `
    SELECT 
        kp.kpi_duedate
FROM 
    public.tbl_kpi_assessment ka
    JOIN public.tbl_kpi_assessment_period kp ON ka.assessment_period = kp.kpi_period
WHERE 
    kp.kpi_duedate::timestamp with time zone > NOW()
	AND ka.user_id::uuid = $1
ORDER BY 
    kp.kpi_period DESC
LIMIT 1;
    `;
    const values = [userId];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async getKPISelfAssessmentData(userId) {
    const query = `
    SELECT 
    ka.uuid as assessment_uuid, ka.assessment_period, ka.score, ka.user_id, ka.rubric_id, ka.assessment_duedate, ka.uraian_kinerja,
    ar.*, kp.kpi_duedate
FROM 
    public.tbl_kpi_assessment ka
    JOIN public.tbl_assessment_rubric ar ON ka.rubric_id::uuid = ar.uuid
    JOIN public.tbl_kpi_assessment_period kp ON ka.assessment_period = kp.kpi_period
WHERE 
    ar.status_approval = 'approve'
    AND ar.score_system = 'self_assess'
    AND ka.user_id = $1
    AND (ka.score = 0 OR ka.score IS NULL);
    `;
    const values = [userId];
    const result = await pool.query(query, values);
    return result.rows;
  },

  async getKPIDetailAssessmentData(userId) {
    const query = `
    SELECT 
    ka.id, ka.uuid, ka.assessment_period, ka.score, ka.user_id, ka.rubric_id, ka.assessment_duedate, ka.uraian_kinerja,
    ar.*, kp.kpi_duedate
FROM 
    public.tbl_kpi_assessment ka
    JOIN public.tbl_assessment_rubric ar ON ka.rubric_id::uuid = ar.uuid
    JOIN public.tbl_kpi_assessment_period kp ON ka.assessment_period = kp.kpi_period
WHERE 
    ar.status_approval = 'approve'
    AND ka.user_id = $1;
    `;
    const values = [userId];
    const result = await pool.query(query, values);
    return result.rows;
  },

  async getKpiAssessmentData() {
    const query = `
      SELECT 
    t.id, 
    t.name, 
    t.uuid AS team_uuid, 
    u.name AS manager_name, 
    COUNT(DISTINCT tm.user_id) AS num_members, 
    COALESCE(q.num_assessed, 0) AS num_assessed, 
    p.kpi_duedate, 
    k.id, 
    k.uuid, 
    k.kpi_period, 
    k.kpi_startdate,
    ROUND(SUM(ka.score * ar.weight) / SUM(ar.weight), 2) AS final_score
FROM 
    public.tbl_team t 
LEFT JOIN 
    public.tbl_team_member tm ON t.uuid = tm.team_id::uuid 
LEFT JOIN 
    public.tbl_user u ON t.manager_id::uuid = u.uuid 
LEFT JOIN 
    (
        SELECT 
            tm.team_id, 
            COUNT(DISTINCT ka.user_id) AS num_assessed 
        FROM 
            public.tbl_kpi_assessment ka 
        JOIN 
            public.tbl_team_member tm ON tm.user_id::uuid = ka.user_id::uuid 
        WHERE 
            ka.score IS NOT NULL 
        GROUP BY 
            tm.team_id
    ) q ON t.uuid = q.team_id::uuid 
LEFT JOIN 
    public.tbl_kpi_assessment_period p ON true 
LEFT JOIN 
    public.tbl_kpi_assessment_period k ON k.kpi_duedate = p.kpi_duedate 
LEFT JOIN 
    public.tbl_kpi_assessment ka ON ka.assessment_duedate::uuid = k.uuid 
LEFT JOIN 
    public.tbl_assessment_rubric ar ON ka.rubric_id::uuid = ar.uuid 
GROUP BY 
    t.id, 
    t.name, 
    u.name, 
    q.num_assessed, 
    p.kpi_duedate, 
    k.id, 
    k.uuid, 
    k.kpi_period, 
    k.kpi_startdate, 
    t.uuid, 
    manager_name 
ORDER BY 
    p.kpi_duedate DESC, 
    t.name, 
    u.name;

      `;
    const result = await pool.query(query);
    return result.rows;
  },

  async getKpiAssessmentDataByMember(team_id) {
    const query = `
    SELECT 
    u.name AS user_name,
    tm.user_id AS team_member, 
    COALESCE(SUM(assessment_count), 0) AS assessment_count, 
    COALESCE(SUM(rubric_count), 0) AS rubric_count,
    ROUND(SUM(ka2.final_score * ar.weight) / SUM(ar.weight), 2) AS final_score
FROM 
    public.tbl_team_member tm 
    LEFT JOIN (
        SELECT 
            user_id, 
            rubric_id, 
            score,
            COUNT(*) AS assessment_count 
        FROM 
            public.tbl_kpi_assessment 
        WHERE 
            score IS NOT NULL AND score != 0 
        GROUP BY 
            user_id, rubric_id, score
    ) ka ON tm.user_id = ka.user_id 
    LEFT JOIN (
        SELECT 
            team_id, 
			uuid, 
			weight,
            COUNT(DISTINCT id) AS rubric_count 
        FROM 
            public.tbl_assessment_rubric 
        GROUP BY 
            team_id, uuid, weight
    ) ar ON tm.team_id = ar.team_id AND ka.rubric_id::uuid = ar.uuid 
    LEFT JOIN (
        SELECT 
            user_id, 
            ROUND(SUM(score * weight) / SUM(weight), 2) AS final_score,
            rubric_id
        FROM 
            public.tbl_kpi_assessment ka
            INNER JOIN public.tbl_assessment_rubric ar ON ka.rubric_id::uuid = ar.uuid
        WHERE 
            ka.score IS NOT NULL AND ka.score != 0 
        GROUP BY 
            user_id, rubric_id
    ) ka2 ON tm.user_id = ka2.user_id AND ar.uuid = ka2.rubric_id::uuid
    INNER JOIN public.tbl_user u ON tm.user_id::uuid = u.uuid

    WHERE 
    tm.team_id = $1
GROUP BY
    u.name, tm.user_id, assessment_count, rubric_count
ORDER BY 
    user_name
      `;
    const values = [team_id];
    const result = await pool.query(query, values);
    return result.rows;
  },

  async getKpiAssessmentDataByUser(user_id) {
    const query = `SELECT kpi.id, kpi.uuid, kpi.assessment_period, kpi.score, kpi.user_id, kpi.rubric_id, kpi.assessment_duedate, kpi.uraian_kinerja, 
    rubric.team_id, rubric.order_rubric, rubric.performance_metric, rubric.criteria, rubric.weight, rubric.score_system, 
    rubric.data_source, rubric.feedback_and_improvement, rubric.status_approval, rubric.category, rubric.description 
    FROM public.tbl_kpi_assessment kpi 
    JOIN public.tbl_assessment_rubric rubric 
    ON kpi.rubric_id::uuid = rubric.uuid
    WHERE kpi.user_id = $1
    ORDER BY rubric.category
      `;
    const values = [user_id];
    const result = await pool.query(query, values);
    return result.rows;
  },

  async getKpiPeriod() {
    const query = `SELECT id, uuid, kpi_period, kpi_startdate, kpi_duedate
    FROM public.tbl_kpi_assessment_period;
      `;
    const result = await pool.query(query);
    return result.rows;
  },

  async getKpiAssessmentOpebByMember(manager_id) {
    const query = `
    SELECT u.uuid AS user_id, tbl_user.name AS user_name, t.name AS team_name, 
    COUNT(DISTINCT ar.uuid) AS num_rubrics, 
    COUNT(ka.id) AS num_assessments_with_score, 
    kap.kpi_duedate AS assessment_due_date, 
    kap.uuid AS assessment_due_date_uuid, 
    kap.kpi_period, 
    ROUND(SUM(ka.score * ar.weight) / SUM(ar.weight), 2) AS final_score
  FROM public.tbl_assessment_rubric ar 
  JOIN public.tbl_team t ON ar.team_id::uuid = t.uuid 
  JOIN public.tbl_team_member tm ON tm.team_id::uuid = ar.team_id::uuid 
  JOIN public.tbl_user u ON u.uuid = tm.user_id::uuid 
  LEFT JOIN public.tbl_kpi_assessment ka ON ar.uuid = ka.rubric_id::uuid AND ka.user_id::uuid = u.uuid AND ka.score IS NOT NULL 
  LEFT JOIN public.tbl_kpi_assessment_period kap ON kap.uuid = COALESCE(ka.assessment_duedate::uuid, kap.uuid) 
  JOIN public.tbl_user tbl_user ON u.uuid = tbl_user.uuid
  WHERE t.manager_id = $1
  GROUP BY u.uuid, tbl_user.name, t.name, kap.kpi_duedate, kap.uuid, kap.kpi_period;
      `;
    const values = [manager_id];
    const result = await pool.query(query, values);
    return result.rows;
  },

  async getKpiAssessmentOpebByMemberDetail(userId, duedateId) {
    const query =
      "SELECT u.uuid AS user_id, tbl_user.name AS user_name, t.name AS team_name, ar.category, COUNT(DISTINCT ar.uuid) AS num_rubrics, COUNT(ka.id) AS num_assessments_with_score, kap.kpi_duedate AS assessment_due_date, kap.uuid AS assessment_due_date_uuid FROM public.tbl_assessment_rubric ar JOIN public.tbl_team t ON ar.team_id::uuid = t.uuid JOIN public.tbl_team_member tm ON tm.team_id::uuid = ar.team_id::uuid JOIN public.tbl_user u ON u.uuid = tm.user_id::uuid LEFT JOIN public.tbl_kpi_assessment ka ON ar.uuid = ka.rubric_id::uuid AND ka.user_id::uuid = u.uuid AND ka.score IS NOT NULL LEFT JOIN public.tbl_kpi_assessment_period kap ON kap.uuid = COALESCE(ka.assessment_duedate::uuid, kap.uuid) JOIN public.tbl_user tbl_user ON u.uuid = tbl_user.uuid WHERE u.uuid = $1 AND kap.uuid = $2 GROUP BY u.uuid, tbl_user.name, t.name, ar.category, kap.kpi_duedate,  kap.uuid";
    const values = [userId, duedateId];
    const result = await pool.query(query, values);
    return result.rows;
  },

  async getKpiAssessmentForm(userId, duedateId, category) {
    const query = `
      SELECT a.id, a.uuid, a.assessment_period, a.score, a.user_id, a.rubric_id, a.assessment_duedate, a.uraian_kinerja, r.team_id, r.order_rubric, r.performance_metric, r.criteria, r.weight, r.score_system, r.data_source, r.feedback_and_improvement, r.status_approval, r.category, r.description, p.kpi_duedate  
FROM public.tbl_kpi_assessment a 
LEFT JOIN public.tbl_assessment_rubric r ON a.rubric_id::uuid = r.uuid 
LEFT JOIN public.tbl_kpi_assessment_period p  ON a.assessment_duedate::uuid = p.uuid 
WHERE a.user_id = $1 AND a.assessment_duedate = $2 AND r.category = $3

      `;
    const values = [userId, duedateId, category];
    const result = await pool.query(query, values);
    return result.rows;
  },

  async updateKpiAssessmentOpenByMemberDetail(id, score, comment) {
    const query =
      "UPDATE tbl_kpi_assessment SET score = $2, comment = $3 WHERE uuid = $1 RETURNING *";
    const values = [id, score, comment];
    const result = await pool.query(query, values);
    return result.rows[0];
  },
};
