/**
 * @file server/routes/error_logs.js
 * @description Thin router for error log endpoints.
 */

const express = require('express');
const router  = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/error_logs.controller');

router.get('/',  authenticateToken, isAdmin, ctrl.getAll);
router.post('/', ctrl.create); // Called by the frontend error boundary (no auth required)

module.exports = router;
