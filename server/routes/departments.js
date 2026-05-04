/**
 * @file server/routes/departments.js
 * @description Thin router for department endpoints.
 */

const express = require('express');
const router  = express.Router();
const { authenticateToken, checkPermission } = require('../middleware/auth');
const ctrl = require('../controllers/departments.controller');

router.get('/',     ctrl.getAll);
router.get('/:id',  ctrl.getById);
router.post('/',    authenticateToken, checkPermission('manage_departments'), ctrl.create);
router.put('/:id',  authenticateToken, checkPermission('manage_departments'), ctrl.update);
router.delete('/:id', authenticateToken, checkPermission('manage_departments'), ctrl.remove);

module.exports = router;
