const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Get about info
router.get('/', async (req, res) => {
    try {
        const about = await db.getAsync('SELECT * FROM about_us LIMIT 1');
        // If not exists, return empty structure or create default on fly
        if (!about) {
            return res.json({});
        }
        res.json(about);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update/Upsert about info
router.put('/', async (req, res) => {
    try {
        const { content_ar, content_en, developer_name_ar, developer_name_en, developer_bio_ar, developer_bio_en, developer_image_url } = req.body;
        const exists = await db.getAsync('SELECT id FROM about_us LIMIT 1');

        if (exists) {
            await db.runAsync(
                'UPDATE about_us SET content_ar = ?, content_en = ?, developer_name_ar = ?, developer_name_en = ?, developer_bio_ar = ?, developer_bio_en = ?, developer_image_url = ? WHERE id = ?',
                [content_ar, content_en, developer_name_ar, developer_name_en, developer_bio_ar, developer_bio_en, developer_image_url, exists.id]
            );
        } else {
            const id = uuidv4();
            await db.runAsync(
                'INSERT INTO about_us (id, content_ar, content_en, developer_name_ar, developer_name_en, developer_bio_ar, developer_bio_en, developer_image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [id, content_ar, content_en, developer_name_ar, developer_name_en, developer_bio_ar, developer_bio_en, developer_image_url]
            );
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
