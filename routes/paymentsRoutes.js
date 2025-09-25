// routes/paymentsRoutes.js
const express = require('express');
const router = express.Router();

// Importa con .js explícito para evitar ambigüedades
const ctrl = require('../controllers/paymentsController.js');

// Ping (debug)
router.get('/payments/ping', (req, res) => res.json({ ok: true, scope: 'payments' }));

// ===== Helper de seguridad: asegura que cada handler exista =====
function ensure(fnName) {
  const fn = ctrl && ctrl[fnName];
  if (typeof fn !== 'function') {
    console.error(`[paymentsRoutes] ${fnName} NO está definido. Revisa controllers/paymentsController.js`);
    return (req, res) => res.status(500).json({ error: `Handler ${fnName} no definido` });
  }
  return fn;
}

// ===== Rutas =====
router.post('/payments/intent',        ensure('createPaymentIntent'));
router.post('/payments/:id/proof',     ensure('uploadProof'));
router.post('/payments/:id/mark-paid', ensure('markPaid'));
router.post('/payments/:id/mark-failed', ensure('markFailed'));

// Admin
router.get('/payments/under-review',   ensure('listUnderReview'));
router.get('/payments/:id',            ensure('getById'));

module.exports = router;
