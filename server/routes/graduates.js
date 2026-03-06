const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const { authenticateToken, checkPermission } = require('../middleware/auth');

// Get all graduates
router.get('/', async (req, res) => {
    try {
        let query = `
            SELECT g.*, 
                   d.name_ar as department_name_ar, d.name_en as department_name_en,
                   c.name_ar as college_name_ar, c.name_en as college_name_en,
                   u.name_ar as university_name_ar, u.name_en as university_name_en,
                   u.id as university_id, c.id as college_id
            FROM graduates g 
            LEFT JOIN departments d ON g.department_id = d.id 
            LEFT JOIN colleges c ON d.college_id = c.id
            LEFT JOIN universities u ON c.university_id = u.id
            WHERE 1=1`;
        const params = [];

        if (req.query.department_id) {
            query += ' AND g.department_id = ?';
            params.push(req.query.department_id);
        }
        if (req.query.college_id) {
            query += ' AND d.college_id = ?';
            params.push(req.query.college_id);
        }
        if (req.query.university_id) {
            query += ' AND c.university_id = ?';
            params.push(req.query.university_id);
        }

        query += ' ORDER BY g.graduation_year DESC, g.created_at DESC';
        const graduatesList = await db.query(query, params);

        const formatted = graduatesList.map(g => ({
            ...g,
            departments: g.department_name_ar ? {
                name_ar: g.department_name_ar,
                name_en: g.department_name_en,
                colleges: g.college_name_ar ? {
                    id: g.college_id,
                    name_ar: g.college_name_ar,
                    name_en: g.college_name_en,
                    universities: g.university_name_ar ? {
                        id: g.university_id,
                        name_ar: g.university_name_ar,
                        name_en: g.university_name_en
                    } : null
                } : null
            } : null
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create graduate
router.post('/', authenticateToken, checkPermission('manage_graduates'), async (req, res) => {
    try {
        const { department_id, full_name_ar, full_name_en, graduation_year, gpa, specialization_ar, specialization_en } = req.body;

        // Scope check
        if (req.user.role !== 'super_admin') {
            const dept = await db.getAsync(`
                SELECT d.id, c.university_id, d.college_id 
                FROM departments d 
                JOIN colleges c ON d.college_id = c.id 
                WHERE d.id = ?`, [department_id]);

            if (!dept) return res.status(400).json({ error: 'Invalid department' });

            if (req.user.university_id && dept.university_id !== req.user.university_id) {
                return res.status(403).json({ error: 'Access denied: Out of scope' });
            }
            if (req.user.role === 'college_admin' && req.user.college_id !== dept.college_id) {
                return res.status(403).json({ error: 'Access denied: Out of scope' });
            }
            if (req.user.role === 'department_admin' && req.user.department_id !== department_id) {
                return res.status(403).json({ error: 'Access denied: Out of scope' });
            }
        }

        const id = uuidv4();
        await db.runAsync(
            'INSERT INTO graduates (id, department_id, full_name_ar, full_name_en, graduation_year, gpa, specialization_ar, specialization_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, department_id, full_name_ar, full_name_en, graduation_year, gpa, specialization_ar, specialization_en]
        );
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update graduate
router.put('/:id', authenticateToken, checkPermission('manage_graduates'), async (req, res) => {
    try {
        const { full_name_ar, full_name_en, graduation_year, gpa, specialization_ar, specialization_en } = req.body;
        const target = await db.getAsync(`
            SELECT g.id, c.university_id, d.college_id, g.department_id 
            FROM graduates g 
            JOIN departments d ON g.department_id = d.id 
            JOIN colleges c ON d.college_id = c.id 
            WHERE g.id = ?`, [req.params.id]);

        if (!target) return res.status(404).json({ error: 'Graduate not found' });

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
            'UPDATE graduates SET full_name_ar = ?, full_name_en = ?, graduation_year = ?, gpa = ?, specialization_ar = ?, specialization_en = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [full_name_ar, full_name_en, graduation_year, gpa, specialization_ar, specialization_en, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete graduate
router.delete('/:id', authenticateToken, checkPermission('manage_graduates'), async (req, res) => {
    try {
        const target = await db.getAsync(`
            SELECT g.id, c.university_id, d.college_id, g.department_id 
            FROM graduates g 
            JOIN departments d ON g.department_id = d.id 
            JOIN colleges c ON d.college_id = c.id 
            WHERE g.id = ?`, [req.params.id]);

        if (!target) return res.status(404).json({ error: 'Graduate not found' });

        if (req.user.role !== 'super_admin') {
            const isUniAdminOfThis = req.user.role === 'university_admin' && req.user.university_id === target.university_id;
            const isColAdminOfThis = req.user.role === 'college_admin' && req.user.college_id === target.college_id;
            const isDeptAdminOfThis = req.user.role === 'department_admin' && req.user.department_id === target.department_id;

            if (!isUniAdminOfThis && !isColAdminOfThis && !isDeptAdminOfThis) {
                return res.status(403).json({ error: 'Access denied: Out of scope' });
            }
        }

        await db.runAsync('DELETE FROM graduates WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
