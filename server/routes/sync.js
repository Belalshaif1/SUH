/**
 * @file server/routes/sync.js
 * @description Thin router for offline sync endpoints.
 */

const express = require('express');
const router  = express.Router();
const ctrl = require('../controllers/sync.controller');

router.get('/pull',  ctrl.pull);
router.post('/push', ctrl.push);

module.exports = router;
