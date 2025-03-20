// backend/services/cron.js
const cron = require("node-cron");
const pool = require("../config/db");

const startCronJobs = (io) => {
  cron.schedule("* * * * *", async () => {
    try {
      const result = await pool.query(
        `SELECT * FROM tasks 
         WHERE deadline - INTERVAL '1 minute' * reminder_minutes <= NOW() 
         AND deadline > NOW() 
         AND status = 'pending' 
         AND reminded_at IS NULL 
         AND notification_count < 1`
      );
      for (const task of result.rows) {
        const minutesUntilDeadline = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60));
        io.emit(
          "notification",
          `Reminder: Task "${task.title}" is due in ${minutesUntilDeadline} minutes! Deadline: ${new Date(task.deadline).toLocaleString()}`
        );
        await pool.query(
          "UPDATE tasks SET reminded_at = NOW(), notification_count = notification_count + 1 WHERE id = $1",
          [task.id]
        );
      }
    } catch (err) {
      console.error("Cron job error:", err);
    }
  });
};

module.exports = startCronJobs;