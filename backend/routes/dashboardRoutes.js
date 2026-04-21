const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

router.get("/", async (req, res) => {
  try {
    let { start, end } = req.query;

    if (!start || !end) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);

      start = startDate.toISOString().split("T")[0];
      end = endDate.toISOString().split("T")[0];
    }

    // ---------------- STATS ----------------
    const [
      customers,
      vehicles,
      employees,
      revenue,
      pending,
      active
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM customers"),
      pool.query("SELECT COUNT(*) FROM vehicles"),
      pool.query("SELECT COUNT(*) FROM employees"),

      pool.query(
        "SELECT COALESCE(SUM(paid_amount),0) AS total FROM invoices WHERE date BETWEEN $1 AND $2",
        [start, end]
      ),

      pool.query(
        "SELECT COUNT(*) FROM invoices WHERE paid_amount < total_cost AND date BETWEEN $1 AND $2",
        [start, end]
      ),

      pool.query(
        "SELECT COUNT(*) FROM services WHERE status != 'completed' AND check_in_date BETWEEN $1 AND $2",
        [start, end]
      ),
    ]);

    const stats = {
      totalCustomers: Number(customers.rows[0].count),
      totalVehicles: Number(vehicles.rows[0].count),
      totalEmployees: Number(employees.rows[0].count),
      totalRevenue: Number(revenue.rows[0].total),
      pendingInvoices: Number(pending.rows[0].count),
      activeServices: Number(active.rows[0].count),
    };

    // ---------------- REVENUE ----------------
    const revenueTrend = await pool.query(
      `
      SELECT 
        TO_CHAR(date, 'Mon DD') AS name,
        COALESCE(SUM(paid_amount),0) AS revenue
      FROM invoices
      WHERE date BETWEEN $1 AND $2
      GROUP BY date
      ORDER BY date
      `,
      [start, end]
    );

    // ---------------- SERVICE STATUS ----------------
    const serviceStatus = await pool.query(
      `
      SELECT status, COUNT(*) AS value
      FROM services
      WHERE check_in_date BETWEEN $1 AND $2
      GROUP BY status
      `,
      [start, end]
    );

    const serviceStatusData = serviceStatus.rows.map(r => ({
      name:
        r.status === "pending"
          ? "Pending"
          : r.status === "in_progress"
          ? "In Progress"
          : "Completed",
      value: Number(r.value),
    }));

    // ---------------- TOP CUSTOMERS ----------------
    const topCustomers = await pool.query(
      `
      SELECT c.name, COALESCE(SUM(i.paid_amount),0) AS amount
      FROM invoices i
      JOIN invoice_services inv_s ON i.invoice_id = inv_s.invoice_id
      JOIN services s ON inv_s.service_id = s.service_id
      JOIN vehicles v ON s.vehicle_id = v.vehicle_id
      JOIN customers c ON v.customer_id = c.customer_id
      WHERE i.date BETWEEN $1 AND $2
      GROUP BY c.name
      ORDER BY amount DESC
      LIMIT 5
      `,
      [start, end]
    );

    const topCustomersData = topCustomers.rows.map(r => ({
      name: r.name,
      amount: Number(r.amount),
    }));

    // ---------------- POPULAR SERVICES ----------------
    const popularServices = await pool.query(
      `
      SELECT 
        COALESCE(p.problem_name,'Unknown') AS name,
        COUNT(*) AS count
      FROM services s
      LEFT JOIN problems p ON s.problem_id = p.problem_id
      WHERE s.check_in_date BETWEEN $1 AND $2
      GROUP BY p.problem_name
      ORDER BY count DESC
      LIMIT 5
      `,
      [start, end]
    );

    const popularServicesData = popularServices.rows.map(r => ({
      name: r.name,
      count: Number(r.count),
    }));

    // ---------------- RECENT ACTIVITIES ----------------
    const recent = await pool.query(
      `
      SELECT 
        i.invoice_id AS id,
        'invoice' AS type,
        CONCAT('Invoice #', i.invoice_id) AS description,
        i.created_at AS time,
        i.paid_amount AS amount,
        CASE 
          WHEN i.paid_amount < i.total_cost THEN 'pending'
          ELSE 'paid'
        END AS status
      FROM invoices i
      ORDER BY i.created_at DESC
      LIMIT 10
      `
    );

    // ---------------- LOW STOCK ----------------
    const lowStock = await pool.query(
      `
      SELECT part_name, brand, stock
      FROM parts
      WHERE stock <= 5
      ORDER BY stock ASC
      LIMIT 10
      `
    );

    res.json({
      stats,
      revenueData: revenueTrend.rows,
      serviceStatusData,
      topCustomersData,
      popularServicesData,
      recentActivities: recent.rows,
      lowStockItems: lowStock.rows,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Dashboard failed" });
  }
});

module.exports = router;