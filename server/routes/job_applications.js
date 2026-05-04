/**
 * @file server/routes/job_applications.js
 * @description Thin router for job applications endpoints.
 */

const express = require('express');
const router  = express.Router();
const { authenticateToken } = require('../middleware/auth');
const ctrl = require('../controllers/job_applications.controller');

router.get('/job/:jobId',    authenticateToken, ctrl.getByJob);
router.post('/',             authenticateToken, ctrl.apply);
router.put('/:id/status',   authenticateToken, ctrl.updateStatus);

module.exports = router;
