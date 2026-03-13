const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// Get applications for a specific job (For Admins)
router.get('/job/:jobId', authenticateToken, async (req, res) => {
    try {
        const job = await db.getAsync(`
            SELECT j.id, c.university_id, j.college_id 
            FROM jobs j 
            JOIN colleges c ON j.college_id = c.id 
            WHERE j.id = $1`, [req.params.jobId]);

        if (!job) return res.status(404).json({ error: 'Job not found' });

        if (req.user.role !== 'super_admin') {
            if (req.user.university_id && job.university_id !== req.user.university_id) {
                return res.status(403).json({ error: 'Access denied: Out of scope' });
            }
            if (req.user.role === 'college_admin' && req.user.college_id !== job.college_id) {
                return res.status(403).json({ error: 'Access denied: Out of scope' });
            }
        }

        const applications = await db.query(`
            SELECT a.*, u.full_name as applicant_name, u.email as applicant_email 
            FROM job_applications a 
            JOIN users u ON a.user_id = u.id 
            WHERE a.job_id = $1 
            ORDER BY a.created_at DESC`, [req.params.jobId]);

        res.json(applications);
    } catch (err) {
        console.error('Get job applications error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Apply for a job (For Regular Users)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { job_id, file_url } = req.body;

        if (!job_id || !file_url) {
            return res.status(400).json({ error: 'Missing job_id or file_url' });
        }

        const existing = await db.getAsync(
            'SELECT id FROM job_applications WHERE job_id = $1 AND user_id = $2',
            [job_id, req.user.id]
        );
        if (existing) {
            return res.status(400).json({ error: 'You have already applied for this job' });
        }

        const id = uuidv4();
        await db.runAsync(
            'INSERT INTO job_applications (id, job_id, user_id, file_url, status) VALUES ($1, $2, $3, $4, $5)',
            [id, job_id, req.user.id, file_url, 'pending']
        );

        const jobInfo = await db.getAsync(`
            SELECT j.title_ar, j.college_id, c.university_id 
            FROM jobs j 
            JOIN colleges c ON j.college_id = c.id 
            WHERE j.id = $1`, [job_id]);

        if (jobInfo) {
            const admins = await db.query(`
                SELECT id FROM users 
                WHERE (role = 'college_admin' AND college_id = $1) 
                OR (role = 'university_admin' AND university_id = $2)
                OR (role = 'super_admin')`, [jobInfo.college_id, jobInfo.university_id]);

            for (const admin of admins) {
                const msgId = uuidv4();
                await db.runAsync(
                    'INSERT INTO messages (id, sender_id, receiver_id, content) VALUES ($1, $2, $3, $4)',
                    [msgId, req.user.id, admin.id, `هناك طلب تقديم جديد على وظيفة: ${jobInfo.title_ar}`]
                );
            }
        }

        res.json({ id, success: true });
    } catch (err) {
        console.error('Apply for job error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update application status (For Admins)
router.put('/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const target = await db.getAsync(`
            SELECT a.*, j.title_ar as job_title, j.college_id 
            FROM job_applications a 
            JOIN jobs j ON a.job_id = j.id 
            WHERE a.id = $1`, [req.params.id]);

        if (!target) return res.status(404).json({ error: 'Application not found' });

        await db.runAsync(
            'UPDATE job_applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [status, req.params.id]
        );

        const statusText = status === 'accepted' ? 'قبول' : 'رفض';
        const msgId = uuidv4();
        await db.runAsync(
            'INSERT INTO messages (id, sender_id, receiver_id, content) VALUES ($1, $2, $3, $4)',
            [msgId, req.user.id, target.user_id, `تم ${statusText} طلبك للوظيفة: ${target.job_title}`]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Update application status error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
