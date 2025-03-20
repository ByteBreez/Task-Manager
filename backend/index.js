require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cron = require("node-cron");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// Initialize Express app
const app = express();

// Enable CORS for requests from the frontend (http://localhost:3000)
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
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// Signup endpoint
app.post("/api/auth/signup", async (req, res) => {
  const { email, username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id, email, username",
      [email, username, hashedPassword]
    );
    const token = jwt.sign(
      { id: result.rows[0].id, email, username },
      process.env.JWT_SECRET
    );
    res.json({ token });
  } catch (err) {
    res.status(400).json({ message: "Email or username already exists" });
  }
});

// Login endpoint
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (
      result.rows.length === 0 ||
      !(await bcrypt.compare(password, result.rows[0].password))
    ) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const { id, email: userEmail, username } = result.rows[0];
    const token = jwt.sign(
      { id, email: userEmail, username },
      process.env.JWT_SECRET
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create task
app.post("/api/tasks", authenticateToken, async (req, res) => {
  const { user_id, title, description, deadline, color, status } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO tasks (user_id, title, description, deadline, color, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [user_id, title, description, deadline, color, status]
    );
    io.emit("notification", `New task added: ${title}`);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Error creating task" });
  }
});

// Get tasks
app.get("/api/tasks", authenticateToken, async (req, res) => {
  const { userId } = req.query;
  try {
    const result = await pool.query("SELECT * FROM tasks WHERE user_id = $1", [
      userId,
    ]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Error fetching tasks" });
  }
});

// Update task (supports partial updates)
app.put("/api/tasks/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, deadline, color, status } = req.body;
  try {
    const currentTask = await pool.query(
      "SELECT * FROM tasks WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );
    if (currentTask.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Task not found or unauthorized" });
    }

    const updatedTask = {
      title: title !== undefined ? title : currentTask.rows[0].title,
      description:
        description !== undefined
          ? description
          : currentTask.rows[0].description,
      deadline:
        deadline !== undefined ? deadline : currentTask.rows[0].deadline,
      color: color !== undefined ? color : currentTask.rows[0].color,
      status: status !== undefined ? status : currentTask.rows[0].status,
    };

    const result = await pool.query(
      "UPDATE tasks SET title = $1, description = $2, deadline = $3, color = $4, status = $5 WHERE id = $6 AND user_id = $7 RETURNING *",
      [
        updatedTask.title,
        updatedTask.description,
        updatedTask.deadline,
        updatedTask.color,
        updatedTask.status,
        id,
        req.user.id,
      ]
    );

    io
      .emit
      //   "notification",
      //   `Task "${result.rows[0].title}" updated successfully ✔`
      ();
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ message: "Error updating task" });
  }
});

// Delete task
app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, req.user.id]
    );
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Task not found or unauthorized" });
    }
    // io.emit("notification", `Task ${id} deleted`);
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting task" });
  }
});

// Cron job for task notifications
cron.schedule("* * * * *", async () => {
  try {
    const result = await pool.query(
      "SELECT * FROM tasks WHERE deadline <= NOW() + INTERVAL '1 hour' AND deadline > NOW() AND status = 'pending'"
    );
    result.rows.forEach((task) => {
      io.emit(
        "notification",
        `Task "${task.title}" due in 1 hour: ${new Date(
          task.deadline
        ).toLocaleString()}`
      );
    });
  } catch (err) {
    console.error("Cron job error:", err);
  }
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("A client connected");
  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });
});

// Start server
server.listen(5000, () => console.log("Server running on port 5000"));
