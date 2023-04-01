const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

module.exports = {
  async createKpiAssessmentRubric(
    name,
    description,
    weight,
    target,
    minimum,
    maximum,
    metric
  ) {
    const query =
      "INSERT INTO kpi_assessment_rubric (name, description, weight, target, minimum, maximum, metric) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *";
    const values = [
      name,
      description,
      weight,
      target,
      minimum,
      maximum,
      metric,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async getKpiAssessmentRubricById(id) {
    const query = "SELECT * FROM kpi_assessment_rubric WHERE id = $1";
    const values = [id];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async getKpiAssessmentRubric() {
    const query = "SELECT * FROM kpi_assessment_rubric";
    const result = await pool.query(query);
    return result.rows;
  },

  async updateKpiAssessmentRubricById(
    id,
    name,
    description,
    weight,
    target,
    minimum,
    maximum,
    metric
  ) {
    const query =
      "UPDATE kpi_assessment_rubric SET name = $2, description = $3, weight = $4, target = $5, minimum = $6, maximum = $7, metric = $8 WHERE id = $1 RETURNING *";
    const values = [
      id,
      name,
      description,
      weight,
      target,
      minimum,
      maximum,
      metric,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async deleteKpiAssessmentRubricById(id) {
    const query = "DELETE FROM kpi_assessment_rubric WHERE id = $1 RETURNING *";
    const values = [id];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async createKpiAssessmentRubricReview(
    rubric_id,
    reviewer_id,
    score,
    comment
  ) {
    const query =
      "INSERT INTO tbl_kpi_assessment_rubric_review (rubric_id, reviewer_id, score, comment) VALUES ($1, $2, $3, $4) RETURNING *";
    const values = [rubric_id, reviewer_id, score, comment];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async getKpiAssessmentRubricReviewById(id) {
    const query =
      "SELECT tbl_kpi_assessment_rubric_review.*, tbl_user.name AS reviewer_name, kpi_assessment_rubric.name AS rubric_name, kpi_assessment_rubric.description AS rubric_description, tbl_organization.name AS organization_name, tbl_organization.description AS organization_description, tbl_user.email AS reviewer_email FROM tbl_kpi_assessment_rubric_review INNER JOIN tbl_user ON tbl_kpi_assessment_rubric_review.reviewer_id = tbl_user.id INNER JOIN kpi_assessment_rubric ON tbl_kpi_assessment_rubric_review.rubric_id = kpi_assessment_rubric.id INNER JOIN tbl_organization ON kpi_assessment_rubric.organization_id = tbl_organization.uuid WHERE tbl_kpi_assessment_rubric_review.uuid = $1";
    const values = [id];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async updateKpiAssessmentRubricReviewById(id, score, comment) {
    const query =
      "UPDATE tbl_kpi_assessment_rubric_review SET score = $2, comment = $3 WHERE uuid = $1 RETURNING *";
    const values = [id, score, comment];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async deleteKpiAssessmentRubricReviewById(id) {
    const query =
      "DELETE FROM tbl_kpi_assessment_rubric_review WHERE uuid = $1 RETURNING *";
    const values = [id];
    const result = await pool.query(query, values);
    return result.rows[0];
  },
};
