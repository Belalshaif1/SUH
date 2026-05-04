/**
 * @file server/controllers/uploads.controller.js
 * @description Business logic for file uploads via multer.
 */

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Configure disk storage — files saved to server/uploads/
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

/** Multer middleware instance — use as route-level middleware */
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

/** POST /api/upload */
function uploadFile(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ url: fileUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { upload, uploadFile };
