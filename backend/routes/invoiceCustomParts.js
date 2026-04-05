const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// POST: Add a custom part to an invoice
router.post("/", async (req, res) => {
  const { invoice_id, part_name, price, quantity } = req.body;
  if (!invoice_id || !part_name || price === undefined || !quantity) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const result = await pool.query(
      `INSERT INTO invoice_custom_parts (invoice_id, part_name, price, quantity)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [invoice_id, part_name, price, quantity]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET: All custom parts for an invoice
router.get("/invoice/:invoiceId", async (req, res) => {
  const { invoiceId } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM invoice_custom_parts WHERE invoice_id = $1`,
      [invoiceId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Remove a single custom part by its ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM invoice_custom_parts WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Custom part not found" });
    }
    res.json({ message: "Custom part deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Remove all custom parts for an invoice (used when updating an invoice)
router.delete("/invoice/:invoiceId", async (req, res) => {
  const { invoiceId } = req.params;
  try {
    await pool.query(`DELETE FROM invoice_custom_parts WHERE invoice_id = $1`, [invoiceId]);
    res.json({ message: "All custom parts for invoice deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;