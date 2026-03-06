const express = require('express');
const router = express.Router();
const db = require('../db');

const SYNC_TABLES = [
    'universities',
    'colleges',
    'departments',
    'announcements',
    'research',
    'graduates',
    'jobs'
];

/**
 * GET /api/sync/pull
 * Returns records updated after the provided lastSync timestamp.
 */
router.get('/pull', async (req, res) => {
    const { lastSync } = req.query;
    const lastSyncDate = lastSync ? new Date(parseInt(lastSync)) : new Date(0);

    try {
        let allUpdates = [];

        for (const table of SYNC_TABLES) {
            const updates = await db.query(
                `SELECT * FROM ${table} WHERE updated_at > $1`,
                [lastSyncDate]
            );

            updates.forEach(row => {
                allUpdates.push({
                    table,
                    data: row
                });
            });
        }

        res.json(allUpdates);
    } catch (error) {
        console.error('Pull Sync Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch updates' });
    }
});

/**
 * POST /api/sync/push
 * Applies client-side mutations to the database.
 */
router.post('/push', async (req, res) => {
    const { mutations } = req.body;

    if (!mutations || !Array.isArray(mutations)) {
        return res.status(400).json({ error: 'Invalid mutations' });
    }

    try {
        for (const mutation of mutations) {
            const { table, action, data } = mutation;
            if (!SYNC_TABLES.includes(table)) continue;

            if (action === 'create' || action === 'update') {
                const keys = Object.keys(data).filter(k => k !== 'updated_at');
                const values = keys.map(k => data[k]);
                const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
                const updates = keys.map((k, i) => `${k} = EXCLUDED.${k}`).join(', ');

                await db.query(`
                    INSERT INTO ${table} (${keys.join(', ')})
                    VALUES (${placeholders})
                    ON CONFLICT (id) DO UPDATE SET ${updates}, updated_at = CURRENT_TIMESTAMP
                `, values);
            } else if (action === 'delete') {
                await db.query(`DELETE FROM ${table} WHERE id = $1`, [data.id]);
            }
        }

        res.json({ success: true, message: 'Mutations applied successfully' });
    } catch (error) {
        console.error('Push Sync Error:', error.message);
        res.status(500).json({ error: 'Failed to apply mutations' });
    }
});

module.exports = router;
