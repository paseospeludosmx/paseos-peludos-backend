// backend/routes/clarifications.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/clarificationsController');

router.post('/', ctrl.createClarification);
router.get('/open', ctrl.listOpen);
router.post('/:id/resolve', ctrl.resolve);

module.exports = router;
