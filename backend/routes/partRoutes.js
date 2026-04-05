// routes/partRoutes.js - Make sure this file exists
const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// GET all parts
router.get("/", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM parts ORDER BY part_id DESC');
    console.log("✅ Parts fetched:", result.rows.length); // Debug log
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching parts:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET single part
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM parts WHERE part_id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Part not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// ADD part
router.post("/", async (req, res) => {
  const { part_name, brand, stock, buy_price, sell_price } = req.body;
  
  console.log("📝 Adding part:", req.body); // Debug log
  
  try {
    const result = await pool.query(
      'INSERT INTO parts (part_name, brand, stock, buy_price, sell_price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [part_name, brand, stock, buy_price, sell_price]
    );
    
    console.log("✅ Part added:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error adding part:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE part
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { part_name, brand, stock, buy_price, sell_price } = req.body;
  
  try {
    const checkExist = await pool.query("SELECT * FROM parts WHERE part_id = $1", [id]);
    if (checkExist.rows.length === 0) {
      return res.status(404).json({ message: "Part not found" });
    }
    
    await pool.query(
      'UPDATE parts SET part_name=$1, brand=$2, stock=$3, buy_price=$4, sell_price=$5 WHERE part_id=$6',
      [part_name, brand, stock, buy_price, sell_price, id]
    );
    
    const updated = await pool.query('SELECT * FROM parts WHERE part_id = $1', [id]);
    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE part
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const checkExist = await pool.query("SELECT * FROM parts WHERE part_id = $1", [id]);
    if (checkExist.rows.length === 0) {
      return res.status(404).json({ message: "Part not found" });
    }
    
    await pool.query('DELETE FROM parts WHERE part_id = $1', [id]);
    res.json({ message: 'Part deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;