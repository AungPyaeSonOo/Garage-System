const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// GET all vehicles with customer name
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, c.name as customer_name, c.phone as customer_phone
      FROM vehicles v
      LEFT JOIN customers c ON v.customer_id = c.customer_id
      ORDER BY v.vehicle_id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET single vehicle
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT v.*, c.name as customer_name FROM vehicles v LEFT JOIN customers c ON v.customer_id = c.customer_id WHERE v.vehicle_id = $1', 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET vehicles by customer ID
router.get("/customer/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const result = await pool.query(
      'SELECT * FROM vehicles WHERE customer_id = $1 ORDER BY vehicle_id DESC',
      [customerId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// ADD vehicle
router.post("/", async (req, res) => {
  const { customer_id, plate_number, car_model, engine_number, year } = req.body;
  
  // Validation
  if (!customer_id || !plate_number || !car_model) {
    return res.status(400).json({ error: "Customer ID, plate number and car model are required" });
  }
  
  try {
    // Check if customer exists
    const customerCheck = await pool.query("SELECT * FROM customers WHERE customer_id = $1", [customer_id]);
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }
    
    const result = await pool.query(
      'INSERT INTO vehicles (customer_id, plate_number, car_model, engine_number, year) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [customer_id, plate_number, car_model, engine_number, year]
    );
    
    res.status(201).json({ 
      message: 'Vehicle created successfully', 
      vehicle: result.rows[0]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE vehicle
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { customer_id, plate_number, car_model, engine_number, year } = req.body;
  
  try {
    // Check if vehicle exists
    const checkExist = await pool.query("SELECT * FROM vehicles WHERE vehicle_id = $1", [id]);
    if (checkExist.rows.length === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    
    await pool.query(
      'UPDATE vehicles SET customer_id=$1, plate_number=$2, car_model=$3, engine_number=$4, year=$5 WHERE vehicle_id=$6',
      [customer_id, plate_number, car_model, engine_number, year, id]
    );
    
    res.json({ message: 'Vehicle updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE vehicle
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if vehicle exists
    const checkExist = await pool.query("SELECT * FROM vehicles WHERE vehicle_id = $1", [id]);
    if (checkExist.rows.length === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    
    await pool.query('DELETE FROM vehicles WHERE vehicle_id = $1', [id]);
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;