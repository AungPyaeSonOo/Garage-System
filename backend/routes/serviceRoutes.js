const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// GET all services (with employee details) – optionally filter available services
router.get("/", async (req, res) => {
  try {
    const { available } = req.query;

    let query;
    let params = [];

    if (available === 'true') {
      // Return only services that are NOT in any invoice
      query = `
        SELECT s.service_id, s.vehicle_id, s.problem_id, p.problem_name, p.problem_fee,
               s.status, s.check_in_date, s.check_out_date, s.employee_id,
               e.name as employee_name, e.position as employee_position,
               v.plate_number, v.car_model, c.name as customer_name 
        FROM services s
        LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
        LEFT JOIN customers c ON v.customer_id = c.customer_id
        LEFT JOIN problems p ON s.problem_id = p.problem_id
        LEFT JOIN employees e ON s.employee_id = e.employee_id
        WHERE NOT EXISTS (
          SELECT 1 FROM invoice_services inv_s
          WHERE inv_s.service_id = s.service_id
        )
        ORDER BY s.service_id DESC
      `;
    } else {
      // Return all services (default)
      query = `
        SELECT s.service_id, s.vehicle_id, s.problem_id, p.problem_name, p.problem_fee,
               s.status, s.check_in_date, s.check_out_date, s.employee_id,
               e.name as employee_name, e.position as employee_position,
               v.plate_number, v.car_model, c.name as customer_name 
        FROM services s
        LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
        LEFT JOIN customers c ON v.customer_id = c.customer_id
        LEFT JOIN problems p ON s.problem_id = p.problem_id
        LEFT JOIN employees e ON s.employee_id = e.employee_id
        ORDER BY s.service_id DESC
      `;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET services by vehicle ID (with employee)
router.get("/vehicle/:vehicleId", async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const result = await pool.query(
      `SELECT s.service_id, s.vehicle_id, s.problem_id, p.problem_name, p.problem_fee,
              s.status, s.check_in_date, s.check_out_date, s.employee_id,
              e.name as employee_name,
              v.plate_number, v.car_model 
       FROM services s
       LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
       LEFT JOIN problems p ON s.problem_id = p.problem_id
       LEFT JOIN employees e ON s.employee_id = e.employee_id
       WHERE s.vehicle_id = $1 
       ORDER BY s.check_in_date DESC`,
      [vehicleId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET single service
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT s.*, p.problem_name, p.problem_fee, e.name as employee_name
       FROM services s
       LEFT JOIN problems p ON s.problem_id = p.problem_id
       LEFT JOIN employees e ON s.employee_id = e.employee_id
       WHERE s.service_id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// ADD service (with employee_id)
router.post("/", async (req, res) => {
  const { vehicle_id, problem_id, status, check_in_date, check_out_date, employee_id } = req.body;

  try {
    const vehicleCheck = await pool.query("SELECT * FROM vehicles WHERE vehicle_id = $1", [vehicle_id]);
    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: "Vehicle not found" });
    }
    if (problem_id) {
      const problemCheck = await pool.query("SELECT * FROM problems WHERE problem_id = $1", [problem_id]);
      if (problemCheck.rows.length === 0) {
        return res.status(404).json({ error: "Problem not found" });
      }
    }
    if (employee_id) {
      const empCheck = await pool.query("SELECT * FROM employees WHERE employee_id = $1", [employee_id]);
      if (empCheck.rows.length === 0) {
        return res.status(404).json({ error: "Employee not found" });
      }
    }

    const result = await pool.query(
      `INSERT INTO services (vehicle_id, problem_id, status, check_in_date, check_out_date, employee_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [vehicle_id, problem_id || null, status, check_in_date, check_out_date || null, employee_id || null]
    );
    res.status(201).json({ message: 'Service created successfully', service: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE service (with employee_id)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { vehicle_id, problem_id, status, check_in_date, check_out_date, employee_id } = req.body;

  try {
    const checkExist = await pool.query("SELECT * FROM services WHERE service_id = $1", [id]);
    if (checkExist.rows.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }
    if (vehicle_id) {
      const vehicleCheck = await pool.query("SELECT * FROM vehicles WHERE vehicle_id = $1", [vehicle_id]);
      if (vehicleCheck.rows.length === 0) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
    }
    if (problem_id) {
      const problemCheck = await pool.query("SELECT * FROM problems WHERE problem_id = $1", [problem_id]);
      if (problemCheck.rows.length === 0) {
        return res.status(404).json({ error: "Problem not found" });
      }
    }
    if (employee_id) {
      const empCheck = await pool.query("SELECT * FROM employees WHERE employee_id = $1", [employee_id]);
      if (empCheck.rows.length === 0) {
        return res.status(404).json({ error: "Employee not found" });
      }
    }

    await pool.query(
      `UPDATE services 
       SET vehicle_id = $1, problem_id = $2, status = $3, check_in_date = $4, check_out_date = $5, employee_id = $6
       WHERE service_id = $7`,
      [vehicle_id, problem_id || null, status, check_in_date, check_out_date || null, employee_id || null, id]
    );
    res.json({ message: 'Service updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE service
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const checkExist = await pool.query("SELECT * FROM services WHERE service_id = $1", [id]);
    if (checkExist.rows.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }
    await pool.query('DELETE FROM services WHERE service_id = $1', [id]);
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// Employee performance for a given month (with optional employee filter)
router.get("/employee-performance/:year/:month", async (req, res) => {
  const { year, month } = req.params;
  const employeeId = req.query.employee;

  console.log(`Performance request: year=${year}, month=${month}, employee=${employeeId}`);

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;

  try {
    let query, params;

    if (employeeId) {
      query = `
        SELECT 
          e.employee_id,
          e.name,
          e.position,
          COUNT(s.service_id) AS total_services,
          COUNT(CASE WHEN s.status = 'completed' THEN 1 END) AS completed_services,
          COALESCE(
            json_agg(
              json_build_object(
                'service_id', s.service_id,
                'vehicle_id', s.vehicle_id,
                'plate_number', v.plate_number,
                'problem_name', p.problem_name,
                'status', s.status,
                'check_in_date', s.check_in_date,
                'check_out_date', s.check_out_date
              ) ORDER BY s.check_in_date DESC
            ) FILTER (WHERE s.service_id IS NOT NULL),
            '[]'::json
          ) AS services
        FROM employees e
        LEFT JOIN services s ON e.employee_id = s.employee_id
          AND s.check_in_date >= $1::date
          AND s.check_in_date < ($1::date + interval '1 month')
        LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
        LEFT JOIN problems p ON s.problem_id = p.problem_id
        WHERE e.employee_id = $2
        GROUP BY e.employee_id
        ORDER BY e.name
      `;
      params = [startDate, employeeId];
    } else {
      query = `
        SELECT 
          e.employee_id,
          e.name,
          e.position,
          COUNT(s.service_id) AS total_services,
          COUNT(CASE WHEN s.status = 'completed' THEN 1 END) AS completed_services,
          COALESCE(
            json_agg(
              json_build_object(
                'service_id', s.service_id,
                'vehicle_id', s.vehicle_id,
                'plate_number', v.plate_number,
                'problem_name', p.problem_name,
                'status', s.status,
                'check_in_date', s.check_in_date,
                'check_out_date', s.check_out_date
              ) ORDER BY s.check_in_date DESC
            ) FILTER (WHERE s.service_id IS NOT NULL),
            '[]'::json
          ) AS services
        FROM employees e
        LEFT JOIN services s ON e.employee_id = s.employee_id
          AND s.check_in_date >= $1::date
          AND s.check_in_date < ($1::date + interval '1 month')
        LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
        LEFT JOIN problems p ON s.problem_id = p.problem_id
        GROUP BY e.employee_id
        ORDER BY e.name
      `;
      params = [startDate];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Error in employee-performance query:", err.message);
    console.error("Query:", query);
    console.error("Params:", params);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;