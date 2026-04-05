const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// GET all customers
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM customers ORDER BY customer_id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET single customer
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM customers WHERE customer_id = $1", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// ADD customer
router.post("/", async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    
    // Validation
    if (!name || !phone) {
      return res.status(400).json({ error: "Name and phone are required" });
    }
    
    const newCustomer = await pool.query(
      "INSERT INTO customers (name, phone, address) VALUES ($1, $2, $3) RETURNING *",
      [name, phone, address]
    );
    
    res.status(201).json(newCustomer.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE customer
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address } = req.body;
    
    // Check if customer exists
    const checkExist = await pool.query("SELECT * FROM customers WHERE customer_id = $1", [id]);
    if (checkExist.rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    await pool.query(
      "UPDATE customers SET name=$1, phone=$2, address=$3 WHERE customer_id=$4",
      [name, phone, address, id]
    );
    
    res.json({ message: "Customer updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE customer
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if customer exists
    const checkExist = await pool.query("SELECT * FROM customers WHERE customer_id = $1", [id]);
    if (checkExist.rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    await pool.query("DELETE FROM customers WHERE customer_id = $1", [id]);
    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;