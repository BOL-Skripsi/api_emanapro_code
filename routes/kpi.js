const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/authenticateToken");
const Organization = require("../models/Organization");
const userModel = require("../models/User");
const nodemailer = require("nodemailer");