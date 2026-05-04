/**
 * @file server/routes/services.js
 * @description Thin router for service endpoints.
 */

const express = require('express');
const router  = express.Router();
const ctrl = require('../controllers/services.controller');

router.get('/',     ctrl.getAll);
router.post('/',    ctrl.create);
router.put('/:id',  ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
