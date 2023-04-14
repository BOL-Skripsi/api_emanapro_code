const express = require("express");
const app = express();
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// apply rate limiter to all requests
const limiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 1 minutes
  max: 1000, // limit each IP to 100 requests per windowMs
});

app.use(limiter);

// Importing Middleware
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const { authenticateToken } = require("./middleware/authenticateToken");

// Importing Routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/product");
const organizationRoutes = require("./routes/organization");
const taskRoutes = require("./routes/task");
const teamRoutes = require("./routes/team");
const rubricRoutes = require("./routes/rubric");
const kpiRoutes = require("./routes/kpi");
const dashboardRoutes = require("./routes/dashboard");
// const teamRoutes = require("./routes/team");
// const kpiRoutes = require("./routes/kpi");

// Setting up Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("tiny"));
app.use(express.json());

// Authentication Middleware
const requireAuth = (req, res, next) => {
  if (req.path === "/logout") {
    // Allow unauthenticated requests to the logout route
    next();
  } else if (req.user) {
    // If the user is authenticated, move on to the next middleware or route handler
    next();
  } else {
    // If the user is not authenticated, send an error response
    res.status(401).json({ error: "Unauthorized" });
  }
};

// Routes
app.use("/auth", authRoutes);
app.use("/product", authenticateToken, requireAuth, productRoutes);
app.use("/organization", organizationRoutes);
app.use("/task", taskRoutes);
app.use("/team", teamRoutes);
app.use("/rubric", rubricRoutes);
app.use("/kpi", kpiRoutes);
app.use("/dashboard", dashboardRoutes);
// app.use("/team", authenticateToken, requireAuth, teamRoutes);
// app.use("/kpi", authenticateToken, requireAuth, kpiRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
