const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

module.exports = {

  async getManagerTeamScore(userId) {
    const query = `SELECT 
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
WHERE 
    u.uuid = $1
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
    const values = [userId];
    const result = await pool.query(query, values);
    return result.rows;
  },

  async getManagerTaskApprove(userId) {
    const query = `
    SELECT t.id, t.uuid, t.task_name, t.description, u.name AS assignee_name, t.task_category, t.score, t.revision_comment, t.status, tm.team_id, t.priority, t.due_datetime, t.start_time, t.manager_comment, 
       team.manager_id, manager.name AS manager_name
FROM public.tbl_task t
LEFT JOIN public.tbl_user u ON t.assign_to::uuid = u.uuid
LEFT JOIN public.tbl_team_member tm ON t.assign_to = tm.user_id
LEFT JOIN public.tbl_team team ON tm.team_id::uuid = team.uuid
LEFT JOIN public.tbl_user manager ON team.manager_id::uuid = manager.uuid
WHERE t.status IS NULL AND team.manager_id::uuid = $1;
    `;
    const values = [userId];
    const result = await pool.query(query, values);
    return result.rows;
  },

  async getManagerAssessmentProgress(userId) {
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
WHERE 
    t.manager_id::uuid = $1 AND p.kpi_duedate::timestamp with time zone > NOW()
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
    const values = [userId];
    const result = await pool.query(query, values);
    return result.rows;
  },

  async getHrdAllTeamScore() {
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

  async getHrdRubricToReview() {
    const query = `
    SELECT ar.performance_metric AS rubric_name, t.name AS team_name, u.name AS manager_name
FROM public.tbl_assessment_rubric ar
JOIN public.tbl_team t ON ar.team_id::uuid = t.uuid
JOIN public.tbl_user u ON t.manager_id::uuid = u.uuid
WHERE ar.status_approval IS NULL;

    `;
    const result = await pool.query(query);
    return result.rows;
  },

  async getEmployeePerformance(userId) {
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

WHERE 
  ka.user_id::uuid = $1

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
    const values = [userId];
    const result = await pool.query(query, values);
    return result.rows;
  },

  async getEmployeeOngoing(userId) {
    const query = `
    SELECT id, uuid, task_name, description, assign_to, task_category, score, revision_comment, status, team_id, priority, due_datetime, start_time, manager_comment
FROM public.tbl_task
WHERE start_time::timestamp with time zone < NOW() AND due_datetime::timestamp with time zone > NOW() AND assign_to = $1;
    `;
    const values = [userId];
    const result = await pool.query(query, values);
    return result.rows;
  },

  async getEmployeeTask(userId) {
    const query = `
    SELECT id, uuid, task_name, description, assign_to, task_category, score, revision_comment, status, team_id, priority, due_datetime, start_time, manager_comment
    FROM public.tbl_task
    WHERE assign_to = $1 AND status <> 'approve' AND due_datetime::timestamp with time zone > NOW();
    `;
    const values = [userId];
    const result = await pool.query(query, values);
    return result.rows;
  },
};
