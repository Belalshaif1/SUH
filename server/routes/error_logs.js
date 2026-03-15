const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET all error logs (Super Admin only) مع دعم pagination
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Access denied. Super Admins only.' });
        }




        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const logs = await db.query(
            `SELECT e.*, u.full_name AS user_name, u.email AS user_email
             FROM error_logs e
             LEFT JOIN users u ON e.user_id::TEXT = u.id::TEXT
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
        console.error('Error fetching logs:', err);
        res.status(500).json({ error: 'Internal server error' });
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
        await db.runAsync(
            'INSERT INTO error_logs (id, message, stack_trace, source, user_id, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
            [id, message, stack_trace || null, source || 'frontend', user_id || null]
        );

        res.status(201).json({ success: true });
    } catch (err) {
        console.error('Failed to write to error_logs:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
