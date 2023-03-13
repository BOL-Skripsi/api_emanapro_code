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
  async getUserByEmail(email) {
    const result = await pool.query("SELECT * FROM tbl_user WHERE email = $1", [
      email,
    ]);
    return result.rows[0];
  },

  async createUser(name, email, password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool.query(
      "INSERT INTO tbl_user (name, email, password) VALUES ($1, $2, $3)",
      [name, email, hashedPassword]
    );

    const userResult = await pool.query(
      "SELECT * FROM tbl_user WHERE email = $1",
      [email]
    );
    return userResult.rows[0];
  },

  async updateUserPassword(userId, password) {
    await pool.query("UPDATE tbl_user SET password = $1 WHERE id = $2", [
      password,
      userId,
    ]);
  },
  async updateUserRefreshToken(userId, refreshToken) {
    await pool.query("UPDATE tbl_user SET refresh_token = $1 WHERE id = $2", [
      refreshToken,
      userId,
    ]);
  },
  async updateUserResetPasswordToken(userId, resetToken, resetTokenExpires) {
    await pool.query(
      "UPDATE tbl_user SET reset_password_token = $1, reset_password_token_expires = $2 WHERE id = $3",
      [resetToken, resetTokenExpires, userId]
    );
  },
  async getUserByResetPasswordToken(resetPasswordToken) {
    try {
      const result = await pool.query(
        "SELECT * FROM tbl_user WHERE reset_password_token = $1",
        [resetPasswordToken]
      );
      return result.rows[0];
    } catch (error) {
      console.log(error);
    }
  },
  async revokeTokens(token, expirationTime) {
    await pool.query(
      "INSERT INTO revoked_tokens (token, expiration_time) VALUES ($1, $2)",
      [token, expirationTime]
    );
  },
  async checkRevokedTokens(token) {
    const tokenResult = await pool.query(
      "SELECT * FROM revoked_tokens WHERE token = $1",
      [token]
    );
    return tokenResult;
  },
  async deleteRevokedToken() {
    await pool.query(
      "DELETE FROM revoked_tokens WHERE expiration_time < NOW()"
    );
  },
};
