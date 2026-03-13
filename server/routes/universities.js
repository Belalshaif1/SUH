const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const { authenticateToken, checkPermission } = require('../middleware/auth');

// Get all universities
router.get('/', async (req, res) => {
    try {
        let orderBy = 'is_pinned DESC, name_ar ASC';
        const { sort } = req.query;

        if (sort === 'newest') {
            orderBy = 'is_pinned DESC, created_at DESC';
        } else if (sort === 'oldest') {
            orderBy = 'is_pinned DESC, created_at ASC';
        } else if (sort === 'name') {
            orderBy = 'is_pinned DESC, name_ar ASC';
        }

        const universities = await db.query(`SELECT * FROM universities ORDER BY ${orderBy}`);
        res.json(universities);
    } catch (err) {
        console.error('Get universities error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single university
router.get('/:id', async (req, res) => {
    try {
        const university = await db.getAsync('SELECT * FROM universities WHERE id = $1', [req.params.id]);
        if (!university) return res.status(404).json({ error: 'University not found' });
        res.json(university);
    } catch (err) {
        console.error('Get university error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create university (Super Admin only)
router.post('/', authenticateToken, checkPermission('manage_universities'), async (req, res) => {
    try {
        const { name_ar, name_en, description_ar, description_en, guide_pdf_url, logo_url, is_pinned } = req.body;
        const id = uuidv4();
        await db.runAsync(
            'INSERT INTO universities (id, name_ar, name_en, description_ar, description_en, guide_pdf_url, logo_url, is_pinned) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [id, name_ar, name_en, description_ar, description_en, guide_pdf_url, logo_url, is_pinned || 0]
        );
        res.json({ id });
    } catch (err) {
        console.error('Create university error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update university (Super Admin or University Admin for their own uni)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const { name_ar, name_en, description_ar, description_en, guide_pdf_url, logo_url, is_pinned } = req.body;

        if (req.user.role !== 'super_admin' && req.user.university_id !== req.params.id) {
            return res.status(403).json({ error: 'Access denied: Cannot update other university' });
        }

        if (req.user.role !== 'super_admin' && req.user.role !== 'university_admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        await db.runAsync(
            'UPDATE universities SET name_ar = $1, name_en = $2, description_ar = $3, description_en = $4, guide_pdf_url = $5, logo_url = $6, is_pinned = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8',
            [name_ar, name_en, description_ar, description_en, guide_pdf_url, logo_url, is_pinned || 0, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Update university error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete university (Super Admin only)
router.delete('/:id', authenticateToken, checkPermission('manage_universities'), async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Access denied: Only Super Admin can delete universities' });
        }
        await db.runAsync('DELETE FROM universities WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete university error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
