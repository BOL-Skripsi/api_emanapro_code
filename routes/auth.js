const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const userModel = require("../models/User");
const { v4: uuidv4 } = require("uuid");
const { requireRole } = require("../middleware/authenticateToken");

// Route to handle user login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, refresh_token: user.refresh_token },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ user, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Route to handle user registration
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await userModel.getUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      name,
      email,
      password: hashedPassword,
    };

    const createdUser = await userModel.createUser(newUser);

    const token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Route to handle forgot password request
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    console.log(email);
    const user = await userModel.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetPasswordToken = uuidv4();

    await userModel.updateUserResetPasswordToken(user.id, resetPasswordToken);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: user.email,
      subject: "Password reset",
      text: `Hi ${user.name},\n\nTo reset your password, please click on the following link:\n\n${process.env.CLIENT_URL}/auth/reset-password?token=${resetPasswordToken}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
      } else {
        console.log("Email sent: " + info.response);
        res.status(200).json({ message: "Email sent successfully" });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Route to handle reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { resetPasswordToken, newPassword } = req.body;

    const user = await userModel.getUserByResetPasswordToken(
      resetPasswordToken
    );
    

    if (!user) {
      return res.status(400).json({ message: "Invalid reset password token" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    console.log(hashedPassword);
    await userModel.updateUserPassword(user.id, hashedPassword);
    await userModel.updateUserResetPasswordToken(user.id, null);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Route to handle user logout
router.post("/logout", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token not found" });
  }

  // insert revoked token into database
  const expirationTime = new Date();
  expirationTime.setSeconds(
    expirationTime.getSeconds() + process.env.ACCESS_TOKEN_EXPIRATION_TIME
  );
  await userModel.revokeTokens(token, expirationTime);

  res.status(200).json({ message: "Logged out successfully" });
});

module.exports = router;
