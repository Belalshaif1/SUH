const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Get all permissions
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const permissions = await db.query('SELECT * FROM role_permissions ORDER BY role, permission_key');
        res.json(permissions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update permissions in bulk
router.put('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const updates = req.body; // Array of { id, is_enabled }
        if (!Array.isArray(updates)) return res.status(400).json({ error: 'Body must be an array' });

        for (const update of updates) {
            await db.runAsync('UPDATE role_permissions SET is_enabled = ? WHERE id = ?', [update.is_enabled ? 1 : 0, update.id]);
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get permissions for a specific user
router.get('/user/:userId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        // Fetch base role permissions AND user overrides
        const user = await db.getAsync('SELECT role FROM users WHERE id = ?', [userId]);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const rolePermissions = await db.query('SELECT * FROM role_permissions WHERE role = ?', [user.role]);
        const userOverrides = await db.query('SELECT * FROM user_permissions WHERE user_id = ?', [userId]);

        res.json({ role_permissions: rolePermissions, overrides: userOverrides });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update permissions for a specific user (Override)
router.put('/user/:userId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { overrides } = req.body; // Array of { permission_key, is_enabled }
        const { v4: uuidv4 } = require('uuid');

        for (const ov of overrides) {
            const existing = await db.getAsync('SELECT id FROM user_permissions WHERE user_id = ? AND permission_key = ?', [userId, ov.permission_key]);
            if (existing) {
                await db.runAsync('UPDATE user_permissions SET is_enabled = ? WHERE id = ?', [ov.is_enabled ? 1 : 0, existing.id]);
            } else {
                await db.runAsync('INSERT INTO user_permissions (id, user_id, permission_key, is_enabled) VALUES (?, ?, ?, ?)',
                    [uuidv4(), userId, ov.permission_key, ov.is_enabled ? 1 : 0]);
            }
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Permissions Matrix (All admins and their effective permissions)
router.get('/matrix', authenticateToken, isAdmin, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Only Super Admin can view the permissions matrix' });
        }

        const admins = await db.query('SELECT id, email, full_name, role FROM users WHERE role != "user"');
        const rolePermsRaw = await db.query('SELECT role, permission_key, is_enabled FROM role_permissions');
        const userOverridesRaw = await db.query('SELECT user_id, permission_key, is_enabled FROM user_permissions');

        const matrix = admins.map(admin => {
            const perms = {};

            // Apply role defaults
            rolePermsRaw.filter(rp => rp.role === admin.role).forEach(rp => {
                perms[rp.permission_key] = rp.is_enabled === 1;
            });

            // Apply user overrides
            userOverridesRaw.filter(uo => uo.user_id === admin.id).forEach(uo => {
                perms[uo.permission_key] = uo.is_enabled === 1;
            });

            return {
                ...admin,
                permissions: perms
            };
        });

        res.json(matrix);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
