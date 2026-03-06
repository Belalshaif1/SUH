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
        res.status(500).json({ error: err.message });
    }
});

// Create service
router.post('/', async (req, res) => {
    try {
        const { title_ar, title_en, description_ar, description_en, icon, link, is_active } = req.body;
        const id = uuidv4();
        await db.runAsync(
            'INSERT INTO services (id, title_ar, title_en, description_ar, description_en, icon, link, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title_ar, title_en, description_ar, description_en, icon, link, is_active]
        );
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update service
router.put('/:id', async (req, res) => {
    try {
        const { title_ar, title_en, description_ar, description_en, icon, link, is_active } = req.body;
        await db.runAsync(
            'UPDATE services SET title_ar = ?, title_en = ?, description_ar = ?, description_en = ?, icon = ?, link = ?, is_active = ? WHERE id = ?',
            [title_ar, title_en, description_ar, description_en, icon, link, is_active, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete service
router.delete('/:id', async (req, res) => {
    try {
        await db.runAsync('DELETE FROM services WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
