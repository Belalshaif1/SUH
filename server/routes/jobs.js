/**
 * @file server/routes/jobs.js
 * @description Thin router for job endpoints.
 */

const express = require('express');
const router  = express.Router();
const { authenticateToken, checkPermission } = require('../middleware/auth');
const ctrl = require('../controllers/jobs.controller');

router.get('/',     ctrl.getAll);
router.post('/',    authenticateToken, checkPermission('manage_jobs'), ctrl.create);
router.put('/:id',  authenticateToken, checkPermission('manage_jobs'), ctrl.update);
router.delete('/:id', authenticateToken, checkPermission('manage_jobs'), ctrl.remove);

module.exports = router;
