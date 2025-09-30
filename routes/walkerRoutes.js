// routes/walkerRoutes.js
const express = require('express');
const router = express.Router();
const Walker = require('../models/Walker.js');

// ⬇️ Agregamos el controlador para cercanía y actualización de ubicación
const {
  getNearbyWalkers,
  updateWalkerLocation,
} = require('../controllers/walkerController');

// GET /api/walkers?zone=Roma&day=sat  (TU RUTA EXISTENTE – SE RESPETA)
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

// ✅ NUEVO: Buscar paseadores por cercanía (GeoJSON en models/User.js)
// GET /api/walkers/near?lon=-99.215&lat=19.622&km=3&limit=20
router.get('/walkers/near', getNearbyWalkers);

// ✅ NUEVO: Actualizar ubicación de un paseador (para que aparezca en /near)
// PATCH /api/walkers/location  { walkerId, lon, lat }
router.patch('/walkers/location', updateWalkerLocation);

module.exports = router;
