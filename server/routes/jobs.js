const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const { authenticateToken, checkPermission } = require('../middleware/auth');

// Get all jobs
router.get('/', async (req, res) => {
    try {
        let query = `
            SELECT j.*, 
                   c.name_ar as college_name_ar, c.name_en as college_name_en,
                   u.name_ar as uni_name_ar, u.name_en as uni_name_en
            FROM jobs j 
            LEFT JOIN colleges c ON j.college_id = c.id 
            LEFT JOIN universities u ON c.university_id = u.id
            ORDER BY j.is_pinned DESC, j.created_at DESC`;
        const jobsList = await db.query(query);

        const formatted = jobsList.map(j => ({
            ...j,
            colleges: j.college_name_ar ? { name_ar: j.college_name_ar, name_en: j.college_name_en } : null,
            universities: j.uni_name_ar ? { name_ar: j.uni_name_ar, name_en: j.uni_name_en } : null
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create job
router.post('/', authenticateToken, checkPermission('manage_jobs'), async (req, res) => {
    try {
        const { college_id, title_ar, title_en, description_ar, description_en, requirements_ar, requirements_en, is_active, deadline, is_pinned } = req.body;

        // Scope check
        if (req.user.role !== 'super_admin') {
            const college = await db.getAsync('SELECT university_id FROM colleges WHERE id = ?', [college_id]);
            if (!college) return res.status(400).json({ error: 'Invalid college' });

            if (req.user.university_id && college.university_id !== req.user.university_id) {
                return res.status(403).json({ error: 'Access denied: Out of scope' });
            }
        }

        const id = uuidv4();
        await db.runAsync(
            'INSERT INTO jobs (id, college_id, title_ar, title_en, description_ar, description_en, requirements_ar, requirements_en, is_active, deadline, is_pinned) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, college_id, title_ar, title_en, description_ar, description_en, requirements_ar, requirements_en, is_active, deadline, is_pinned || 0]
        );
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update job
router.put('/:id', authenticateToken, checkPermission('manage_jobs'), async (req, res) => {
    try {
        const { title_ar, title_en, description_ar, description_en, requirements_ar, requirements_en, is_active, deadline, is_pinned } = req.body;
        const target = await db.getAsync(`
            SELECT j.id, c.university_id, j.college_id 
            FROM jobs j 
            JOIN colleges c ON j.college_id = c.id 
            WHERE j.id = ?`, [req.params.id]);

        if (!target) return res.status(404).json({ error: 'Job not found' });

        if (req.user.role !== 'super_admin') {
            if (req.user.university_id && target.university_id !== req.user.university_id) {
                return res.status(403).json({ error: 'Access denied: Out of scope' });
            }
            if (req.user.role === 'college_admin' && req.user.college_id !== target.college_id) {
                return res.status(403).json({ error: 'Access denied: Out of scope' });
            }
        }

        await db.runAsync(
            'UPDATE jobs SET title_ar = ?, title_en = ?, description_ar = ?, description_en = ?, requirements_ar = ?, requirements_en = ?, is_active = ?, deadline = ?, is_pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [title_ar, title_en, description_ar, description_en, requirements_ar, requirements_en, is_active, deadline, is_pinned || 0, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete job
router.delete('/:id', authenticateToken, checkPermission('manage_jobs'), async (req, res) => {
    try {
        const target = await db.getAsync(`
            SELECT j.id, c.university_id, j.college_id 
            FROM jobs j 
            JOIN colleges c ON j.college_id = c.id 
            WHERE j.id = ?`, [req.params.id]);

        if (!target) return res.status(404).json({ error: 'Job not found' });

        if (req.user.role !== 'super_admin') {
            if (req.user.university_id && target.university_id !== req.user.university_id) {
                return res.status(403).json({ error: 'Access denied' });
            }
            if (req.user.role === 'college_admin' && req.user.college_id !== target.college_id) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        await db.runAsync('DELETE FROM jobs WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
