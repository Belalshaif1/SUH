/**
 * @file server/routes/permissions.js
 * @description Thin router for role permissions endpoints.
 */

const express = require('express');
const router  = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/permissions.controller');

router.get('/',              authenticateToken, isAdmin, ctrl.getAll);
router.put('/',              authenticateToken, isAdmin, ctrl.updateBulk);
router.get('/matrix',        authenticateToken, isAdmin, ctrl.getMatrix);
router.get('/user/:userId',  authenticateToken, isAdmin, ctrl.getUserPermissions);
router.put('/user/:userId',  authenticateToken, isAdmin, ctrl.updateUserPermissions);

module.exports = router;
