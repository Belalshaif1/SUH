const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const { authenticateToken, checkPermission } = require('../middleware/auth');

// Get all announcements (Public)
router.get('/', async (req, res) => {
    try {
        let query = `
            SELECT a.*, 
                   usr.full_name as author_name,
                   u.name_ar as uni_name_ar, u.name_en as uni_name_en, u.logo_url as uni_logo_url,
                   c.name_ar as college_name_ar, c.name_en as college_name_en, c.logo_url as college_logo_url
            FROM announcements a 
            LEFT JOIN users usr ON a.created_by = usr.id 
            LEFT JOIN universities u ON a.university_id = u.id
            LEFT JOIN colleges c ON a.college_id = c.id
            ORDER BY a.is_pinned DESC, a.created_at DESC`;
        const params = [];

        if (req.query.limit) {
            query += ' LIMIT $1';
            params.push(parseInt(req.query.limit));
        }

        const announcementsList = await db.query(query, params);

        const formatted = announcementsList.map(a => ({
            ...a,
            universities: a.uni_name_ar ? { name_ar: a.uni_name_ar, name_en: a.uni_name_en, logo_url: a.uni_logo_url } : null,
            colleges: a.college_name_ar ? { name_ar: a.college_name_ar, name_en: a.college_name_en, logo_url: a.college_logo_url } : null
        }));

        res.json(formatted);
    } catch (err) {
        console.error('Get announcements error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single announcement
router.get('/:id', async (req, res) => {
    try {
        const announcement = await db.getAsync('SELECT * FROM announcements WHERE id = $1', [req.params.id]);
        if (!announcement) return res.status(404).json({ error: 'Announcement not found' });
        res.json(announcement);
    } catch (err) {
        console.error('Get announcement error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create announcement
router.post('/', authenticateToken, checkPermission('manage_announcements'), async (req, res) => {
    try {
        const { title_ar, title_en, content_ar, content_en, image_url, file_url, is_pinned } = req.body;

        let effectiveUniversityId = req.body.university_id || null;
        let effectiveCollegeId = req.body.college_id || null;

        if (req.user.role !== 'super_admin') {
            effectiveUniversityId = req.user.university_id || null;
            effectiveCollegeId = req.user.college_id || null;
        }

        const scope = req.user.role === 'super_admin' ? 'global' :
            req.user.role === 'university_admin' ? 'university' :
                req.user.role === 'college_admin' ? 'college' : 'department';

        const id = uuidv4();
        await db.runAsync(
            'INSERT INTO announcements (id, title_ar, title_en, content_ar, content_en, scope, university_id, college_id, image_url, file_url, is_pinned, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
            [id, title_ar, title_en, content_ar, content_en, scope, effectiveUniversityId, effectiveCollegeId, image_url || null, file_url || null, is_pinned || 0, req.user.id]
        );
        res.json({ id });
    } catch (err) {
        console.error('Create announcement error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update announcement
router.put('/:id', authenticateToken, checkPermission('manage_announcements'), async (req, res) => {
    try {
        const { title_ar, title_en, content_ar, content_en, scope, university_id, college_id, image_url, file_url, is_pinned } = req.body;
        const target = await db.getAsync('SELECT created_by, university_id FROM announcements WHERE id = $1', [req.params.id]);

        if (!target) return res.status(404).json({ error: 'Announcement not found' });

        if (req.user.role !== 'super_admin') {
            const isOwner = target.created_by === req.user.id;
            const isUniAdmin = req.user.role === 'university_admin' && target.university_id === req.user.university_id;
            if (!isOwner && !isUniAdmin) {
                return res.status(403).json({ error: 'Access denied: Cannot update this announcement' });
            }
        }

        await db.runAsync(
            'UPDATE announcements SET title_ar = $1, title_en = $2, content_ar = $3, content_en = $4, scope = $5, university_id = $6, college_id = $7, image_url = $8, file_url = $9, is_pinned = $10, updated_at = CURRENT_TIMESTAMP WHERE id = $11',
            [title_ar, title_en, content_ar, content_en, scope, university_id || null, college_id || null, image_url, file_url, is_pinned || 0, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Update announcement error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete announcement
router.delete('/:id', authenticateToken, checkPermission('manage_announcements'), async (req, res) => {
    try {
        const target = await db.getAsync('SELECT created_by, university_id FROM announcements WHERE id = $1', [req.params.id]);
        if (!target) return res.status(404).json({ error: 'Announcement not found' });

        if (req.user.role !== 'super_admin') {
            const isOwner = target.created_by === req.user.id;
            const isUniAdmin = req.user.role === 'university_admin' && target.university_id === req.user.university_id;
            if (!isOwner && !isUniAdmin) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        await db.runAsync('DELETE FROM announcements WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete announcement error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
