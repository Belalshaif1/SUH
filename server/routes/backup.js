/**
 * @file server/routes/backup.js
 * @description Thin router for backup endpoints. All routes are Super Admin only.
 */

const express = require('express');
const router  = express.Router();
const { authenticateToken } = require('../middleware/auth');
const ctrl = require('../controllers/backup.controller');

// Middleware: restrict all backup routes to Super Admin
const requireSuperAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Access denied. Super Admin only.' });
    }
    next();
};

router.post('/trigger',            authenticateToken, requireSuperAdmin, ctrl.trigger);
router.get('/logs',                authenticateToken, requireSuperAdmin, ctrl.getLogs);
router.get('/list',                authenticateToken, requireSuperAdmin, ctrl.list);
router.get('/download/:filename',  authenticateToken, requireSuperAdmin, ctrl.download);
router.delete('/:filename',        authenticateToken, requireSuperAdmin, ctrl.remove);

module.exports = router;
