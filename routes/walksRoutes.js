// routes/walksRoutes.js
const express = require('express');
const router = express.Router();

// Ajusta el path si tus modelos están en otra carpeta:
const Walk = require('../models/Walk');      // Walk: { walker, client, startTimePlanned, endTimePlanned, status, dog, ... }
const Dog  = require('../models/Dog');       // opcional, solo si quieres populate
const User = require('../models/User');      // opcional, por si ocupas validar id

// Utilidad: asegurar que el id tiene pinta de MongoId (para errores claros)
const isMongoId = (id) => /^[a-f\d]{24}$/i.test(id);

// Utilidad: límites del día (hoy o de una fecha YYYY-MM-DD)
function dayBounds(dateStr) {
  const base = dateStr ? new Date(`${dateStr}T00:00:00.000Z`) : new Date();
  // Creamos inicio/fin del día en la zona del servidor
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const end = new Date(base);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// -------------------------------
// GET /api/walks/assigned?walkerId=...
// Devuelve paseos asignados a un paseador (ordenados por fecha/hora)
// -------------------------------
router.get('/assigned', async (req, res) => {
  try {
    const { walkerId } = req.query;
    if (!walkerId) return res.status(400).json({ message: 'walkerId es requerido' });
    if (!isMongoId(walkerId)) return res.status(400).json({ message: 'walkerId inválido' });

    // Algunos proyectos guardan el id del "user" del paseador en "walker"
    // y otros usan "walkerUser" o "walkerProfile". Probamos variantes comunes.
    const walks = await Walk.find({
      $or: [
        { walker: walkerId },
        { walkerUser: walkerId },
      ],
    })
      .sort({ startTimePlanned: 1 })
      .populate('dog', 'name breed')    // opcional
      .lean();

    return res.json(walks || []);
  } catch (err) {
    console.error('GET /walks/assigned error:', err);
    return res.status(500).json({ message: 'Error al listar paseos asignados' });
  }
});

// -------------------------------
// GET /api/walks/my?clientId=...
// Devuelve paseos de un cliente (ordenados por fecha/hora)
// -------------------------------
router.get('/my', async (req, res) => {
  try {
    const { clientId } = req.query;
    if (!clientId) return res.status(400).json({ message: 'clientId es requerido' });
    if (!isMongoId(clientId)) return res.status(400).json({ message: 'clientId inválido' });

    const walks = await Walk.find({
      $or: [
        { client: clientId },
        { clientUser: clientId },
      ],
    })
      .sort({ startTimePlanned: 1 })
      .populate('dog', 'name breed')    // opcional
      .lean();

    return res.json(walks || []);
  } catch (err) {
    console.error('GET /walks/my error:', err);
    return res.status(500).json({ message: 'Error al listar paseos del cliente' });
  }
});

// ======================================================================
// OPCIONALES (POR SI QUIERES PEDIR SOLO LOS DE HOY DESDE EL BACKEND)
// ======================================================================

// GET /api/walks/assigned/today?walkerId=...&date=YYYY-MM-DD&statuses=scheduled,assigned,in_progress
router.get('/assigned/today', async (req, res) => {
  try {
    const { walkerId, date, statuses } = req.query;
    if (!walkerId) return res.status(400).json({ message: 'walkerId es requerido' });
    if (!isMongoId(walkerId)) return res.status(400).json({ message: 'walkerId inválido' });

    const { start, end } = dayBounds(date);
    const statusList = (statuses ? String(statuses) : '')
      .split(',').map(s => s.trim()).filter(Boolean);

    const query = {
      $and: [
        { $or: [{ walker: walkerId }, { walkerUser: walkerId }] },
        { startTimePlanned: { $gte: start, $lte: end } },
      ],
    };
    if (statusList.length) query.$and.push({ status: { $in: statusList } });

    const walks = await Walk.find(query)
      .sort({ startTimePlanned: 1 })
      .populate('dog', 'name breed')
      .lean();

    return res.json(walks || []);
  } catch (err) {
    console.error('GET /walks/assigned/today error:', err);
    return res.status(500).json({ message: 'Error al listar paseos del día (paseador)' });
  }
});

// GET /api/walks/my/today?clientId=...&date=YYYY-MM-DD&statuses=scheduled,assigned,in_progress
router.get('/my/today', async (req, res) => {
  try {
    const { clientId, date, statuses } = req.query;
    if (!clientId) return res.status(400).json({ message: 'clientId es requerido' });
    if (!isMongoId(clientId)) return res.status(400).json({ message: 'clientId inválido' });

    const { start, end } = dayBounds(date);
    const statusList = (statuses ? String(statuses) : '')
      .split(',').map(s => s.trim()).filter(Boolean);

    const query = {
      $and: [
        { $or: [{ client: clientId }, { clientUser: clientId }] },
        { startTimePlanned: { $gte: start, $lte: end } },
      ],
    };
    if (statusList.length) query.$and.push({ status: { $in: statusList } });

    const walks = await Walk.find(query)
      .sort({ startTimePlanned: 1 })
      .populate('dog', 'name breed')
      .lean();

    return res.json(walks || []);
  } catch (err) {
    console.error('GET /walks/my/today error:', err);
    return res.status(500).json({ message: 'Error al listar paseos del día (cliente)' });
  }
});

module.exports = router;
