// backend/routes/tasks.js
const express = require("express");
const pool = require("../config/db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// Create task
router.post("/", authenticateToken, async (req, res) => {
  const { user_id, title, description, deadline, color, status, reminder_minutes } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO tasks (user_id, title, description, deadline, color, status, reminder_minutes, notification_count) VALUES ($1, $2, $3, $4, $5, $6, $7, 0) RETURNING *",
      [user_id, title, description, deadline, color, status, reminder_minutes]
    );
    const newTask = result.rows[0];

    req.io.emit("notification", `New task added: ${title}`);

    const now = new Date();
    const deadlineDate = new Date(newTask.deadline);
    const timeDifferenceMinutes = (deadlineDate - now) / (1000 * 60);

    if (timeDifferenceMinutes > 0 && timeDifferenceMinutes < 15) {
      req.io.emit(
        "notification",
        `Reminder: Task "${newTask.title}" is due soon! Deadline: ${deadlineDate.toLocaleString()}`
      );
      await pool.query(
        "UPDATE tasks SET reminded_at = NOW(), notification_count = notification_count + 1 WHERE id = $1",
        [newTask.id]
      );
    }

    res.json(newTask);
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(500).json({ message: "Error creating task" });
  }
});

// Get tasks
router.get("/", authenticateToken, async (req, res) => {
  const { userId } = req.query;
  try {
    const result = await pool.query("SELECT * FROM tasks WHERE user_id = $1", [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Error fetching tasks" });
  }
});

// Update task
router.put("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, deadline, color, status, reminder_minutes } = req.body;
  try {
    const currentTask = await pool.query(
      "SELECT * FROM tasks WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );
    if (currentTask.rowCount === 0) {
      return res.status(404).json({ message: "Task not found or unauthorized" });
    }

    const updatedTask = {
      title: title !== undefined ? title : currentTask.rows[0].title,
      description: description !== undefined ? description : currentTask.rows[0].description,
      deadline: deadline !== undefined ? deadline : currentTask.rows[0].deadline,
      color: color !== undefined ? color : currentTask.rows[0].color,
      status: status !== undefined ? status : currentTask.rows[0].status,
      reminder_minutes: reminder_minutes !== undefined ? reminder_minutes : currentTask.rows[0].reminder_minutes,
    };

    const result = await pool.query(
      "UPDATE tasks SET title = $1, description = $2, deadline = $3, color = $4, status = $5, reminder_minutes = $6 WHERE id = $7 AND user_id = $8 RETURNING *",
      [updatedTask.title, updatedTask.description, updatedTask.deadline, updatedTask.color, updatedTask.status, updatedTask.reminder_minutes, id, req.user.id]
    );

    req.io.emit("notification", `Task "${result.rows[0].title}" updated successfully ✔`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ message: "Error updating task" });
  }
});

// Delete task
router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, req.user.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found or unauthorized" });
    }
    req.io.emit("notification", `Task ${id} deleted`);
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting task" });
  }
});

module.exports = router;