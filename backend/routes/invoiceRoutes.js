const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// GET all invoices
router.get("/", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM invoices ORDER BY invoice_id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET invoice by service ID
router.get("/service/:serviceId", async (req, res) => {
  try {
    const { serviceId } = req.params;
    const result = await pool.query(
      `SELECT i.* 
       FROM invoices i
       JOIN invoice_services inv_s ON i.invoice_id = inv_s.invoice_id
       WHERE inv_s.service_id = $1`,
      [serviceId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No invoice found for this service" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET single invoice
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM invoices WHERE invoice_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// CREATE invoice (basic info only)
router.post("/", async (req, res) => {
  const { total_cost, paid_amount, payment_method, date } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO invoices (total_cost, paid_amount, payment_method, date) VALUES ($1, $2, $3, $4) RETURNING *',
      [total_cost, paid_amount, payment_method, date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// FULL UPDATE: replace all services, regular parts, and custom parts of an invoice
router.put("/:id/full", async (req, res) => {
  const { id } = req.params;
  const { total_cost, paid_amount, payment_method, date, services, parts, customParts } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Update invoice basic info
    const updateInvoice = await client.query(
      `UPDATE invoices 
       SET total_cost = $1, paid_amount = $2, payment_method = $3, date = $4 
       WHERE invoice_id = $5 RETURNING *`,
      [total_cost, paid_amount, payment_method, date, id]
    );
    if (updateInvoice.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Invoice not found" });
    }

    // 1. Get existing regular parts to restore stock later
    const existingParts = await client.query(
      `SELECT part_id, quantity FROM invoice_details WHERE invoice_id = $1`,
      [id]
    );

    // 2. Restore stock for the regular parts that are being removed
    for (const part of existingParts.rows) {
      await client.query(
        `UPDATE parts SET stock = stock + $1 WHERE part_id = $2`,
        [part.quantity, part.part_id]
      );
    }

    // 3. Delete old relations (services, regular parts, custom parts)
    await client.query('DELETE FROM invoice_services WHERE invoice_id = $1', [id]);
    await client.query('DELETE FROM invoice_details WHERE invoice_id = $1', [id]);
    await client.query('DELETE FROM invoice_custom_parts WHERE invoice_id = $1', [id]);

    // 4. Insert new services (no stock impact)
    for (const svc of services) {
      await client.query(
        `INSERT INTO invoice_services (invoice_id, service_id, service_fee) 
         VALUES ($1, $2, $3)`,
        [id, svc.service_id, svc.problem_fee]
      );
    }

    // 5. Validate stock for new regular parts (check availability)
    for (const part of parts) {
      const stockCheck = await client.query(
        `SELECT stock FROM parts WHERE part_id = $1`,
        [part.part_id]
      );
      if (stockCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Part ${part.part_id} not found` });
      }
      if (stockCheck.rows[0].stock < part.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: `Insufficient stock for part ID ${part.part_id}. Available: ${stockCheck.rows[0].stock}, requested: ${part.quantity}` 
        });
      }
    }

    // 6. Insert new regular parts and deduct stock
    for (const part of parts) {
      await client.query(
        `INSERT INTO invoice_details (invoice_id, part_id, quantity, price) 
         VALUES ($1, $2, $3, $4)`,
        [id, part.part_id, part.quantity, part.price]
      );
      await client.query(
        `UPDATE parts SET stock = stock - $1 WHERE part_id = $2`,
        [part.quantity, part.part_id]
      );
    }

    // 7. Insert new custom parts (no stock impact)
    if (customParts && customParts.length) {
      for (const cp of customParts) {
        await client.query(
          `INSERT INTO invoice_custom_parts (invoice_id, part_name, price, quantity)
           VALUES ($1, $2, $3, $4)`,
          [id, cp.part_name, cp.price, cp.quantity]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Invoice updated successfully', invoice: updateInvoice.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PARTIAL UPDATE (basic info only)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { total_cost, paid_amount, payment_method, date } = req.body;
  try {
    const checkExist = await pool.query("SELECT * FROM invoices WHERE invoice_id = $1", [id]);
    if (checkExist.rows.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    await pool.query(
      'UPDATE invoices SET total_cost=$1, paid_amount=$2, payment_method=$3, date=$4 WHERE invoice_id=$5',
      [total_cost, paid_amount, payment_method, date, id]
    );
    const updated = await pool.query('SELECT * FROM invoices WHERE invoice_id = $1', [id]);
    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE invoice (cascades manually, restores stock, deletes custom parts)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get all regular parts in this invoice to restore stock
    const parts = await client.query(
      `SELECT part_id, quantity FROM invoice_details WHERE invoice_id = $1`,
      [id]
    );

    // Delete custom parts
    await client.query('DELETE FROM invoice_custom_parts WHERE invoice_id = $1', [id]);
    // Delete invoice details (regular parts)
    await client.query('DELETE FROM invoice_details WHERE invoice_id = $1', [id]);
    // Delete invoice services
    await client.query('DELETE FROM invoice_services WHERE invoice_id = $1', [id]);
    // Delete the invoice itself
    const result = await client.query('DELETE FROM invoices WHERE invoice_id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Restore stock for each regular part
    for (const part of parts.rows) {
      await client.query(
        `UPDATE parts SET stock = stock + $1 WHERE part_id = $2`,
        [part.quantity, part.part_id]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Invoice and all related records deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;