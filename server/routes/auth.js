const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Helper to get merged permissions
async function getEffectivePermissions(userId, role) {
    const rolePerms = await db.query('SELECT permission_key, is_enabled FROM role_permissions WHERE role = ?', [role]);
    const userOverrides = await db.query('SELECT permission_key, is_enabled FROM user_permissions WHERE user_id = ?', [userId]);

    const permissions = {};
    rolePerms.forEach(p => {
        permissions[p.permission_key] = p.is_enabled === 1;
    });
    userOverrides.forEach(p => {
        permissions[p.permission_key] = p.is_enabled === 1;
    });
    return permissions;
}

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const user = await db.getAsync('SELECT * FROM users WHERE email = ? OR phone = ?', [identifier, identifier]);

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is inactive' });
        }

        const token = jwt.sign({
            id: user.id,
            role: user.role,
            university_id: user.university_id,
            college_id: user.college_id,
            department_id: user.department_id
        }, JWT_SECRET, { expiresIn: '24h' });

        const permissions = await getEffectivePermissions(user.id, user.role);

        res.json({
            token, user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                avatar_url: user.avatar_url,
                phone: user.phone,
                university_id: user.university_id,
                college_id: user.college_id,
                department_id: user.department_id,
                permissions
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Register Route
router.post('/register', async (req, res) => {
    try {
        const { email, phone, password, full_name } = req.body;
        const { v4: uuidv4 } = require('uuid');

        if (!email && !phone) {
            return res.status(400).json({ error: 'Email or Phone is required' });
        }

        // Check if user already exists
        let existingUser;
        if (email) {
            existingUser = await db.getAsync('SELECT id FROM users WHERE email = ?', [email]);
        } else if (phone) {
            existingUser = await db.getAsync('SELECT id FROM users WHERE phone = ?', [phone]);
        }

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.runAsync(
            'INSERT INTO users (id, email, phone, password, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, email || null, phone || null, hashedPassword, full_name, 'user', 1]
        );

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update User Profile
router.put('/update', require('../middleware/auth').authenticateToken, async (req, res) => {
    try {
        const { full_name, phone, avatar_url } = req.body;
        await db.runAsync(
            'UPDATE users SET full_name = ?, phone = ?, avatar_url = ? WHERE id = ?',
            [full_name, phone, avatar_url, req.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get User Profile
router.get('/me', require('../middleware/auth').authenticateToken, async (req, res) => {
    try {
        const user = await db.getAsync('SELECT id, email, full_name, avatar_url, phone, role, is_active, university_id, college_id, department_id FROM users WHERE id = ?', [req.user.id]);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const permissions = await getEffectivePermissions(user.id, user.role);
        res.json({ ...user, permissions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Password
router.post('/update-password', require('../middleware/auth').authenticateToken, async (req, res) => {
    try {
        const { new_password } = req.body;
        const hashedPassword = await bcrypt.hash(new_password, 10);
        await db.runAsync('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all users (Admin only, filtered by scope)
router.get('/users', require('../middleware/auth').authenticateToken, require('../middleware/auth').checkPermission('manage_users'), async (req, res) => {
    try {
        let sql = 'SELECT id, email, full_name, avatar_url, phone, role, is_active, created_at FROM users';
        let params = [];

        if (req.user.role !== 'super_admin') {
            sql += ' WHERE (university_id = ? AND ? IS NOT NULL) OR (college_id = ? AND ? IS NOT NULL) OR (department_id = ? AND ? IS NOT NULL) OR (created_by = ?)';
            params.push(
                req.user.university_id, req.user.university_id,
                req.user.college_id, req.user.college_id,
                req.user.department_id, req.user.department_id,
                req.user.id
            );
        }

        sql += ' ORDER BY created_at DESC';
        const users = await db.query(sql, params);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update user (Admin only, scope-check)
router.put('/users/:id', require('../middleware/auth').authenticateToken, require('../middleware/auth').checkPermission('manage_users'), async (req, res) => {
    try {
        const { full_name, role, is_active, phone } = req.body;
        const target = await db.getAsync('SELECT role, university_id, college_id, department_id FROM users WHERE id = ?', [req.params.id]);

        if (!target) return res.status(404).json({ error: 'User not found' });

        // Scope check for non-super-admins
        if (req.user.role !== 'super_admin') {
            const hasAccess = (target.university_id === req.user.university_id && req.user.university_id) ||
                (target.college_id === req.user.college_id && req.user.college_id) ||
                (target.department_id === req.user.department_id && req.user.department_id);
            if (!hasAccess) return res.status(403).json({ error: 'Access denied: Out of scope' });
        }

        await db.runAsync(
            'UPDATE users SET full_name = ?, role = ?, is_active = ?, phone = ? WHERE id = ?',
            [full_name, role, is_active ? 1 : 0, phone, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create user (Admin only, scope-check)
router.post('/users', require('../middleware/auth').authenticateToken, require('../middleware/auth').checkPermission('manage_users'), async (req, res) => {
    try {
        const { email, password, full_name, role, phone, university_id, college_id, department_id } = req.body;

        // Ensure non-super-admins only create within their scope
        if (req.user.role !== 'super_admin') {
            if (university_id !== req.user.university_id && college_id !== req.user.college_id && department_id !== req.user.department_id) {
                return res.status(403).json({ error: 'Access denied: Cannot create user outside your scope' });
            }
        }
        const { v4: uuidv4 } = require('uuid');

        const existingUser = await db.getAsync('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.runAsync(
            'INSERT INTO users (id, email, password, full_name, role, phone, university_id, college_id, department_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
            [userId, email, hashedPassword, full_name, role || 'user', phone, university_id, college_id, department_id]
        );

        res.status(201).json({ id: userId, message: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete user (Admin only, scope-check)
router.delete('/users/:id', require('../middleware/auth').authenticateToken, require('../middleware/auth').checkPermission('manage_users'), async (req, res) => {
    try {
        const target = await db.getAsync('SELECT id, university_id, college_id, department_id FROM users WHERE id = ?', [req.params.id]);
        if (!target) return res.status(404).json({ error: 'User not found' });

        if (req.user.role !== 'super_admin') {
            const hasAccess = (target.university_id === req.user.university_id && req.user.university_id) ||
                (target.college_id === req.user.college_id && req.user.college_id) ||
                (target.department_id === req.user.department_id && req.user.department_id);
            if (!hasAccess) return res.status(403).json({ error: 'Access denied: Out of scope' });
        }

        await db.runAsync('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Change password
router.put('/change-password/:userId', require('../middleware/auth').authenticateToken, async (req, res) => {
    try {
        const { newPassword, oldPassword } = req.body;
        const targetId = req.params.userId;
        const isSelf = req.user.id === targetId;

        const target = await db.getAsync('SELECT id, password, university_id, college_id, department_id, role, created_by FROM users WHERE id = ?', [targetId]);
        if (!target) return res.status(404).json({ error: 'User not found' });

        if (!isSelf) {
            // Check hierarchy if not self
            if (req.user.role !== 'super_admin') {
                const isAdminOfTarget = target.created_by === req.user.id ||
                    (req.user.role === 'university_admin' && target.university_id === req.user.university_id) ||
                    (req.user.role === 'college_admin' && target.college_id === req.user.college_id);

                if (!isAdminOfTarget) {
                    return res.status(403).json({ error: 'Access denied: Cannot change password for this user' });
                }
            }
        } else {
            // If self, verify old password
            if (!oldPassword) return res.status(400).json({ error: 'Old password required' });
            const valid = await bcrypt.compare(oldPassword, target.password);
            if (!valid) return res.status(400).json({ error: 'Incorrect old password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.runAsync('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, targetId]);

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { identifier } = req.body; // email or phone
        const user = await db.getAsync('SELECT id, email, phone FROM users WHERE email = ? OR phone = ?', [identifier, identifier]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Mock sending code
        const mockCode = '1234';
        console.log(`[MOCK AUTH] Sending code ${mockCode} to ${user.email || user.phone}`);

        res.json({
            success: true,
            message: 'Verification code sent',
            context_id: user.id // In real app, this would be a temp session ID
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify Recovery Code
router.post('/verify-code', async (req, res) => {
    try {
        const { context_id, code } = req.body;

        if (code === '1234') {
            res.json({ success: true, message: 'Code verified' });
        } else {
            res.status(400).json({ error: 'Invalid verification code' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { context_id, code, new_password } = req.body;

        if (code !== '1234') {
            return res.status(400).json({ error: 'Invalid or expired code' });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await db.runAsync('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, context_id]);

        res.json({ success: true, message: 'Password reset successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
