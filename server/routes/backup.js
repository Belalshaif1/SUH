/**
 * @file routes/backup.js
 * @description API endpoints for the backup system.
 * All routes are restricted to Super Admin only.
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { createBackup, BACKUP_DIR } = require('../backupScheduler');

// Middleware: All backup routes require Super Admin
const requireSuperAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Access denied. Super Admin only.' });
    }
    next();
};

/**
 * POST /api/backup/trigger
 * Manually trigger a backup immediately.
 */
router.post('/trigger', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const result = await createBackup('manual');
        res.json({
            success: true,
            message: 'Backup created successfully',
            filename: result.filename,
            size_bytes: result.size
        });
    } catch (err) {
        console.error('Manual backup error:', err);
        res.status(500).json({ error: 'Backup failed: ' + err.message });
    }
});

/**
 * GET /api/backup/logs
 * Get the history of all backup operations.
 */
router.get('/logs', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const logs = await db.query(
            'SELECT * FROM backup_logs ORDER BY created_at DESC LIMIT 50'
        );
        res.json(logs);
    } catch (err) {
        console.error('Get backup logs error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/backup/list
 * List available backup files.
 */
router.get('/list', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            return res.json([]);
        }

        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.zip'))
            .map(f => {
                const stat = fs.statSync(path.join(BACKUP_DIR, f));
                return {
                    filename: f,
                    size_bytes: stat.size,
                    created_at: stat.mtime
                };
            })
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json(files);
    } catch (err) {
        console.error('List backups error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/backup/download/:filename
 * Download a specific backup file.
 */
router.get('/download/:filename', authenticateToken, requireSuperAdmin, (req, res) => {
    try {
        // Sanitize filename to prevent path traversal
        const filename = path.basename(req.params.filename);
        if (!filename.endsWith('.zip') || filename.includes('..')) {
            return res.status(400).json({ error: 'Invalid filename' });
        }

        const filePath = path.join(BACKUP_DIR, filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Backup file not found' });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/zip');
        fs.createReadStream(filePath).pipe(res);
    } catch (err) {
        console.error('Download backup error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/backup/:filename
 * Delete a specific backup file.
 */
router.delete('/:filename', authenticateToken, requireSuperAdmin, (req, res) => {
    try {
        const filename = path.basename(req.params.filename);
        if (!filename.endsWith('.zip') || filename.includes('..')) {
            return res.status(400).json({ error: 'Invalid filename' });
        }

        const filePath = path.join(BACKUP_DIR, filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Backup file not found' });
        }

        fs.unlinkSync(filePath);
        res.json({ success: true, message: 'Backup deleted' });
    } catch (err) {
        console.error('Delete backup error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
