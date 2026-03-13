const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const { authenticateToken, checkPermission } = require('../middleware/auth');

// Get all fees
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT f.*, 
                   d.name_ar as department_name_ar, d.name_en as department_name_en, 
                   c.name_ar as college_name_ar, c.name_en as college_name_en 
            FROM fees f 
            LEFT JOIN departments d ON f.department_id = d.id 
            LEFT JOIN colleges c ON d.college_id = c.id 
            ORDER BY f.created_at DESC
        `;
        const feesList = await db.query(query);

        const formatted = feesList.map(f => ({
            ...f,
            departments: f.department_name_ar ? {
                name_ar: f.department_name_ar,
                name_en: f.department_name_en,
                colleges: f.college_name_ar ? {
                    name_ar: f.college_name_ar,
                    name_en: f.college_name_en
                } : null
            } : null
        }));

        res.json(formatted);
    } catch (err) {
        console.error('Get fees error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create fee
router.post('/', authenticateToken, checkPermission('manage_fees'), async (req, res) => {
    try {
        const { department_id, fee_type, amount, currency, academic_year } = req.body;

        if (req.user.role !== 'super_admin') {
            const dept = await db.getAsync(`
                SELECT d.id, c.university_id, d.college_id 
                FROM departments d 
                JOIN colleges c ON d.college_id = c.id 
                WHERE d.id = $1`, [department_id]);

            if (!dept) return res.status(400).json({ error: 'Invalid department' });

            if (req.user.university_id && dept.university_id !== req.user.university_id) {
                return res.status(403).json({ error: 'Access denied: Out of scope' });
            }
            if (req.user.role === 'college_admin' && req.user.college_id !== dept.college_id) {
                return res.status(403).json({ error: 'Access denied: Out of scope' });
            }
        }

        const id = uuidv4();
        await db.runAsync(
            'INSERT INTO fees (id, department_id, fee_type, amount, currency, academic_year) VALUES ($1, $2, $3, $4, $5, $6)',
            [id, department_id, fee_type, amount, currency, academic_year]
        );
        res.json({ id });
    } catch (err) {
        console.error('Create fee error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update fee
router.put('/:id', authenticateToken, checkPermission('manage_fees'), async (req, res) => {
    try {
        const { fee_type, amount, currency, academic_year } = req.body;
        const target = await db.getAsync(`
            SELECT f.id, c.university_id, d.college_id, f.department_id 
            FROM fees f 
            JOIN departments d ON f.department_id = d.id 
            JOIN colleges c ON d.college_id = c.id 
            WHERE f.id = $1`, [req.params.id]);

        if (!target) return res.status(404).json({ error: 'Fee not found' });

        if (req.user.role !== 'super_admin') {
            if (req.user.university_id && target.university_id !== req.user.university_id) {
                return res.status(403).json({ error: 'Access denied: Out of scope' });
            }
            if (req.user.role === 'college_admin' && req.user.college_id !== target.college_id) {
                return res.status(403).json({ error: 'Access denied: Out of scope' });
            }
            if (req.user.role === 'department_admin' && req.user.department_id !== target.department_id) {
                return res.status(403).json({ error: 'Access denied: Out of scope' });
            }
        }

        await db.runAsync(
            'UPDATE fees SET fee_type = $1, amount = $2, currency = $3, academic_year = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
            [fee_type, amount, currency, academic_year, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Update fee error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete fee
router.delete('/:id', authenticateToken, checkPermission('manage_fees'), async (req, res) => {
    try {
        const target = await db.getAsync(`
            SELECT f.id, c.university_id, d.college_id 
            FROM fees f 
            JOIN departments d ON f.department_id = d.id 
            JOIN colleges c ON d.college_id = c.id 
            WHERE f.id = $1`, [req.params.id]);

        if (!target) return res.status(404).json({ error: 'Fee not found' });

        if (req.user.role !== 'super_admin') {
            if (req.user.university_id && target.university_id !== req.user.university_id) {
                return res.status(403).json({ error: 'Access denied' });
            }
            if (req.user.role === 'college_admin' && req.user.college_id !== target.college_id) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        await db.runAsync('DELETE FROM fees WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete fee error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
