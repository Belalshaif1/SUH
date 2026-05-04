/**
 * @file server/routes/universities.js
 * @description Thin router for university endpoints.
 */

const express = require('express');
const router  = express.Router();
const { authenticateToken, checkPermission } = require('../middleware/auth');
const ctrl = require('../controllers/universities.controller');

router.get('/',     ctrl.getAll);
router.get('/:id',  ctrl.getById);
router.post('/',    authenticateToken, checkPermission('manage_universities'), ctrl.create);
router.put('/:id',  authenticateToken, ctrl.update);
router.delete('/:id', authenticateToken, checkPermission('manage_universities'), ctrl.remove);

module.exports = router;
