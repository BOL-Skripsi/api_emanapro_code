const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

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

  async getUserById(userId) {
    const result = await pool.query("SELECT * FROM tbl_user WHERE uuid = $1", [
      userId,
    ]);
    return result.rows[0];
  },

  
  async changeUserPassword(password, userId) {
    await pool.query("UPDATE tbl_user SET password = $1, change_password='1' WHERE uuid = $2", [
      password,
      userId,
    ]);
  },

  async getAllUser() {
    const result = await pool.query("SELECT u.uuid, u.name as user_name, u.email, t.name as team_name, tm.user_id as team_manager_id, tm.id as team_member_id, m.name as manager_name, org.organization_role FROM public.tbl_user u LEFT JOIN public.tbl_team_member tm ON u.uuid = tm.user_id::uuid LEFT JOIN public.tbl_team t ON tm.team_id::uuid = t.uuid::uuid LEFT JOIN public.tbl_user m ON t.manager_id::uuid = m.uuid::uuid LEFT JOIN public.organization_roles org ON u.uuid = org.user_id::uuid WHERE NOT org.organization_role = 'owner'");
    return result.rows;
  },

  async getUserOrganizationRoleById(userId, orgId) {
    const result = await pool.query('SELECT * FROM organization_roles WHERE user_id = $1 AND organization_id = $2', [userId, orgId]);
    return result.rows[0];
  },

  async createUser(data) {
    await pool.query(
      "INSERT INTO tbl_user (name, email, password) VALUES ($1, $2, $3)",
      [data.name, data.email, data.password]
    );

    const userResult = await pool.query(
      "SELECT * FROM tbl_user WHERE email = $1",
      [data.email]
    );

    await pool.query(
      "INSERT INTO organization_roles (organization_id, organization_role,user_id) VALUES ($1, $2, $3)",
      ['71152531-e247-467f-8839-b78c14d7f71e','employee', userResult.rows[0].uuid]
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

  async inviteUserByEmail(email, name) {
    // Check if the user already exists
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      throw new Error("User with this email already exists.");
    }

    // Generate a temporary password
    const tempPassword = crypto.randomBytes(12).toString("hex");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);
    // Create a new user with the temporary password
    const User = {
      name: name,
      email:email,
      password: hashedPassword
    };
    const newUser = await this.createUser(User);

    // Set the user's status to 'invited'
    await pool.query("UPDATE tbl_user SET status = 'invited' WHERE id = $1", [User.id]);

    return { user: newUser, password: tempPassword };
  },

  async getOrganizationRole(userId, organizationId) {
    const result = await pool.query(
      "SELECT role FROM organization_roles WHERE user_id = $1 AND organization_id = $2",
      [userId, organizationId]
    );
    return result.rows[0].role;
  },

  async assignOrganizationRole(userId, organizationId, role) {
    const roles = {
      owner: "owner",
      hrd: "hrd",
      manager: "manager",
      employee: "employee",
    };
    const userRole = roles[role];
    if (!userRole) {
      throw new Error("Invalid role");
    }

    await pool.query("BEGIN");

    try {
      // Remove existing roles for the user in the organization
      await pool.query(
        "DELETE FROM organization_roles WHERE user_id = $1 AND organization_id = $2",
        [userId, organizationId]
      );

      // Assign the new role to the user in the organization
      await pool.query(
        "INSERT INTO organization_roles (user_id, organization_id, organization_role) VALUES ($1, $2, $3)",
        [userId, organizationId, userRole]
      );

      await pool.query("COMMIT");
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  },

  async getTeamRole(userId, teamId) {
    const result = await pool.query(
      "SELECT role FROM team_roles WHERE user_id = $1 AND team_id = $2",
      [userId, teamId]
    );
    return result.rows[0].role;
  },

  async assignTeamRole(userId, teamId, role) {
    const roles = {
      manager: "manager",
      employee: "employee",
    };
    const userRole = roles[role];
    if (!userRole) {
      throw new Error("Invalid role");
    }

    await pool.query("BEGIN");

    try {
      // Remove existing roles for the user in the team
      await pool.query(
        "DELETE FROM team_roles WHERE user_id = $1 AND team_id = $2",
        [userId, teamId]
      );

      // Assign the new role to the user in the team
      await pool.query(
        "INSERT INTO team_roles (user_id, team_id, role) VALUES ($1, $2, $3)",
        [userId, teamId, userRole]
      );

      await pool.query("COMMIT");
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  },
};
