/**
 * @file server/routes/colleges.js
 * @description Thin router for college endpoints.
 */

const express = require('express');
const router  = express.Router();
const { authenticateToken, checkPermission } = require('../middleware/auth');
const ctrl = require('../controllers/colleges.controller');

router.get('/',     ctrl.getAll);
router.get('/:id',  ctrl.getById);
router.post('/',    authenticateToken, checkPermission('manage_colleges'), ctrl.create);
router.put('/:id',  authenticateToken, checkPermission('manage_colleges'), ctrl.update);
router.delete('/:id', authenticateToken, checkPermission('manage_colleges'), ctrl.remove);

module.exports = router;
