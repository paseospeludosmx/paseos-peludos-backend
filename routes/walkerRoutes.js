// routes/walkerRoutes.js
const express = require('express');
const router = express.Router();
const Walker = require('../models/Walker.js');

// GET /api/walkers?zone=Roma&day=sat
router.get('/walkers', async (req, res) => {
  try {
    const { zone, day } = req.query;
    const q = {};
    if (zone) q.zones = zone.trim();              // busca por zona exacta
    if (day) q['availability.day'] = day.trim();  // mon|tue|wed|thu|fri|sat|sun

    const rows = await Walker.find(q).limit(50).lean();
    res.json(rows);
  } catch (e) {
    console.error('list walkers error', e);
    res.status(500).json({ message: 'Error al listar paseadores' });
  }
});

module.exports = router;
