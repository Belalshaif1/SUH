/**
 * @file server/routes/admins.js
 * @description Thin router for admin management endpoints.
 */

const express = require('express');
const router  = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/admins.controller');

router.get('/',              authenticateToken, isAdmin, ctrl.getAll);
router.post('/',             authenticateToken, isAdmin, ctrl.create);
router.put('/:id',           authenticateToken, isAdmin, ctrl.update);
router.patch('/:id/toggle',  authenticateToken, isAdmin, ctrl.toggle);
router.post('/:id/password', authenticateToken, isAdmin, ctrl.changePassword);
router.delete('/:id',        authenticateToken, isAdmin, ctrl.remove);

module.exports = router;
