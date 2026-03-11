const express = require('express');
const router = express.Router();
const pool = require('../db'); // نفترض أنك هنا تستخدم pg Pool
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET all error logs (Super Admin only) مع دعم pagination / split
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Access denied. Super Admins only.' });
        }

        // split/pagination: ?page=1&limit=50
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const { rows: logs } = await pool.query(
            `SELECT e.*, u.full_name AS user_name, u.email AS user_email
             FROM error_logs e
             LEFT JOIN users u ON e.user_id = u.id
             ORDER BY e.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        res.json({
            page,
            limit,
            count: logs.length,
            logs
        });
    } catch (err) {
        console.error("Error fetching logs:", err);
        res.status(500).json({ error: err.message });
    }
});

// POST create an error log
router.post('/', async (req, res) => {
    try {
        const { message, stack_trace, source, user_id } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Error message is required.' });
        }

        const id = uuidv4();

        await pool.query(
            `INSERT INTO error_logs (id, message, stack_trace, source, user_id, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [id, message, stack_trace || null, source || 'frontend', user_id || null]
        );

        res.status(201).json({ success: true });
    } catch (err) {
        console.error("Failed to write to error_logs:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
