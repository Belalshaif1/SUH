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
        console.error('Get permissions error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update permissions in bulk
router.put('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const updates = req.body;
        if (!Array.isArray(updates)) return res.status(400).json({ error: 'Body must be an array' });

        for (const update of updates) {
            await db.runAsync(
                'UPDATE role_permissions SET is_enabled = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [update.is_enabled ? 1 : 0, update.id]
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Update permissions error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get permissions for a specific user
router.get('/user/:userId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await db.getAsync('SELECT role FROM users WHERE id = $1', [userId]);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const rolePermissions = await db.query('SELECT * FROM role_permissions WHERE role = $1', [user.role]);
        const userOverrides = await db.query('SELECT * FROM user_permissions WHERE user_id = $1', [userId]);

        res.json({ role_permissions: rolePermissions, overrides: userOverrides });
    } catch (err) {
        console.error('Get user permissions error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update permissions for a specific user (Override)
router.put('/user/:userId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { overrides } = req.body;
        const { v4: uuidv4 } = require('uuid');

        for (const ov of overrides) {
            const existing = await db.getAsync(
                'SELECT id FROM user_permissions WHERE user_id = $1 AND permission_key = $2',
                [userId, ov.permission_key]
            );
            if (existing) {
                await db.runAsync(
                    'UPDATE user_permissions SET is_enabled = $1 WHERE id = $2',
                    [ov.is_enabled ? 1 : 0, existing.id]
                );
            } else {
                await db.runAsync(
                    'INSERT INTO user_permissions (id, user_id, permission_key, is_enabled) VALUES ($1, $2, $3, $4)',
                    [uuidv4(), userId, ov.permission_key, ov.is_enabled ? 1 : 0]
                );
            }
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Update user permissions error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Permissions Matrix
router.get('/matrix', authenticateToken, isAdmin, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Only Super Admin can view the permissions matrix' });
        }




        // استخدام single quotes بدلاً من double quotes للنص في PostgreSQL
        const admins = await db.query("SELECT id, email, full_name, role FROM users WHERE role != 'user'");
        const rolePermsRaw = await db.query('SELECT role, permission_key, is_enabled FROM role_permissions');
        const userOverridesRaw = await db.query('SELECT user_id, permission_key, is_enabled FROM user_permissions');

        const matrix = admins.map(admin => {
            const perms = {};

            rolePermsRaw.filter(rp => rp.role === admin.role).forEach(rp => {
                perms[rp.permission_key] = rp.is_enabled === 1;
            });

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
        console.error('Get permissions matrix error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
