/**
 * @file server/controllers/universities.controller.js
 * @description Business logic for university CRUD operations.
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

/** GET /api/universities */
async function getAll(req, res) {
    try {
        let orderBy = 'is_pinned DESC, name_ar ASC';
        const { sort } = req.query;
        if (sort === 'newest') orderBy = 'is_pinned DESC, created_at DESC';
        else if (sort === 'oldest') orderBy = 'is_pinned DESC, created_at ASC';

        const universities = await db.query(`SELECT * FROM universities ORDER BY ${orderBy}`);
        res.json(universities);
    } catch (err) {
        console.error('Get universities error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/** GET /api/universities/:id */
async function getById(req, res) {
    try {
        const university = await db.getAsync('SELECT * FROM universities WHERE id = $1', [req.params.id]);
        if (!university) return res.status(404).json({ error: 'University not found' });
        res.json(university);
    } catch (err) {
        console.error('Get university error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/** POST /api/universities */
async function create(req, res) {
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
}

/** PUT /api/universities/:id */
async function update(req, res) {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const { name_ar, name_en, description_ar, description_en, guide_pdf_url, logo_url, is_pinned } = req.body;

        if (req.user.role !== 'super_admin' && req.user.university_id !== req.params.id) {
            return res.status(403).json({ error: 'Access denied: Cannot update other university' });
        }
        if (req.user.role !== 'super_admin' && req.user.role !== 'university_admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const existing = await db.getAsync('SELECT * FROM universities WHERE id = $1', [req.params.id]);
        if (!existing) return res.status(404).json({ error: 'University not found' });

        // Field protection: only super_admin can change names or pin status
        const final_name_ar   = req.user.role === 'super_admin' ? name_ar   : existing.name_ar;
        const final_name_en   = req.user.role === 'super_admin' ? name_en   : existing.name_en;
        const final_is_pinned = req.user.role === 'super_admin' ? (is_pinned || 0) : existing.is_pinned;

        await db.runAsync(
            'UPDATE universities SET name_ar = $1, name_en = $2, description_ar = $3, description_en = $4, guide_pdf_url = $5, logo_url = $6, is_pinned = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8',
            [final_name_ar, final_name_en, description_ar, description_en, guide_pdf_url, logo_url, final_is_pinned, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Update university error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/** DELETE /api/universities/:id */
async function remove(req, res) {
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
}

module.exports = { getAll, getById, create, update, remove };
