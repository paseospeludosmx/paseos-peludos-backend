// routes/reservationRoutes.js
const express = require('express');
const router = express.Router();
const Walk = require('../models/Walk.js');
const auth = require('../middlewares/auth.js'); // para leer req.user del JWT

/**
 * POST /api/reservas
 * Crea una reserva.
 * Body mínimo: { clientId, walkerId, zone, date, duration?, notes?, dogId? }
 */
router.post('/reservas', auth, async (req, res) => {
  try {
    const { clientId, walkerId, zone, date, duration, notes, dogId, price } = req.body;

    if (!clientId || !walkerId || !date) {
      return res.status(400).json({ message: 'Faltan campos obligatorios (clientId, walkerId, date).' });
    }

    const doc = await Walk.create({
      client: clientId,
      walker: walkerId,
      dog: dogId || undefined,
      zone: zone || '',
      date: new Date(date),
      duration: duration || '45m',
      notes: notes || '',
      price: typeof price === 'number' ? price : 0,
      status: 'pending',
    });

    return res.status(201).json({ id: doc._id.toString(), ok: true });
  } catch (e) {
    console.error('POST /reservas error', e);
    return res.status(500).json({ message: 'Error al crear la reserva.' });
  }
});

/**
 * GET /api/reservas?client=<id> | ?walker=<id>
 * Lista reservas del cliente o del paseador (una de las dos).
 * Devuelve info básica con algunos populate útiles.
 */
router.get('/reservas', async (req, res) => {
  try {
    const { client, walker } = req.query;

    if (!client && !walker) {
      return res.status(400).json({ message: 'Debes indicar ?client=<id> o ?walker=<id>.' });
    }

    const q = {};
    if (client) q.client = client;
    if (walker) q.walker = walker;

    const rows = await Walk.find(q)
      .sort({ date: -1 })
      .populate('dog', 'name breed')
      .populate({
        path: 'walker',
        select: 'ratePerHour zones availability user',
        populate: { path: 'user', select: 'name email' } // nombre del paseador
      })
      .populate('client', 'name email') // nombre del cliente
      .lean();

    return res.json(rows);
  } catch (e) {
    console.error('GET /reservas error', e);
    return res.status(500).json({ message: 'Error al listar reservas.' });
  }
});

module.exports = router;
