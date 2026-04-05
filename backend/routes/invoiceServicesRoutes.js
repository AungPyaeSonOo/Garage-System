// routes/invoiceServicesRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// GET all invoice services
router.get("/", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM invoice_services ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET services by invoice ID – now includes problem_name
router.get("/invoice/:invoiceId", async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const result = await pool.query(
      `SELECT 
        is_.*,
        p.problem_name
       FROM invoice_services is_
       LEFT JOIN services s ON is_.service_id = s.service_id
       LEFT JOIN problems p ON s.problem_id = p.problem_id
       WHERE is_.invoice_id = $1`,
      [invoiceId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// ADD invoice service
router.post("/", async (req, res) => {
  const { invoice_id, service_id, service_fee } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO invoice_services (invoice_id, service_id, service_fee) VALUES ($1, $2, $3) RETURNING *',
      [invoice_id, service_id, service_fee]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE invoice service
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM invoice_services WHERE id = $1', [id]);
    res.json({ message: 'Invoice service deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;