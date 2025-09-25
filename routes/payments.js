// backend/routes/payments.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentsController');

router.post('/intent', ctrl.createPaymentIntent);
router.post('/:id/proof', ctrl.uploadProof);
router.post('/:id/mark-paid', ctrl.markPaid);
router.post('/:id/mark-failed', ctrl.markFailed);

module.exports = router;
