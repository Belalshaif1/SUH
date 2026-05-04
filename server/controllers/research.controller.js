/**
 * @file server/controllers/research.controller.js
 * @description Business logic for research CRUD operations.
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

/** GET /api/research */
async function getAll(req, res) {
    try {
        let query = `
            SELECT r.*,
                   d.name_ar as department_name_ar, d.name_en as department_name_en,
                   c.name_ar as college_name_ar, c.name_en as college_name_en,
                   u.name_ar as university_name_ar, u.name_en as university_name_en,
                   u.id as university_id, c.id as college_id
            FROM research r
            LEFT JOIN departments d ON r.department_id = d.id
            LEFT JOIN colleges c ON d.college_id = c.id
            LEFT JOIN universities u ON c.university_id = u.id
            WHERE 1=1`;
        const params = [];
        let paramIdx = 1;

        if (req.query.department_id) { query += ` AND r.department_id = $${paramIdx++}`; params.push(req.query.department_id); }
        if (req.query.college_id)    { query += ` AND d.college_id = $${paramIdx++}`;    params.push(req.query.college_id);    }
        if (req.query.university_id) { query += ` AND c.university_id = $${paramIdx++}`; params.push(req.query.university_id); }

        query += ' ORDER BY r.created_at DESC';
        const researchList = await db.query(query, params);

        const formatted = researchList.map(r => ({
            ...r,
            students: r.students ? (typeof r.students === 'string' ? JSON.parse(r.students) : r.students) : [],
            departments: r.department_name_ar ? {
                name_ar: r.department_name_ar,
                name_en: r.department_name_en,
                colleges: r.college_name_ar ? {
                    id: r.college_id,
                    name_ar: r.college_name_ar,
                    name_en: r.college_name_en,
                    universities: r.university_name_ar ? {
                        id: r.university_id,
                        name_ar: r.university_name_ar,
                        name_en: r.university_name_en,
                    } : null,
                } : null,
            } : null,
        }));

        res.json(formatted);
    } catch (err) {
        console.error('Get research error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/** POST /api/research */
async function create(req, res) {
    try {
        const { department_id, title_ar, title_en, abstract_ar, abstract_en, author_name, published, publish_date, pdf_url, students } = req.body;

        if (!department_id || !title_ar || !author_name) {
            return res.status(400).json({ error: 'Department ID, Title (AR), and Author Name are required' });
        }

        if (req.user.role !== 'super_admin') {
            const dept = await db.getAsync(
                'SELECT d.id, c.university_id, d.college_id FROM departments d JOIN colleges c ON d.college_id = c.id WHERE d.id = $1',
                [department_id]
            );
            if (!dept) return res.status(400).json({ error: 'Invalid department' });

            if (req.user.university_id && dept.university_id !== req.user.university_id) return res.status(403).json({ error: 'Access denied: Out of scope' });
            if (req.user.role === 'college_admin'    && req.user.college_id    !== dept.college_id)  return res.status(403).json({ error: 'Access denied: Out of scope' });
            if (req.user.role === 'department_admin' && req.user.department_id !== department_id)    return res.status(403).json({ error: 'Access denied: Out of scope' });
        }

        const id = uuidv4();
        await db.runAsync(
            'INSERT INTO research (id, department_id, title_ar, title_en, abstract_ar, abstract_en, author_name, published, publish_date, pdf_url, students) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
            [id, department_id, title_ar, title_en, abstract_ar, abstract_en, author_name, published ?? 1, publish_date, pdf_url, JSON.stringify(students || [])]
        );
        res.json({ id });
    } catch (err) {
        console.error('Create research error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/** PUT /api/research/:id */
async function update(req, res) {
    try {
        const { title_ar, title_en, abstract_ar, abstract_en, author_name, published, publish_date, pdf_url, students } = req.body;

        if (!title_ar || !author_name) {
            return res.status(400).json({ error: 'Title (AR) and Author Name are required' });
        }

        const target = await db.getAsync(
            'SELECT r.id, c.university_id, d.college_id, r.department_id FROM research r JOIN departments d ON r.department_id = d.id JOIN colleges c ON d.college_id = c.id WHERE r.id = $1',
            [req.params.id]
        );
        if (!target) return res.status(404).json({ error: 'Research not found' });

        if (req.user.role !== 'super_admin') {
            if (req.user.university_id && target.university_id !== req.user.university_id) return res.status(403).json({ error: 'Access denied: Out of scope' });
            if (req.user.role === 'college_admin'    && req.user.college_id    !== target.college_id)    return res.status(403).json({ error: 'Access denied: Out of scope' });
            if (req.user.role === 'department_admin' && req.user.department_id !== target.department_id) return res.status(403).json({ error: 'Access denied: Out of scope' });
        }

        await db.runAsync(
            'UPDATE research SET title_ar = $1, title_en = $2, abstract_ar = $3, abstract_en = $4, author_name = $5, published = $6, publish_date = $7, pdf_url = $8, students = $9, updated_at = CURRENT_TIMESTAMP WHERE id = $10',
            [title_ar, title_en, abstract_ar, abstract_en, author_name, published, publish_date, pdf_url, JSON.stringify(students || []), req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Update research error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/** DELETE /api/research/:id */
async function remove(req, res) {
    try {
        const target = await db.getAsync(
            'SELECT r.id, c.university_id, d.college_id, r.department_id FROM research r JOIN departments d ON r.department_id = d.id JOIN colleges c ON d.college_id = c.id WHERE r.id = $1',
            [req.params.id]
        );
        if (!target) return res.status(404).json({ error: 'Research not found' });

        if (req.user.role !== 'super_admin') {
            const isUniAdmin  = req.user.role === 'university_admin'  && req.user.university_id  === target.university_id;
            const isColAdmin  = req.user.role === 'college_admin'     && req.user.college_id     === target.college_id;
            const isDeptAdmin = req.user.role === 'department_admin'  && req.user.department_id  === target.department_id;
            if (!isUniAdmin && !isColAdmin && !isDeptAdmin) return res.status(403).json({ error: 'Access denied: Out of scope' });
        }

        await db.runAsync('DELETE FROM research WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete research error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { getAll, create, update, remove };
