/**
 * @file server/routes/about.js
 * @description Thin router for about-page CMS endpoints.
 */

const express = require('express');
const router  = express.Router();
const { authenticateToken } = require('../middleware/auth');
const ctrl = require('../controllers/about.controller');

router.get('/',  ctrl.get);
router.put('/',  authenticateToken, ctrl.upsert);

module.exports = router;
