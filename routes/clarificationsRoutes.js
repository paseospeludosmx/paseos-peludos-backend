// routes/clarificationsRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/clarificationsController');

// POST /api/clarifications
router.post('/clarifications', ctrl.createClarification);
// GET /api/clarifications/open
router.get('/clarifications/open', ctrl.listOpen);
// POST /api/clarifications/:id/resolve
router.post('/clarifications/:id/resolve', ctrl.resolve);

module.exports = router;
