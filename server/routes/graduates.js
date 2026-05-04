/**
 * @file server/routes/graduates.js
 * @description Thin router for graduate endpoints.
 */

const express = require('express');
const router  = express.Router();
const { authenticateToken, checkPermission } = require('../middleware/auth');
const ctrl = require('../controllers/graduates.controller');

router.get('/',     ctrl.getAll);
router.post('/',    authenticateToken, checkPermission('manage_graduates'), ctrl.create);
router.put('/:id',  authenticateToken, checkPermission('manage_graduates'), ctrl.update);
router.delete('/:id', authenticateToken, checkPermission('manage_graduates'), ctrl.remove);

module.exports = router;
