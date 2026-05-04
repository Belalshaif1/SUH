/**
 * @file server/routes/auth.js
 * @description Thin router for authentication endpoints.
 *              All business logic lives in controllers/auth.controller.js.
 */

const express = require('express');
const router  = express.Router();
const { authenticateToken, checkPermission } = require('../middleware/auth');
const ctrl = require('../controllers/auth.controller');

// Public routes
router.post('/login',               ctrl.login);
router.post('/register',            ctrl.register);
router.post('/send-register-code',  ctrl.sendRegisterCode);
router.post('/verify-register-code', ctrl.verifyRegisterCode);
router.post('/forgot-password',     ctrl.forgotPassword);
router.post('/verify-code',         ctrl.verifyCode);
router.post('/reset-password',      ctrl.resetPassword);

// Protected routes — require valid JWT
router.get('/me',              authenticateToken, ctrl.getMe);
router.put('/update',          authenticateToken, ctrl.updateProfile);
router.post('/update-password', authenticateToken, ctrl.updatePassword);
router.put('/change-password/:userId', authenticateToken, ctrl.changePassword);

// Admin user management
router.get('/users',    authenticateToken, checkPermission('manage_users'), ctrl.getUsers);
router.post('/users',   authenticateToken, checkPermission('manage_users'), ctrl.createUser);
router.put('/users/:id', authenticateToken, checkPermission('manage_users'), ctrl.updateUser);
router.delete('/users/:id', authenticateToken, checkPermission('manage_users'), ctrl.deleteUser);

module.exports = router;
