const express = require('express');
const router = express.Router();
const { createWalkRequest } = require('../controllers/walkRequestsController');
const checkCashWeeklyLimit = require('../middleware/checkCashWeeklyLimit');

// Debug ping (opcional)
router.get('/ping', (req, res) => res.json({ ok: true, scope: 'walk-requests' }));

// Crear solicitud de paseo (aplica límite de 3h/semana para CASH)
router.post('/', checkCashWeeklyLimit, createWalkRequest);

module.exports = router;
