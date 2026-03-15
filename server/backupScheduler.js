/**
 * @file backupScheduler.js
 * @description Automated backup system using node-cron.
 * Runs daily at 2:00 AM, dumps all DB tables to JSON, compresses to ZIP, and logs to backup_logs table.
 */

const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

// Ensure backups directory exists
const BACKUP_DIR = path.join(__dirname, 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Tables to include in backup
const TABLES = [
    'users', 'universities', 'colleges', 'departments',
    'announcements', 'graduates', 'research', 'jobs',
    'job_applications', 'fees', 'about_us',
    'role_permissions', 'user_permissions', 'services'
];

/**
 * Creates a full database backup.
 * @param {string} triggeredBy - Who triggered the backup ('scheduler' | 'manual')
 * @returns {Promise<{filename: string, path: string, size: number}>}
 */
async function createBackup(triggeredBy = 'scheduler') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const jsonFilename = `backup-${timestamp}.json`;
    const zipFilename = `backup-${timestamp}.zip`;
    const jsonPath = path.join(BACKUP_DIR, jsonFilename);
    const zipPath = path.join(BACKUP_DIR, zipFilename);

    console.log(`🔄 Starting backup [${triggeredBy}]...`);

    try {
        // 1. Dump all tables to JSON
        const backupData = {
            metadata: {
                created_at: new Date().toISOString(),
                triggered_by: triggeredBy,
                version: '1.0',
                tables: TABLES
            },
            data: {}
        };

        for (const table of TABLES) {
            try {
                const rows = await db.query(`SELECT * FROM ${table}`);
                backupData.data[table] = rows;
            } catch (e) {
                console.warn(`⚠️ Could not backup table "${table}": ${e.message}`);
                backupData.data[table] = [];
            }
        }

        // Write JSON file temporarily
        fs.writeFileSync(jsonPath, JSON.stringify(backupData, null, 2));

        // 2. Compress to ZIP
        await new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', resolve);
            archive.on('error', reject);

            archive.pipe(output);
            archive.file(jsonPath, { name: jsonFilename });
            archive.finalize();
        });

        // 3. Clean up uncompressed JSON
        fs.unlinkSync(jsonPath);

        const stats = fs.statSync(zipPath);
        const sizeBytes = stats.size;

        // 4. Log to DB
        await db.runAsync(
            `INSERT INTO backup_logs (id, filename, size_bytes, status, triggered_by) VALUES ($1, $2, $3, $4, $5)`,
            [uuidv4(), zipFilename, sizeBytes, 'success', triggeredBy]
        );

        // 5. Keep only last 10 backups
        await cleanOldBackups();

        console.log(`✅ Backup completed: ${zipFilename} (${(sizeBytes / 1024).toFixed(1)} KB)`);
        return { filename: zipFilename, path: zipPath, size: sizeBytes };

    } catch (err) {
        console.error('❌ Backup failed:', err.message);

        // Log failure
        try {
            await db.runAsync(
                `INSERT INTO backup_logs (id, filename, size_bytes, status, triggered_by) VALUES ($1, $2, $3, $4, $5)`,
                [uuidv4(), zipFilename, 0, 'failed', triggeredBy]
            );
        } catch (logErr) {
            console.error('Could not log backup failure:', logErr.message);
        }

        throw err;
    }
}

/**
 * Delete old backups — keeps only the 10 most recent.
 */
async function cleanOldBackups() {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.zip'))
            .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        // Remove files beyond the 10 most recent
        const toDelete = files.slice(10);
        for (const file of toDelete) {
            fs.unlinkSync(path.join(BACKUP_DIR, file.name));
            console.log(`🗑️ Removed old backup: ${file.name}`);
        }
    } catch (e) {
        console.warn('Could not clean old backups:', e.message);
    }
}

/**
 * Initialize the cron scheduler.
 * Runs daily at 2:00 AM server time.
 */
function initBackupScheduler() {
    // Schedule: every day at 02:00 AM
    cron.schedule('0 2 * * *', async () => {
        console.log('⏰ Running scheduled backup...');
        try {
            await createBackup('scheduler');
        } catch (err) {
            console.error('Scheduled backup failed:', err.message);
        }
    });

    console.log('📅 Backup scheduler initialized (daily at 02:00 AM)');
}

module.exports = { createBackup, initBackupScheduler, BACKUP_DIR };
