/**
 * @file server/controllers/admins.controller.js
 * @description Business logic for admin user management (create, update, delete admins).
 */

const bcrypt          = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db              = require('../config/db');

/**
 * canManageRole — checks if a manager can manage a given target role.
 * Enforces the role hierarchy: super_admin > university_admin > college_admin > department_admin.
 */
const canManageRole = (managerRole, targetRole) => {
    if (managerRole === 'super_admin') return true;
    if (managerRole === 'university_admin' && (targetRole === 'college_admin' || targetRole === 'department_admin')) return true;
    if (managerRole === 'college_admin' && targetRole === 'department_admin') return true;
    return false;
};

/** GET /api/admins */
async function getAll(req, res) {
    try {
        let sql;
        let params = [];

        const currentUser = await db.getAsync('SELECT * FROM users WHERE id = $1', [req.user.id]);

        if (currentUser.role === 'super_admin') {
            sql    = "SELECT id, email, full_name, role, university_id, college_id, department_id, is_active, created_at, created_by FROM users WHERE role != 'user' AND id != $1 ORDER BY created_at DESC";
            params = [currentUser.id];
        } else if (currentUser.role === 'university_admin') {
            sql    = "SELECT id, email, full_name, role, university_id, college_id, department_id, is_active, created_at, created_by FROM users WHERE role IN ('college_admin', 'department_admin') AND university_id = $1 ORDER BY created_at DESC";
            params = [currentUser.university_id];
        } else if (currentUser.role === 'college_admin') {
            sql    = "SELECT id, email, full_name, role, university_id, college_id, department_id, is_active, created_at, created_by FROM users WHERE role = 'department_admin' AND college_id = $1 ORDER BY created_at DESC";
            params = [currentUser.college_id];
        } else {
            sql    = "SELECT id, email, full_name, role, university_id, college_id, department_id, is_active, created_at, created_by FROM users WHERE 1=0";
            params = [];
        }

        const admins = await db.query(sql, params);
        res.json(admins);
    } catch (err) {
        console.error('Get admins error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/** POST /api/admins */
async function create(req, res) {
    try {
        const { email, password, full_name, role, university_id, college_id, department_id } = req.body;

        if (!canManageRole(req.user.role, role)) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        const existing = await db.getAsync('SELECT id FROM users WHERE email = $1', [email]);
        if (existing) return res.status(400).json({ error: 'Email already exists' });

        const id             = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 12);

        await db.runAsync(
            'INSERT INTO users (id, email, password, full_name, role, university_id, college_id, department_id, created_by, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1)',
            [id, email, hashedPassword, full_name, role, university_id || null, college_id || null, department_id || null, req.user.id]
        );

        res.status(201).json({ success: true, id });
    } catch (err) {
        console.error('Create admin error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/** PUT /api/admins/:id */
async function update(req, res) {
    try {
        const { full_name, email, role, university_id, college_id, department_id } = req.body;
        const target = await db.getAsync('SELECT role FROM users WHERE id = $1', [req.params.id]);

        if (!target) return res.status(404).json({ error: 'Admin not found' });
        if (!canManageRole(req.user.role, target.role)) {
            return res.status(403).json({ error: 'Permission denied to manage this admin' });
        }

        await db.runAsync(
            'UPDATE users SET full_name = $1, email = $2, role = $3, university_id = $4, college_id = $5, department_id = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7',
            [full_name, email, role, university_id || null, college_id || null, department_id || null, req.params.id]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Update admin error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/** PATCH /api/admins/:id/toggle */
async function toggle(req, res) {
    try {
        const { is_active } = req.body;
        const target = await db.getAsync('SELECT role FROM users WHERE id = $1', [req.params.id]);

        if (!target) return res.status(404).json({ error: 'Admin not found' });
        if (!canManageRole(req.user.role, target.role)) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        await db.runAsync(
            'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [is_active ? 1 : 0, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Toggle admin error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/** POST /api/admins/:id/password */
async function changePassword(req, res) {
    try {
        const { new_password } = req.body;
        if (!new_password || new_password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const target = await db.getAsync('SELECT role FROM users WHERE id = $1', [req.params.id]);
        if (!target) return res.status(404).json({ error: 'Admin not found' });

        if (req.user.id !== req.params.id && !canManageRole(req.user.role, target.role)) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        const hashedPassword = await bcrypt.hash(new_password, 12);
        await db.runAsync(
            'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashedPassword, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Change admin password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/** DELETE /api/admins/:id */
async function remove(req, res) {
    try {
        const target = await db.getAsync('SELECT role FROM users WHERE id = $1', [req.params.id]);
        if (!target) return res.status(404).json({ error: 'Admin not found' });

        if (!canManageRole(req.user.role, target.role)) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        await db.runAsync('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete admin error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { getAll, create, update, toggle, changePassword, remove };
