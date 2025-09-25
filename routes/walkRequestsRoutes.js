// routes/walkRequestsRoutes.js
const express = require('express');
const router = express.Router();

// IMPORTA del directorio con nombre plural "middlewares"
const checkCashWeeklyLimit = require('../middlewares/checkCashWeeklyLimit.js');

// IMPORTA el controlador como objeto completo (evita fallas de destructuring)
const walkReqCtrl = require('../controllers/walkRequestsController.js');

// Ping de debug
router.get('/walk-requests/ping', (req, res) => res.json({ ok: true }));

// Chequeo extra de arranque (si algo está mal, lo verás en consola del server)
if (!walkReqCtrl || typeof walkReqCtrl.createWalkRequest !== 'function') {
  console.error('[walkRequestsRoutes] createWalkRequest NO está definido. ' +
                'Revisa controllers/walkRequestsController.js');
}

// POST /api/walk-requests
router.post('/walk-requests', checkCashWeeklyLimit, walkReqCtrl.createWalkRequest);

module.exports = router;
