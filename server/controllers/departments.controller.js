/**
 * @file server/controllers/departments.controller.js
 * @description Business logic for department CRUD operations.
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

/** GET /api/departments */
async function getAll(req, res) {
    try {
        let query  = 'SELECT d.*, c.name_ar as college_name_ar, c.name_en as college_name_en, c.university_id FROM departments d LEFT JOIN colleges c ON CAST(d.college_id AS TEXT) = CAST(c.id AS TEXT)';
        let params = [];

        if (req.query.college_id) {
            query += ' WHERE d.college_id = $1';
            params.push(req.query.college_id);
        }

        query += ' ORDER BY d.name_ar ASC';
        const departments = await db.query(query, params);

        const formatted = departments.map(d => ({
            ...d,
            colleges: d.college_name_ar ? { name_ar: d.college_name_ar, name_en: d.college_name_en } : null,
        }));

        res.json(formatted);
    } catch (err) {
        console.error('Get departments error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/** GET /api/departments/:id */
async function getById(req, res) {
    try {
        const department = await db.getAsync('SELECT * FROM departments WHERE id = $1', [req.params.id]);
        if (!department) return res.status(404).json({ error: 'Department not found' });
        res.json(department);
    } catch (err) {
        console.error('Get department error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/** POST /api/departments */
async function create(req, res) {
    try {
        const { college_id, name_ar, name_en, description_ar, description_en, study_plan_url, logo_url } = req.body;

        if (req.user.role !== 'super_admin') {
            const college = await db.getAsync('SELECT university_id FROM colleges WHERE id = $1', [college_id]);
            if (!college) return res.status(400).json({ error: 'Invalid college' });

            if (req.user.university_id && college.university_id !== req.user.university_id) {
                return res.status(403).json({ error: 'Access denied: Cannot create department for another university' });
            }
            if (req.user.role === 'college_admin' && req.user.college_id !== college_id) {
                return res.status(403).json({ error: 'Access denied: Cannot create department for another college' });
            }
        }

        const id = uuidv4();
        await db.runAsync(
            'INSERT INTO departments (id, college_id, name_ar, name_en, description_ar, description_en, study_plan_url, logo_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [id, college_id, name_ar, name_en, description_ar, description_en, study_plan_url, logo_url]
        );
        res.json({ id });
    } catch (err) {
        console.error('Create department error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/** PUT /api/departments/:id */
async function update(req, res) {
    try {
        const { name_ar, name_en, description_ar, description_en, study_plan_url, logo_url } = req.body;
        const target = await db.getAsync(
            'SELECT d.id, c.university_id, d.college_id FROM departments d JOIN colleges c ON CAST(d.college_id AS TEXT) = CAST(c.id AS TEXT) WHERE d.id = $1',
            [req.params.id]
        );

        if (!target) return res.status(404).json({ error: 'Department not found' });

        if (req.user.role !== 'super_admin') {
            const isUniAdmin  = req.user.role === 'university_admin'  && req.user.university_id  === target.university_id;
            const isColAdmin  = req.user.role === 'college_admin'     && req.user.college_id     === target.college_id;
            const isDeptAdmin = req.user.role === 'department_admin'  && req.user.department_id  === req.params.id;
            if (!isUniAdmin && !isColAdmin && !isDeptAdmin) {
                return res.status(403).json({ error: 'Access denied: Out of scope' });
            }
        }

        const existing = await db.getAsync('SELECT * FROM departments WHERE id = $1', [req.params.id]);
        if (!existing) return res.status(404).json({ error: 'Department not found' });

        const final_name_ar = req.user.role === 'super_admin' ? name_ar : existing.name_ar;
        const final_name_en = req.user.role === 'super_admin' ? name_en : existing.name_en;

        await db.runAsync(
            'UPDATE departments SET name_ar = $1, name_en = $2, description_ar = $3, description_en = $4, study_plan_url = $5, logo_url = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7',
            [final_name_ar, final_name_en, description_ar, description_en, study_plan_url, logo_url, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Update department error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/** DELETE /api/departments/:id */
async function remove(req, res) {
    try {
        const target = await db.getAsync(
            'SELECT d.id, c.university_id, d.college_id FROM departments d JOIN colleges c ON d.college_id = c.id WHERE d.id = $1',
            [req.params.id]
        );

        if (!target) return res.status(404).json({ error: 'Department not found' });

        if (req.user.role !== 'super_admin') {
            const isUniAdmin = req.user.role === 'university_admin' && req.user.university_id === target.university_id;
            const isColAdmin = req.user.role === 'college_admin'    && req.user.college_id    === target.college_id;
            if (!isUniAdmin && !isColAdmin) {
                return res.status(403).json({ error: 'Access denied: Out of scope' });
            }
        }

        await db.runAsync('DELETE FROM departments WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete department error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { getAll, getById, create, update, remove };
