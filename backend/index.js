// backend/index.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const initializeSocket = require("./services/socket");
const startCronJobs = require("./services/cron");

// Initialize Express app
const app = express();

// Enable CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware to parse JSON
app.use(express.json());

// Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const io = initializeSocket(server);

// Inject io into request object for routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Start cron jobs
startCronJobs(io);

// Start server
server.listen(5000, () => console.log("Server running on port 5000"));