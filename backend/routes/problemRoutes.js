// routes/problemRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// GET all problems
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT problem_id, problem_name, problem_fee, created_at, updated_at FROM problems ORDER BY problem_id"
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch problems" });
    }
});

// GET a single problem by ID
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "SELECT problem_id, problem_name, problem_fee, created_at, updated_at FROM problems WHERE problem_id = $1",
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Problem not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch problem" });
    }
});

// POST create a new problem
router.post("/", async (req, res) => {
    const { problem_name, problem_fee } = req.body;
    if (!problem_name || problem_fee === undefined) {
        return res.status(400).json({ error: "problem_name and problem_fee are required" });
    }
    try {
        const result = await pool.query(
            "INSERT INTO problems (problem_name, problem_fee) VALUES ($1, $2) RETURNING *",
            [problem_name, problem_fee]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // unique violation
            return res.status(409).json({ error: "Problem name already exists" });
        }
        console.error(err);
        res.status(500).json({ error: "Failed to create problem" });
    }
});

// PUT update a problem
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { problem_name, problem_fee } = req.body;
    if (!problem_name || problem_fee === undefined) {
        return res.status(400).json({ error: "problem_name and problem_fee are required" });
    }
    try {
        const result = await pool.query(
            `UPDATE problems 
             SET problem_name = $1, problem_fee = $2, updated_at = CURRENT_TIMESTAMP
             WHERE problem_id = $3
             RETURNING *`,
            [problem_name, problem_fee, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Problem not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: "Problem name already exists" });
        }
        console.error(err);
        res.status(500).json({ error: "Failed to update problem" });
    }
});

// DELETE a problem
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        // Check if problem is referenced in services
        const checkRef = await pool.query(
            "SELECT 1 FROM services WHERE problem_id = $1 LIMIT 1",
            [id]
        );
        if (checkRef.rows.length > 0) {
            return res.status(409).json({ error: "Cannot delete problem because it is used in services" });
        }

        const result = await pool.query(
            "DELETE FROM problems WHERE problem_id = $1 RETURNING *",
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Problem not found" });
        }
        res.json({ message: "Problem deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete problem" });
    }
});

module.exports = router;