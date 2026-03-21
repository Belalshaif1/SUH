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
        let paramIdx = 1;

        if (req.query.department_id) {
            query += ` AND g.department_id = $${paramIdx++}`;
            params.push(req.query.department_id);
        }
        if (req.query.college_id) {
            query += ` AND d.college_id = $${paramIdx++}`;
            params.push(req.query.college_id);
        }
        if (req.query.university_id) {
            query += ` AND c.university_id = $${paramIdx++}`;
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
        console.error('Get graduates error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create graduate
router.post('/', authenticateToken, checkPermission('manage_graduates'), async (req, res) => {
    try {
        const { department_id, full_name_ar, full_name_en, graduation_year, gpa, specialization_ar, specialization_en } = req.body;

        if (!department_id || !full_name_ar || !graduation_year) {
            return res.status(400).json({ error: 'Department ID, Full Name (AR), and Graduation Year are required' });
        }

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
            if (req.user.role === 'department_admin' && req.user.department_id !== department_id) {
                return res.status(403).json({ error: 'Access denied: Out of scope' });
            }
        }

        const id = uuidv4();
        await db.runAsync(
            'INSERT INTO graduates (id, department_id, full_name_ar, full_name_en, graduation_year, gpa, specialization_ar, specialization_en) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [id, department_id, full_name_ar, full_name_en, graduation_year, gpa, specialization_ar, specialization_en]
        );
        res.json({ id });
    } catch (err) {
        console.error('Create graduate error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update graduate
router.put('/:id', authenticateToken, checkPermission('manage_graduates'), async (req, res) => {
    try {
        const { full_name_ar, full_name_en, graduation_year, gpa, specialization_ar, specialization_en } = req.body;

        if (!full_name_ar || !graduation_year) {
            return res.status(400).json({ error: 'Full Name (AR) and Graduation Year are required' });
        }
        const target = await db.getAsync(`
            SELECT g.id, c.university_id, d.college_id, g.department_id 
            FROM graduates g 
            JOIN departments d ON g.department_id = d.id 
            JOIN colleges c ON d.college_id = c.id 
            WHERE g.id = $1`, [req.params.id]);

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
            'UPDATE graduates SET full_name_ar = $1, full_name_en = $2, graduation_year = $3, gpa = $4, specialization_ar = $5, specialization_en = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7',
            [full_name_ar, full_name_en, graduation_year, gpa, specialization_ar, specialization_en, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Update graduate error:', err);
        res.status(500).json({ error: 'Internal server error' });
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
            WHERE g.id = $1`, [req.params.id]);

        if (!target) return res.status(404).json({ error: 'Graduate not found' });

        if (req.user.role !== 'super_admin') {
            const isUniAdminOfThis = req.user.role === 'university_admin' && req.user.university_id === target.university_id;
            const isColAdminOfThis = req.user.role === 'college_admin' && req.user.college_id === target.college_id;
            const isDeptAdminOfThis = req.user.role === 'department_admin' && req.user.department_id === target.department_id;

            if (!isUniAdminOfThis && !isColAdminOfThis && !isDeptAdminOfThis) {
                return res.status(403).json({ error: 'Access denied: Out of scope' });
            }
        }

        await db.runAsync('DELETE FROM graduates WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete graduate error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
