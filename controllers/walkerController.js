/* controllers/walkerController.js */
const User = require('../models/User');

/**
 * GET /walkers/near?lon=-99.215&lat=19.622&km=3&limit=20
 * Devuelve paseadores activos cercanos, ordenados por distancia.
 */
exports.getNearbyWalkers = async (req, res) => {
  try {
    const lon = Number(req.query.lon);
    const lat = Number(req.query.lat);
    const km = req.query.km !== undefined ? Number(req.query.km) : 3; // default 3km
    const limit = req.query.limit !== undefined ? Math.min(Number(req.query.limit), 100) : 20;

    if ([lon, lat, km].some(Number.isNaN)) {
      return res.status(400).json({
        ok: false,
        error: 'Parámetros inválidos. Usa lon, lat y km numéricos.',
        ejemplo: '/walkers/near?lon=-99.215&lat=19.622&km=3'
      });
    }

    const maxDistanceMeters = Math.max(0, km) * 1000;

    // Usamos $geoNear para calcular distancia y ordenar
    const walkers = await User.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lon, lat] }, // [lon, lat]
          distanceField: 'distanceMeters',
          maxDistance: maxDistanceMeters,
          query: { role: 'paseador', isActive: true, 'address.geo': { $exists: true } },
          spherical: true,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          phone: 1,
          email: 1,
          photoUrl: 1,
          role: 1,
          isActive: 1,
          'address.street': 1,
          'address.neighborhood': 1,
          'address.city': 1,
          'address.state': 1,
          'address.geo': 1,
          distanceMeters: 1,
        },
      },
      { $limit: limit },
    ]);

    return res.json({
      ok: true,
      count: walkers.length,
      results: walkers,
      meta: { origin: { lon, lat }, km, limit },
    });
  } catch (err) {
    console.error('getNearbyWalkers error:', err);
    return res.status(500).json({ ok: false, error: 'Error interno' });
  }
};

/**
 * PATCH /walkers/location
 * body: { walkerId: "ID", lon: -99.21, lat: 19.62 }
 * Actualiza la ubicación del paseador (para que entre a las búsquedas cercanas)
 */
exports.updateWalkerLocation = async (req, res) => {
  try {
    const { walkerId, lon, lat } = req.body || {};
    if (!walkerId || typeof lon !== 'number' || typeof lat !== 'number') {
      return res.status(400).json({
        ok: false,
        error: 'Faltan datos. Requiere walkerId, lon(Number), lat(Number).'
      });
    }

    const result = await User.updateOne(
      { _id: walkerId, role: 'paseador' },
      {
        $set: {
          'address.geo': { type: 'Point', coordinates: [lon, lat] },
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, error: 'Paseador no encontrado' });
    }

    // emite por socket a los suscritos a este paseador (tu server ya lo soporta)
    const io = req.app.get('io');
    if (io) {
      io.to(`walker:${walkerId}`).emit('location:update', {
        walkerId,
        point: { type: 'Point', coordinates: [lon, lat] },
      });
    }

    return res.json({ ok: true, updated: result.modifiedCount === 1 });
  } catch (err) {
    console.error('updateWalkerLocation error:', err);
    return res.status(500).json({ ok: false, error: 'Error interno' });
  }
};
