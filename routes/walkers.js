/* routes/walkers.js */
const express = require('express');
const router = express.Router();
const { getNearbyWalkers, updateWalkerLocation } = require('../controllers/walkerController');

// Buscar paseadores por cercanía
// GET /walkers/near?lon=-99.215&lat=19.622&km=3&limit=20
router.get('/near', getNearbyWalkers);

// Actualizar ubicación de un paseador
// PATCH /walkers/location  { walkerId, lon, lat }
router.patch('/location', express.json(), updateWalkerLocation);

module.exports = router;
