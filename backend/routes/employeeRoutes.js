// routes/employeeRoutes.js - WITHOUT STATUS
const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// GET all employees
router.get("/", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employees ORDER BY employee_id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET single employee
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM employees WHERE employee_id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// ADD employee (without status)
router.post("/", async (req, res) => {
  const { name, phone, position, salary } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO employees (name, phone, position, salary) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, phone, position, salary]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE employee (without status)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phone, position, salary } = req.body;
  
  try {
    const checkExist = await pool.query("SELECT * FROM employees WHERE employee_id = $1", [id]);
    if (checkExist.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    
    await pool.query(
      'UPDATE employees SET name=$1, phone=$2, position=$3, salary=$4 WHERE employee_id=$5',
      [name, phone, position, salary, id]
    );
    
    const updated = await pool.query('SELECT * FROM employees WHERE employee_id = $1', [id]);
    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE employee
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const checkExist = await pool.query("SELECT * FROM employees WHERE employee_id = $1", [id]);
    if (checkExist.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    
    await pool.query('DELETE FROM employees WHERE employee_id = $1', [id]);
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;