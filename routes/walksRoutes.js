// routes/walksRoutes.js
const express = require('express');
const Joi = require('joi');
const router = express.Router();

const requireAuth = require('../middlewares/requireAuth');
const Walk   = require('../models/Walk');
const Walker = require('../models/Walker');

const isClient = (role) => role === 'client'  || role === 'cliente';
const isWalker = (role) => role === 'walker'  || role === 'paseador';
const isAdmin  = (role) => role === 'admin';

// ------------------------- POST /api/walks (crear/iniciar) -------------------------
const createSchema = Joi.object({
  clientId: Joi.string().hex().length(24).optional(),     // si el que llama es cliente: se fuerza a su id
  walkerId: Joi.string().hex().length(24).required(),
  dogIds:   Joi.array().items(Joi.string().hex().length(24)).default([]),
  startAt:  Joi.date().optional(),
  notes:    Joi.string().allow('').optional(),
  price:    Joi.number().min(0).optional(),
  surge:    Joi.number().min(0).max(1).optional()
});

router.post('/walks', requireAuth, async (req, res) => {
  try {
    const { value, error } = createSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ error: error.message });

    // resolver clientId según rol
    let clientId = value.clientId;
    if (isClient(req.user.role)) clientId = req.user.id;          // el cliente solo puede crear para sí
    if (!clientId && !isAdmin(req.user.role)) {
      return res.status(400).json({ error: 'clientId requerido (o inicia sesión como cliente)' });
    }

    // validar que el walker exista
    const walkerExists = await Walker.exists({ _id: value.walkerId });
    if (!walkerExists) return res.status(404).json({ error: 'Walker no encontrado' });

    const walk = await Walk.create({
      clientId,
      walkerId: value.walkerId,
      dogIds: value.dogIds,
      startAt: value.startAt || new Date(),
      notes: value.notes,
      price: value.price ?? 0,
      surge: value.surge ?? 0,
      status: 'ongoing'
    });

    res.status(201).json({ ok: true, walk });
  } catch (err) {
    res.status(500).json({ error: 'Error creando paseo', detail: err.message });
  }
});

// ------------------------- PATCH /api/walks/:id/finish (cerrar) -------------------------
const finishSchema = Joi.object({
  endAt: Joi.date().optional(),
  notes: Joi.string().allow('').optional(),
  price: Joi.number().min(0).optional(),
  surge: Joi.number().min(0).max(1).optional(),
  status: Joi.string().valid('finished','cancelled').default('finished')
});

router.patch('/walks/:id/finish', requireAuth, async (req, res) => {
  try {
    const { value, error } = finishSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ error: error.message });

    const walk = await Walk.findById(req.params.id);
    if (!walk) return res.status(404).json({ error: 'Paseo no encontrado' });

    // Autorización: walker asignado o admin, o cliente dueño (solo ver, pero permitimos cerrar si admin/walker)
    if (isWalker(req.user.role)) {
      const myWalker = await Walker.findOne({ user: req.user.id }).select('_id');
      if (!myWalker || myWalker._id.toString() !== String(walk.walkerId)) {
        return res.status(403).json({ error: 'No autorizado para cerrar este paseo' });
      }
    } else if (!isAdmin(req.user.role)) {
      return res.status(403).json({ error: 'Solo paseador o admin pueden cerrar' });
    }

    walk.endAt = value.endAt || new Date();
    if (typeof value.price === 'number') walk.price = value.price;
    if (typeof value.surge === 'number') walk.surge = value.surge;
    if (typeof value.notes === 'string') walk.notes = value.notes;
    walk.status = value.status || 'finished';

    await walk.save();
    res.json({ ok: true, walk });
  } catch (err) {
    res.status(500).json({ error: 'Error cerrando paseo', detail: err.message });
  }
});

// ------------------------- GET /api/walks (listar con filtros) -------------------------
router.get('/walks', requireAuth, async (req, res) => {
  try {
    const { role = '', from, to, limit = '100' } = req.query;
    let filter = {};
    let max = Math.min(parseInt(limit, 10) || 100, 200);

    // Filtro por rol
    if (role === 'client' || role === 'cliente' || isClient(req.user.role)) {
      filter.clientId = req.user.id;
    } else if (role === 'walker' || role === 'paseador' || isWalker(req.user.role)) {
      const myWalker = await Walker.findOne({ user: req.user.id }).select('_id');
      if (!myWalker) return res.status(404).json({ error: 'Perfil de walker no encontrado' });
      filter.walkerId = myWalker._id;
    } else if (!isAdmin(req.user.role)) {
      // si no especifica y no es admin, asumimos su rol
      filter.clientId = req.user.id;
    }

    // Rango de fechas (en startAt)
    if (from || to) {
      filter.startAt = {};
      if (from) filter.startAt.$gte = new Date(from);
      if (to)   filter.startAt.$lte = new Date(to);
    }

    const walks = await Walk.find(filter)
      .sort({ startAt: -1 })
      .limit(max)
      .lean();

    res.json({ count: walks.length, walks });
  } catch (err) {
    res.status(500).json({ error: 'Error listando paseos', detail: err.message });
  }
});

// ------------------------- GET /api/walks/:id -------------------------
router.get('/walks/:id', requireAuth, async (req, res) => {
  try {
    const walk = await Walk.findById(req.params.id).lean();
    if (!walk) return res.status(404).json({ error: 'Paseo no encontrado' });

    // Autorización básica de lectura
    if (isAdmin(req.user.role)) return res.json({ walk });

    const myWalker = isWalker(req.user.role)
      ? await Walker.findOne({ user: req.user.id }).select('_id')
      : null;

    const canRead =
      String(walk.clientId) === req.user.id ||
      (myWalker && String(walk.walkerId) === myWalker._id.toString());

    if (!canRead) return res.status(403).json({ error: 'No autorizado' });

    res.json({ walk });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo paseo', detail: err.message });
  }
});

module.exports = router;
