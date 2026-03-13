const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Get all services
router.get('/', async (req, res) => {
    try {
        const services = await db.query('SELECT * FROM services WHERE is_active = 1 ORDER BY created_at DESC');
        res.json(services);
    } catch (err) {
        console.error('Get services error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create service
router.post('/', async (req, res) => {
    try {
        const { title_ar, title_en, description_ar, description_en, icon, link, is_active } = req.body;
        const id = uuidv4();
        await db.runAsync(
            'INSERT INTO services (id, title_ar, title_en, description_ar, description_en, icon, link, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [id, title_ar, title_en, description_ar, description_en, icon, link, is_active ?? 1]
        );
        res.json({ id });
    } catch (err) {
        console.error('Create service error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update service
router.put('/:id', async (req, res) => {
    try {
        const { title_ar, title_en, description_ar, description_en, icon, link, is_active } = req.body;
        await db.runAsync(
            'UPDATE services SET title_ar = $1, title_en = $2, description_ar = $3, description_en = $4, icon = $5, link = $6, is_active = $7 WHERE id = $8',
            [title_ar, title_en, description_ar, description_en, icon, link, is_active, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Update service error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete service
router.delete('/:id', async (req, res) => {
    try {
        await db.runAsync('DELETE FROM services WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete service error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
