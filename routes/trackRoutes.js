// routes/trackRoutes.js
const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/requireAuth');
const Walker = require('../models/Walker');
const Walk = require('../models/Walk'); // <-- NUEVO

// POST /api/track   (auth: paseador/admin)
// Body: { lat:number, lng:number, accuracy?:number, speed?:number, at?:DateISO, walkerId?:string }
router.post('/track', requireAuth, async (req, res) => {
  try {
    const { lat, lng, accuracy, speed, at, walkerId: walkerIdFromBody } = req.body || {};
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'lat/lng requeridos numéricos' });
    }

    let walkerId = walkerIdFromBody || null;

    if (!walkerId) {
      if (req.user.role === 'paseador' || req.user.role === 'walker') {
        const walkerDoc = await Walker.findOne({ user: req.user.id }).select('_id');
        if (!walkerDoc) return res.status(404).json({ error: 'Walker no encontrado para este usuario' });
        walkerId = walkerDoc._id.toString();
      } else if (req.user.role === 'admin') {
        return res.status(400).json({ error: 'walkerId requerido cuando role!=paseador' });
      } else {
        return res.status(403).json({ error: 'Solo paseador/admin pueden enviar tracking' });
      }
    }

    const point = {
      lat, lng,
      accuracy: typeof accuracy === 'number' ? accuracy : undefined,
      speed: typeof speed === 'number' ? speed : undefined,
      at: at ? new Date(at) : new Date(),
    };

    // 1) Guardar último punto en Walker
    await Walker.updateOne(
      { _id: walkerId },
      { $set: { lastPoint: point } },
      { strict: false }
    );

    // 2) Añadir a la polyline del paseo "ongoing" del paseador (si existe)
    await Walk.updateOne(
      { walkerId, status: 'ongoing' },
      { $push: { polyline: point } },
      { strict: false }
    );

    // 3) Emitir por Socket.IO a la sala del walker
    const io = req.app.get('io');
    if (io) io.to(`walker:${walkerId}`).emit('location:update', { walkerId, point });

    return res.json({ ok: true, walkerId, point });
  } catch (err) {
    return res.status(500).json({ error: 'Error guardando tracking', detail: err.message });
  }
});

// GET /api/walker/:id/last-point
router.get('/walker/:id/last-point', async (req, res) => {
  try {
    const walker = await Walker.findById(req.params.id).lean();
    if (!walker) return res.status(404).json({ error: 'Walker no encontrado' });
    return res.json({ walkerId: walker._id.toString(), lastPoint: walker.lastPoint || null });
  } catch (err) {
    return res.status(500).json({ error: 'Error obteniendo último punto', detail: err.message });
  }
});

// GET /api/walker/:id/live (ayuda WS)
router.get('/walker/:id/live', (req, res) => {
  return res.status(426).json({
    hint: 'Suscríbete por Socket.IO a la sala',
    room: `walker:${req.params.id}`,
    events: ['subscribe:walker', 'location:update'],
  });
});

module.exports = router;
