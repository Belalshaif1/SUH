/**
 * @file server/routes/announcements.js
 * @description Thin router for announcement endpoints.
 */

const express = require('express');
const router  = express.Router();
const { authenticateToken, checkPermission } = require('../middleware/auth');
const ctrl = require('../controllers/announcements.controller');

router.get('/',     ctrl.getAll);
router.get('/:id',  ctrl.getById);
router.post('/',    authenticateToken, checkPermission('manage_announcements'), ctrl.create);
router.put('/:id',  authenticateToken, checkPermission('manage_announcements'), ctrl.update);
router.delete('/:id', authenticateToken, checkPermission('manage_announcements'), ctrl.remove);

module.exports = router;
