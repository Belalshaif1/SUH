const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');

// Get about info
router.get('/', async (req, res) => {
    try {
        const about = await db.getAsync('SELECT * FROM about_us LIMIT 1');
        if (!about) {
            return res.json({});
        }
        res.json(about);
    } catch (err) {
        console.error('Get about error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update/Upsert about info (Super Admin only)
router.put('/', authenticateToken, async (req, res) => {
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Access denied. Super Admin only.' });
    }
    try {
        const { content_ar, content_en, developer_name_ar, developer_name_en, developer_bio_ar, developer_bio_en, developer_image_url, developer_cv_url } = req.body;
        const exists = await db.getAsync('SELECT id FROM about_us LIMIT 1');

        if (exists) {
            await db.runAsync(
                'UPDATE about_us SET content_ar = $1, content_en = $2, developer_name_ar = $3, developer_name_en = $4, developer_bio_ar = $5, developer_bio_en = $6, developer_image_url = $7, developer_cv_url = $8 WHERE id = $9',
                [content_ar, content_en, developer_name_ar, developer_name_en, developer_bio_ar, developer_bio_en, developer_image_url, developer_cv_url, exists.id]
            );
        } else {
            const id = uuidv4();
            await db.runAsync(
                'INSERT INTO about_us (id, content_ar, content_en, developer_name_ar, developer_name_en, developer_bio_ar, developer_bio_en, developer_image_url, developer_cv_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                [id, content_ar, content_en, developer_name_ar, developer_name_en, developer_bio_ar, developer_bio_en, developer_image_url, developer_cv_url]
            );
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Update about error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
