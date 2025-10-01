// routes/walkerRoutes.js
const express = require('express');
const router = express.Router();
const Walker = require('../models/Walker.js');

// Controladores existentes (cercanía y ubicación)
const {
  getNearbyWalkers,
  updateWalkerLocation,
} = require('../controllers/walkerController');

// (Opcional) por si la disponibilidad estuviera en User y no en Walker
let User = null;
try {
  User = require('../models/User.js');
} catch (_) {
  // sin User, no pasa nada, usamos solo Walker
}

// Helpers
const isMongoId = (id) => /^[a-f\d]{24}$/i.test(id);

// =====================================================
// LISTADO DE PASEADORES (RUTA EXISTENTE — SE RESPETA)
// =====================================================

// Versión corta (si montas este router en /api/walkers → GET /api/walkers)
async function listWalkers(req, res) {
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
}

// Compatibilidad: ambas rutas funcionan según cómo montes el router
router.get('/', listWalkers);             // /api/walkers
router.get('/walkers', listWalkers);      // /api/walkers/walkers  (tu ruta previa)


// =====================================================
// GEO: BUSCAR POR CERCANÍA  (RUTA EXISTENTE — SE RESPETA)
// =====================================================
// GET /api/walkers/near?lon=-99.21&lat=19.62&km=3&limit=20
router.get('/near', getNearbyWalkers);
router.get('/walkers/near', getNearbyWalkers); // compatibilidad


// =====================================================
// GEO: ACTUALIZAR UBICACIÓN (RUTA EXISTENTE — SE RESPETA)
// =====================================================
// PATCH /api/walkers/location { walkerId, lon, lat }
router.patch('/location', updateWalkerLocation);
router.patch('/walkers/location', updateWalkerLocation); // compatibilidad


// =====================================================
// ✅ NUEVO: DISPONIBILIDAD DEL PASEADOR
// =====================================================

// GET /api/walkers/:walkerId/availability  → { available: true|false }
router.get('/:walkerId/availability', async (req, res) => {
  try {
    const { walkerId } = req.params;
    if (!walkerId) return res.status(400).json({ message: 'walkerId es requerido' });
    if (!isMongoId(walkerId)) return res.status(400).json({ message: 'walkerId inválido' });

    // 1) Buscar en colección Walker (by _id o por campo user)
    let found = await Walker.findOne({ $or: [{ _id: walkerId }, { user: walkerId }] })
      .select('available')
      .lean();

    // 2) Fallback: si manejas disponibilidad en User
    if (!found && User) {
      found = await User.findOne({ _id: walkerId, role: 'paseador' })
        .select('available')
        .lean();
    }

    if (!found) return res.status(404).json({ message: 'Paseador no encontrado' });
    return res.json({ available: !!found.available });
  } catch (err) {
    console.error('GET /walkers/:id/availability error:', err);
    return res.status(500).json({ message: 'Error al obtener disponibilidad' });
  }
});

// PATCH /api/walkers/:walkerId/availability { available: true|false } → { available }
router.patch('/:walkerId/availability', async (req, res) => {
  try {
    const { walkerId } = req.params;
    let { available } = req.body;

    if (!walkerId) return res.status(400).json({ message: 'walkerId es requerido' });
    if (!isMongoId(walkerId)) return res.status(400).json({ message: 'walkerId inválido' });

    // Aceptar "true"/"false" como string
    if (typeof available !== 'boolean') {
      if (typeof available === 'string') {
        available = available.toLowerCase() === 'true';
      } else {
        return res.status(400).json({ message: 'available debe ser true o false' });
      }
    }

    // 1) Intentar en colección Walker
    let updated = await Walker.findOneAndUpdate(
      { $or: [{ _id: walkerId }, { user: walkerId }] },
      { $set: { available } },
      { new: true }
    ).select('available').lean();

    // 2) Fallback: en User(role=paseador)
    if (!updated && User) {
      updated = await User.findOneAndUpdate(
        { _id: walkerId, role: 'paseador' },
        { $set: { available } },
        { new: true }
      ).select('available').lean();
    }

    if (!updated) return res.status(404).json({ message: 'Paseador no encontrado' });
    return res.json({ available: !!updated.available });
  } catch (err) {
    console.error('PATCH /walkers/:id/availability error:', err);
    return res.status(500).json({ message: 'Error al actualizar disponibilidad' });
  }
});

module.exports = router;
