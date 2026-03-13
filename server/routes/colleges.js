const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const { authenticateToken, checkPermission } = require('../middleware/auth');

// Get all colleges
router.get('/', async (req, res) => {
    try {
        let query = 'SELECT c.*, u.name_ar as university_name_ar, u.name_en as university_name_en FROM colleges c LEFT JOIN universities u ON c.university_id = u.id';
        let params = [];

        if (req.query.university_id) {
            query += ' WHERE c.university_id = $1';
            params.push(req.query.university_id);
        }

        query += ' ORDER BY c.is_pinned DESC, c.name_ar ASC';
        const colleges = await db.query(query, params);

        const formatted = colleges.map(c => ({
            ...c,
            universities: c.university_name_ar ? { name_ar: c.university_name_ar, name_en: c.university_name_en } : null
        }));

        res.json(formatted);
    } catch (err) {
        console.error('Get colleges error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single college
router.get('/:id', async (req, res) => {
    try {
        const college = await db.getAsync('SELECT * FROM colleges WHERE id = $1', [req.params.id]);
        if (!college) return res.status(404).json({ error: 'College not found' });
        res.json(college);
    } catch (err) {
        console.error('Get college error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create college
router.post('/', authenticateToken, checkPermission('manage_colleges'), async (req, res) => {
    try {
        const { university_id, name_ar, name_en, description_ar, description_en, guide_pdf_url, logo_url, is_pinned } = req.body;

        if (req.user.role !== 'super_admin') {
            const effectiveUniId = req.user.university_id;
            if (!effectiveUniId || effectiveUniId !== university_id) {
                return res.status(403).json({ error: 'Access denied: Cannot create college for another university' });
            }
        }

        const id = uuidv4();
        await db.runAsync(
            'INSERT INTO colleges (id, university_id, name_ar, name_en, description_ar, description_en, guide_pdf_url, logo_url, is_pinned) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [id, university_id, name_ar, name_en, description_ar, description_en, guide_pdf_url, logo_url, is_pinned || 0]
        );
        res.json({ id });
    } catch (err) {
        console.error('Create college error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update college
router.put('/:id', authenticateToken, checkPermission('manage_colleges'), async (req, res) => {
    try {
        const { name_ar, name_en, description_ar, description_en, guide_pdf_url, logo_url, is_pinned } = req.body;
        const target = await db.getAsync('SELECT university_id FROM colleges WHERE id = $1', [req.params.id]);

        if (!target) return res.status(404).json({ error: 'College not found' });

        if (req.user.role !== 'super_admin') {
            const isUniAdminOfThis = req.user.role === 'university_admin' && req.user.university_id === target.university_id;
            const isColAdminOfThis = req.user.role === 'college_admin' && req.user.college_id === req.params.id;

            if (!isUniAdminOfThis && !isColAdminOfThis) {
                return res.status(403).json({ error: 'Access denied: Out of scope' });
            }
        }

        await db.runAsync(
            'UPDATE colleges SET name_ar = $1, name_en = $2, description_ar = $3, description_en = $4, guide_pdf_url = $5, logo_url = $6, is_pinned = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8',
            [name_ar, name_en, description_ar, description_en, guide_pdf_url, logo_url, is_pinned || 0, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Update college error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete college
router.delete('/:id', authenticateToken, checkPermission('manage_colleges'), async (req, res) => {
    try {
        const target = await db.getAsync('SELECT university_id FROM colleges WHERE id = $1', [req.params.id]);
        if (!target) return res.status(404).json({ error: 'College not found' });

        if (req.user.role !== 'super_admin') {
            const isUniAdminOfThis = req.user.role === 'university_admin' && req.user.university_id === target.university_id;
            if (!isUniAdminOfThis) {
                return res.status(403).json({ error: 'Access denied: Only University Admin or Super Admin can delete colleges' });
            }
        }

        await db.runAsync('DELETE FROM colleges WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete college error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
