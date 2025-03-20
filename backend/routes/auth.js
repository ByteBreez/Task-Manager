// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

// Signup endpoint
router.post("/signup", async (req, res) => {
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
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
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

module.exports = router;