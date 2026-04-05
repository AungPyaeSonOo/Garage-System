// routes/salesInvoiceRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

console.log("✅ salesInvoiceRoutes loaded");


// GET all sales invoices (with customer name and plate number)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT si.*, c.name as customer_name, v.plate_number
      FROM sales_invoices si
      LEFT JOIN customers c ON si.customer_id = c.customer_id
      LEFT JOIN vehicles v ON si.vehicle_id = v.vehicle_id
      ORDER BY si.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET single sales invoice (with all details)
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT si.*, c.name as customer_name, v.plate_number, v.car_model, v.engine_number, v.year
      FROM sales_invoices si
      LEFT JOIN customers c ON si.customer_id = c.customer_id
      LEFT JOIN vehicles v ON si.vehicle_id = v.vehicle_id
      WHERE si.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const invoice = result.rows[0];
    // Parse JSON fields if they are stored as strings
    invoice.services = invoice.services ? JSON.parse(invoice.services) : [];
    invoice.shop_parts = invoice.shop_parts ? JSON.parse(invoice.shop_parts) : [];
    invoice.external_parts = invoice.external_parts ? JSON.parse(invoice.external_parts) : [];

    res.json(invoice);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// CREATE a new sales invoice
router.post("/", async (req, res) => {
  const {
    customer_id,
    vehicle_id,
    total_cost,
    paid_amount,
    payment_method,
    date,
    notes,
    service_fee,
    external_parts,
    shop_parts,
    services,
    service_status,
    invoice_id   // optional, for linking to main invoice later
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO sales_invoices 
       (customer_id, vehicle_id, total_cost, paid_amount, payment_method, date, notes, service_fee, external_parts, shop_parts, services, service_status, invoice_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        customer_id,
        vehicle_id,
        total_cost,
        paid_amount,
        payment_method,
        date,
        notes,
        service_fee,
        JSON.stringify(external_parts || []),
        JSON.stringify(shop_parts || []),
        JSON.stringify(services || []),
        service_status || 'pending',
        invoice_id || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE an existing sales invoice
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    customer_id,
    vehicle_id,
    total_cost,
    paid_amount,
    payment_method,
    date,
    notes,
    service_fee,
    external_parts,
    shop_parts,
    services,
    service_status,
    invoice_id
  } = req.body;

  try {
    // Check if invoice exists
    const check = await pool.query("SELECT id FROM sales_invoices WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Update sales_invoices
    await pool.query(
      `UPDATE sales_invoices SET
        customer_id = $1,
        vehicle_id = $2,
        total_cost = $3,
        paid_amount = $4,
        payment_method = $5,
        date = $6,
        notes = $7,
        service_fee = $8,
        external_parts = $9,
        shop_parts = $10,
        services = $11,
        service_status = $12,
        invoice_id = $13
      WHERE id = $14`,
      [
        customer_id,
        vehicle_id,
        total_cost,
        paid_amount,
        payment_method,
        date,
        notes,
        service_fee,
        JSON.stringify(external_parts || []),
        JSON.stringify(shop_parts || []),
        JSON.stringify(services || []),
        service_status,
        invoice_id,
        id
      ]
    );

    // If service_status changed, update the corresponding service record
    if (service_status) {
      await pool.query(
        `UPDATE services SET status = $1, check_out_date = CASE WHEN $1 = 'completed' THEN $2 ELSE NULL END
         WHERE vehicle_id = $3 AND check_in_date = $2
         ORDER BY service_id DESC LIMIT 1`,
        [service_status, date, vehicle_id]
      );
    }

    const updated = await pool.query("SELECT * FROM sales_invoices WHERE id = $1", [id]);
    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE sales invoice and all related records
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Get the sales invoice details
    const salesInvoice = await pool.query(`
      SELECT invoice_id, vehicle_id, date
      FROM sales_invoices
      WHERE id = $1
    `, [id]);

    if (salesInvoice.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const { invoice_id, vehicle_id, date } = salesInvoice.rows[0];

    // Delete related invoice_services and invoice_details (if any)
    if (invoice_id) {
      await pool.query("DELETE FROM invoice_services WHERE invoice_id = $1", [invoice_id]);
      await pool.query("DELETE FROM invoice_details WHERE invoice_id = $1", [invoice_id]);
      // Delete main invoice
      await pool.query("DELETE FROM invoices WHERE invoice_id = $1", [invoice_id]);
    }

    // Delete the service record created for this invoice (assumes one service per invoice)
    if (vehicle_id && date) {
      await pool.query(
        "DELETE FROM services WHERE vehicle_id = $1 AND check_in_date = $2",
        [vehicle_id, date]
      );
    }

    // Finally delete the sales invoice
    await pool.query("DELETE FROM sales_invoices WHERE id = $1", [id]);

    res.json({ message: "Invoice and all related data deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
  console.log("🔥 DELETE handler hit for ID:", req.params.id);
});

module.exports = router;