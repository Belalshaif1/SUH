const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const { authenticateToken, checkPermission } = require('../middleware/auth');

// Get all jobs
router.get('/', async (req, res) => {
    try {
        const query = `
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
        console.error('Get jobs error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create job
router.post('/', authenticateToken, checkPermission('manage_jobs'), async (req, res) => {
    try {
        const { college_id, title_ar, title_en, description_ar, description_en, requirements_ar, requirements_en, is_active, deadline, is_pinned } = req.body;

        if (req.user.role !== 'super_admin') {
            const college = await db.getAsync('SELECT university_id FROM colleges WHERE id = $1', [college_id]);
            if (!college) return res.status(400).json({ error: 'Invalid college' });

            if (req.user.university_id && college.university_id !== req.user.university_id) {
                return res.status(403).json({ error: 'Access denied: Out of scope' });
            }
        }

        const id = uuidv4();
        await db.runAsync(
            'INSERT INTO jobs (id, college_id, title_ar, title_en, description_ar, description_en, requirements_ar, requirements_en, is_active, deadline, is_pinned) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
            [id, college_id, title_ar, title_en, description_ar, description_en, requirements_ar, requirements_en, is_active ?? 1, deadline, is_pinned || 0]
        );
        res.json({ id });
    } catch (err) {
        console.error('Create job error:', err);
        res.status(500).json({ error: 'Internal server error' });
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
            WHERE j.id = $1`, [req.params.id]);

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
            'UPDATE jobs SET title_ar = $1, title_en = $2, description_ar = $3, description_en = $4, requirements_ar = $5, requirements_en = $6, is_active = $7, deadline = $8, is_pinned = $9, updated_at = CURRENT_TIMESTAMP WHERE id = $10',
            [title_ar, title_en, description_ar, description_en, requirements_ar, requirements_en, is_active, deadline, is_pinned || 0, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Update job error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete job
router.delete('/:id', authenticateToken, checkPermission('manage_jobs'), async (req, res) => {
    try {
        const target = await db.getAsync(`
            SELECT j.id, c.university_id, j.college_id 
            FROM jobs j 
            JOIN colleges c ON j.college_id = c.id 
            WHERE j.id = $1`, [req.params.id]);

        if (!target) return res.status(404).json({ error: 'Job not found' });

        if (req.user.role !== 'super_admin') {
            if (req.user.university_id && target.university_id !== req.user.university_id) {
                return res.status(403).json({ error: 'Access denied' });
            }
            if (req.user.role === 'college_admin' && req.user.college_id !== target.college_id) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        await db.runAsync('DELETE FROM jobs WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete job error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
