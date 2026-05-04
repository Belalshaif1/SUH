/**
 * @file server/routes/research.js
 * @description Thin router for research endpoints.
 */

const express = require('express');
const router  = express.Router();
const { authenticateToken, checkPermission } = require('../middleware/auth');
const ctrl = require('../controllers/research.controller');

router.get('/',     ctrl.getAll);
router.post('/',    authenticateToken, checkPermission('manage_research'), ctrl.create);
router.put('/:id',  authenticateToken, checkPermission('manage_research'), ctrl.update);
router.delete('/:id', authenticateToken, checkPermission('manage_research'), ctrl.remove);

module.exports = router;
