const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db/connection");

const JWT_SECRET = "msw-auto-service-secret-key-2024";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Access token required" });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Admin access required" });
  next();
};

const createUsersTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'staff',
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table ready');
  } catch (err) {
    console.error('❌ Error creating users table:', err);
  }
};
createUsersTable();

router.get("/test", (req, res) => res.json({ message: "User routes are working!" }));

router.post("/setup", async (req, res) => {
  const { username, email, password, full_name } = req.body;
  try {
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) > 0) return res.status(400).json({ error: "Users already exist." });
    if (!username || !email || !password || !full_name) return res.status(400).json({ error: "All fields required" });
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, 'admin') RETURNING user_id, username, email, full_name, role`,
      [username, email, password_hash, full_name]
    );
    res.status(201).json({ message: "Admin created", user: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/register", async (req, res) => {
  console.log("📝 Register endpoint called with body:", req.body);
  const { username, email, password, full_name, role } = req.body;
  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (existingUser.rows.length > 0) return res.status(400).json({ error: "Username or email already exists" });

    if (!role || (role !== 'admin' && role !== 'staff')) {
      return res.status(400).json({ error: "Role must be either 'admin' or 'staff'" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, username, email, full_name, role, created_at`,
      [username, email, password_hash, full_name, role]
    );
    console.log("✅ User registered:", result.rows[0].username, "with role:", role);
    res.status(201).json({ message: "User created", user: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // ✅ Validate input
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // ✅ Get user
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1 AND is_active = true",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = result.rows[0];

    // ❗ SAFE password check
    if (!user.password_hash) {
      return res.status(500).json({ error: "Password not found in DB" });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // ✅ update last login
    await pool.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1",
      [user.user_id]
    );

    // ✅ create token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        full_name: user.full_name
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // ✅ SAFE user object (DO NOT mutate DB object)
    const safeUser = {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    };

    return res.json({
      message: "Login successful",
      token,
      user: safeUser
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT user_id, username, email, full_name, role, last_login, created_at FROM users WHERE user_id = $1', [req.user.user_id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/", authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT user_id, username, email, full_name, role, is_active, last_login, created_at FROM users ORDER BY user_id');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { full_name, email, role, is_active } = req.body;
  if (req.user.role !== 'admin' && req.user.user_id != id) return res.status(403).json({ error: "Not authorized" });
  try {
    const result = await pool.query(
      `UPDATE users SET full_name = COALESCE($1, full_name), email = COALESCE($2, email),
       role = CASE WHEN $3::text IS NOT NULL AND $4::boolean THEN $3 ELSE role END,
       is_active = COALESCE($5, is_active), updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $6 RETURNING user_id, username, email, full_name, role, is_active`,
      [full_name, email, role, req.user.role === 'admin', is_active, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id/password", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { current_password, new_password } = req.body;
  if (req.user.user_id != id) return res.status(403).json({ error: "Can only change own password" });
  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE user_id = $1', [id]);
    const validPassword = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!validPassword) return res.status(401).json({ error: "Current password incorrect" });
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', [password_hash, id]);
    res.json({ message: "Password updated" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/logout", (req, res) => res.json({ message: "Logged out" }));

module.exports = { router, authenticateToken, isAdmin };