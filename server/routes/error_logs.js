const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Get all error logs (Super Admin only)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Access denied. Super Admins only.' });
        }

        const logs = await db.query(`
            SELECT e.*, u.full_name as user_name, u.email as user_email 
            FROM error_logs e 
            LEFT JOIN users u ON e.user_id = u.id 
            ORDER BY e.created_at DESC
        `);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create an error log
router.post('/', async (req, res) => {
    try {
        const { message, stack_trace, source, user_id } = req.body;
        const id = uuidv4();

        await db.runAsync(
            'INSERT INTO error_logs (id, message, stack_trace, source, user_id) VALUES (?, ?, ?, ?, ?)',
            [id, message, stack_trace || null, source || 'frontend', user_id || null]
        );

        res.status(201).json({ success: true });
    } catch (err) {
        console.error("Failed to write to error_logs:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
