const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Middleware to check if user can manage other admins
// Super admin can manage all. University admin can manage college/dept admins in their uni, etc.
const canManageRole = (managerRole, targetRole) => {
    if (managerRole === 'super_admin') return true;
    if (managerRole === 'university_admin' && (targetRole === 'college_admin' || targetRole === 'department_admin')) return true;
    if (managerRole === 'college_admin' && targetRole === 'department_admin') return true;
    return false;
};

// Get all admins
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        let sql = 'SELECT id, email, full_name, role, university_id, college_id, department_id, is_active, created_at, created_by FROM users WHERE role != "user"';
        let params = [];

        if (req.user.role !== 'super_admin') {
            sql += ' AND (created_by = ? OR (university_id = ? AND ? IS NOT NULL) OR (college_id = ? AND ? IS NOT NULL) OR (department_id = ? AND ? IS NOT NULL))';
            params.push(req.user.id, req.user.university_id, req.user.university_id, req.user.college_id, req.user.college_id, req.user.department_id, req.user.department_id);
        }

        const admins = await db.query(sql, params);
        res.json(admins);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Admin
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { email, password, full_name, role, university_id, college_id, department_id } = req.body;

        if (!canManageRole(req.user.role, role)) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        const existing = await db.getAsync('SELECT id FROM users WHERE email = ?', [email]);
        if (existing) return res.status(400).json({ error: 'Email already exists' });

        const id = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.runAsync(
            `INSERT INTO users (id, email, password, full_name, role, university_id, college_id, department_id, created_by, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, email, hashedPassword, full_name, role, university_id || null, college_id || null, department_id || null, req.user.id, 1]
        );

        res.status(201).json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Admin Details/Role/Access
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { full_name, email, role, university_id, college_id, department_id } = req.body;
        const target = await db.getAsync('SELECT role FROM users WHERE id = ?', [req.params.id]);

        if (!target) return res.status(404).json({ error: 'Admin not found' });
        if (!canManageRole(req.user.role, target.role)) {
            return res.status(403).json({ error: 'Permission denied to manage this admin' });
        }

        await db.runAsync(
            'UPDATE users SET full_name = ?, email = ?, role = ?, university_id = ?, college_id = ?, department_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [full_name, email, role, university_id || null, college_id || null, department_id || null, req.params.id]
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle Active Status
router.patch('/:id/toggle', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { is_active } = req.body;
        const target = await db.getAsync('SELECT role FROM users WHERE id = ?', [req.params.id]);

        if (!target) return res.status(404).json({ error: 'Admin not found' });
        if (!canManageRole(req.user.role, target.role)) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        await db.runAsync('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Change Password for Admin
router.post('/:id/password', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { new_password } = req.body;
        const target = await db.getAsync('SELECT role FROM users WHERE id = ?', [req.params.id]);

        if (!target) return res.status(404).json({ error: 'Admin not found' });
        if (!canManageRole(req.user.role, target.role)) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await db.runAsync('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Admin
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const target = await db.getAsync('SELECT role FROM users WHERE id = ?', [req.params.id]);

        if (!target) return res.status(404).json({ error: 'Admin not found' });
        if (!canManageRole(req.user.role, target.role)) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        await db.runAsync('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
