/**
 * @file server/routes/messages.js
 * @description Thin router for message endpoints.
 */

const express = require('express');
const router  = express.Router();
const ctrl = require('../controllers/messages.controller');

router.get('/:userId',  ctrl.getByUser);
router.post('/',        ctrl.create);
router.patch('/:id',    ctrl.update);
router.delete('/:id',   ctrl.remove);

module.exports = router;
