/**
 * @file server/routes/uploads.js
 * @description Thin router for file upload endpoints.
 */

const express = require('express');
const router  = express.Router();
const { upload, uploadFile } = require('../controllers/uploads.controller');

router.post('/', upload.single('file'), uploadFile);

module.exports = router;
