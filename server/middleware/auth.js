const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Middleware to check if user is admin (any level)
const isAdmin = (req, res, next) => {
    if (!req.user || !['super_admin', 'university_admin', 'college_admin', 'department_admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    next();
};

// Middleware to check specific permission
const checkPermission = (permissionKey) => {
    return async (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        // Super Admin has all permissions by default
        if (req.user.role === 'super_admin') return next();

        const db = require('../db');
        try {
            // 1. Check User Overrides
            const override = await db.getAsync(
                'SELECT is_enabled FROM user_permissions WHERE user_id = $1 AND permission_key = $2',
                [req.user.id, permissionKey]
            );

            if (override) {
                if (override.is_enabled === 1) return next();
                return res.status(403).json({ error: `Permission denied: ${permissionKey}` });
            }

            // 2. Check Role Permissions
            const rolePerm = await db.getAsync(
                'SELECT is_enabled FROM role_permissions WHERE role = $1 AND permission_key = $2',
                [req.user.role, permissionKey]
            );

            if (rolePerm && rolePerm.is_enabled === 1) return next();

            res.status(403).json({ error: `Permission denied: ${permissionKey}` });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};

module.exports = { authenticateToken, isAdmin, checkPermission };
