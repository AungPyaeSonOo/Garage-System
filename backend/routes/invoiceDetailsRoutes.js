const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// POST: Add a part to an invoice (deducts stock)
router.post("/", async (req, res) => {
  const { invoice_id, part_id, quantity, price } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Check if part exists and has enough stock
    const partCheck = await client.query(
      `SELECT stock FROM parts WHERE part_id = $1`,
      [part_id]
    );
    if (partCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Part not found" });
    }
    const currentStock = partCheck.rows[0].stock;
    if (currentStock < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Insufficient stock. Available: ${currentStock}, requested: ${quantity}`
      });
    }

    // 2. Insert invoice detail
    const result = await client.query(
      `INSERT INTO invoice_details (invoice_id, part_id, quantity, price)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [invoice_id, part_id, quantity, price]
    );

    // 3. Deduct stock
    await client.query(
      `UPDATE parts SET stock = stock - $1 WHERE part_id = $2`,
      [quantity, part_id]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error adding part to invoice:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET all parts for an invoice
router.get("/invoice/:invoiceId", async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const result = await pool.query(
      `SELECT * FROM invoice_details WHERE invoice_id = $1`,
      [invoiceId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE a single part from an invoice (restores stock)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const partDetail = await client.query(
      `SELECT part_id, quantity FROM invoice_details WHERE detail_id = $1`,
      [id]
    );
    if (partDetail.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Invoice detail not found" });
    }
    const { part_id, quantity } = partDetail.rows[0];

    await client.query('DELETE FROM invoice_details WHERE detail_id = $1', [id]);

    // Restore stock
    await client.query(
      `UPDATE parts SET stock = stock + $1 WHERE part_id = $2`,
      [quantity, part_id]
    );

    await client.query('COMMIT');
    res.json({ message: "Part removed from invoice and stock restored" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;