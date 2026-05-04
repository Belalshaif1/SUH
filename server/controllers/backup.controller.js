/**
 * @file server/controllers/backup.controller.js
 * @description Business logic for database backup operations.
 *              All operations are restricted to Super Admin.
 */

const path = require('path');
const fs   = require('fs');
const db   = require('../config/db');
const { createBackup, BACKUP_DIR } = require('../backupScheduler');

/** POST /api/backup/trigger */
async function trigger(req, res) {
    try {
        const result = await createBackup('manual');
        res.json({
            success:    true,
            message:    'Backup created successfully',
            filename:   result.filename,
            size_bytes: result.size,
        });
    } catch (err) {
        console.error('Manual backup error:', err);
        res.status(500).json({ error: 'Backup failed: ' + err.message });
    }
}

/** GET /api/backup/logs */
async function getLogs(req, res) {
    try {
        const logs = await db.query('SELECT * FROM backup_logs ORDER BY created_at DESC LIMIT 50');
        res.json(logs);
    } catch (err) {
        console.error('Get backup logs error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/** GET /api/backup/list */
function list(req, res) {
    try {
        if (!fs.existsSync(BACKUP_DIR)) return res.json([]);

        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.zip'))
            .map(f => {
                const stat = fs.statSync(path.join(BACKUP_DIR, f));
                return { filename: f, size_bytes: stat.size, created_at: stat.mtime };
            })
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json(files);
    } catch (err) {
        console.error('List backups error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/** GET /api/backup/download/:filename */
function download(req, res) {
    try {
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
}

/** DELETE /api/backup/:filename */
function remove(req, res) {
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
}

module.exports = { trigger, getLogs, list, download, remove };
