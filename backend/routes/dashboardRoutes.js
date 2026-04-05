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
      start = startDate.toISOString().split('T')[0];
      end = endDate.toISOString().split('T')[0];
    }

    // Stats
    const [
      totalCustomersResult,
      totalVehiclesResult,
      totalEmployeesResult,
      totalRevenueResult,
      pendingInvoicesResult,
      activeServicesResult,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM customers"),
      pool.query("SELECT COUNT(*) FROM vehicles"),
      pool.query("SELECT COUNT(*) FROM employees"),
      pool.query(
        "SELECT COALESCE(SUM(paid_amount), 0) FROM invoices WHERE date BETWEEN $1 AND $2",
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
      totalCustomers: parseInt(totalCustomersResult.rows[0].count),
      totalVehicles: parseInt(totalVehiclesResult.rows[0].count),
      activeServices: parseInt(activeServicesResult.rows[0].count),
      totalEmployees: parseInt(totalEmployeesResult.rows[0].count),
      totalRevenue: parseFloat(totalRevenueResult.rows[0].coalesce),
      pendingInvoices: parseInt(pendingInvoicesResult.rows[0].count),
    };

    // Revenue trend
    const revenueTrend = await pool.query(
      `
      SELECT 
        TO_CHAR(date, 'Mon DD') as name,
        COALESCE(SUM(paid_amount), 0) as revenue
      FROM invoices
      WHERE date BETWEEN $1 AND $2
      GROUP BY date
      ORDER BY date ASC
      `,
      [start, end]
    );

    // Service status
    const serviceStatus = await pool.query(
      `
      SELECT status, COUNT(*) as value
      FROM services
      WHERE check_in_date BETWEEN $1 AND $2
      GROUP BY status
      `,
      [start, end]
    );
    const serviceStatusData = serviceStatus.rows.map(row => ({
      name: row.status === 'pending' ? 'Pending' : row.status === 'in_progress' ? 'In Progress' : 'Completed',
      value: parseInt(row.value)
    }));

    // Top customers
    const topCustomers = await pool.query(
      `
      SELECT 
        c.name,
        COALESCE(SUM(i.paid_amount), 0) as amount
      FROM invoices i
      JOIN invoice_services inv_s ON i.invoice_id = inv_s.invoice_id
      JOIN services s ON inv_s.service_id = s.service_id
      JOIN vehicles v ON s.vehicle_id = v.vehicle_id
      JOIN customers c ON v.customer_id = c.customer_id
      WHERE i.date BETWEEN $1 AND $2
      GROUP BY c.customer_id, c.name
      ORDER BY amount DESC
      LIMIT 5
      `,
      [start, end]
    );
    const topCustomersData = topCustomers.rows.map(row => ({
      name: row.name.length > 15 ? row.name.substring(0, 12) + '...' : row.name,
      amount: parseFloat(row.amount)
    }));

    // Popular services
    const popularServices = await pool.query(
      `
      SELECT 
        COALESCE(p.problem_name, 'Unknown Problem') as name,
        COUNT(s.service_id) as count
      FROM services s
      LEFT JOIN problems p ON s.problem_id = p.problem_id
      WHERE s.check_in_date BETWEEN $1 AND $2
      GROUP BY p.problem_id, p.problem_name
      ORDER BY count DESC
      LIMIT 5
      `,
      [start, end]
    );
    const popularServicesData = popularServices.rows.map(row => ({
      name: row.name.length > 20 ? row.name.substring(0, 17) + '...' : row.name,
      count: parseInt(row.count)
    }));

    // Recent services
    const recentServices = await pool.query(
      `
      SELECT 
        s.service_id as id,
        'service' as type,
        CONCAT('Service for ', v.plate_number, ' - ', COALESCE(p.problem_name, 'Unknown')) as description,
        COALESCE(s.created_at, s.check_in_date) as time,
        NULL as amount,
        s.status
      FROM services s
      LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
      LEFT JOIN problems p ON s.problem_id = p.problem_id
      WHERE s.check_in_date BETWEEN $1 AND $2
      ORDER BY COALESCE(s.created_at, s.check_in_date) DESC
      LIMIT 5
      `,
      [start, end]
    );

    // Recent invoices – using created_at for real time
    const recentInvoices = await pool.query(
      `
      SELECT 
        i.invoice_id as id,
        'invoice' as type,
        CONCAT('Invoice #', i.invoice_id, ' - ', i.payment_method) as description,
        i.created_at as time,
        i.paid_amount as amount,
        CASE WHEN i.paid_amount < i.total_cost THEN 'pending' ELSE 'paid' END as status
      FROM invoices i
      WHERE i.date BETWEEN $1 AND $2
      ORDER BY i.created_at DESC
      LIMIT 5
      `,
      [start, end]
    );

    let recentActivities = [...recentServices.rows, ...recentInvoices.rows];
    recentActivities.sort((a, b) => new Date(b.time) - new Date(a.time));
    recentActivities = recentActivities.slice(0, 10).map(act => ({
      id: act.id,
      type: act.type,
      description: act.description,
      time: act.time,
      amount: act.amount ? parseFloat(act.amount) : null,
      status: act.status
    }));

    // Low stock items
    const lowStock = await pool.query(`
      SELECT part_name, brand, stock
      FROM parts
      WHERE stock <= 5
      ORDER BY stock ASC
      LIMIT 10
    `);
    const lowStockItems = lowStock.rows;

    res.json({
      stats,
      revenueData: revenueTrend.rows,
      serviceStatusData,
      topCustomersData,
      popularServicesData,
      recentActivities,
      lowStockItems
    });
  } catch (error) {
    console.error("Dashboard data error:", error);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

module.exports = router;