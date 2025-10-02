// routes/appUsersRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * LISTA USUARIOS (filtrable por rol y búsqueda)
 * GET /api/app-users?role=cliente&search=ana&page=1&limit=20
 */
router.get('/app-users', async (req, res) => {
  try {
    const { role, search = '', page = 1, limit = 20 } = req.query;

    const q = {};
    if (role) q.role = role; // 'cliente' | 'paseador' | 'admin'
    if (search) {
      q.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
      ];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * perPage;

    const [items, total] = await Promise.all([
      User.find(q).sort({ createdAt: -1 }).skip(skip).limit(perPage).lean(),
      User.countDocuments(q),
    ]);

    res.json({ ok: true, total, page: pageNum, limit: perPage, items });
  } catch (e) {
    console.error('list app users error', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * DETALLE POR ID
 * GET /api/app-users/:id
 */
router.get('/app-users/:id', async (req, res) => {
  try {
    const item = await User.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    res.json({ ok: true, item });
  } catch {
    res.status(400).json({ ok: false, error: 'ID inválido' });
  }
});

/**
 * (Opcional) CONTADORES POR ROL
 * GET /api/app-users/_stats
 */
router.get('/app-users/_stats', async (_req, res) => {
  try {
    const agg = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $project: { role: '$_id', count: 1, _id: 0 } },
      { $sort: { role: 1 } },
    ]);
    res.json({ ok: true, stats: agg });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * CREAR USUARIO (respetando tu esquema y generando passwordHash)
 * POST /api/app-users
 * Body JSON mínimo: { "name": "...", "email": "...", "password": "...", "role": "cliente" }
 * Roles válidos: "cliente" | "paseador" | "admin"
 */
router.post('/app-users', async (req, res) => {
  try {
    const { name, email, password, role = 'cliente', phone, photoUrl, address } = req.body || {};

    if (!name || !password) {
      return res.status(400).json({ ok: false, error: 'name y password son obligatorios' });
    }
    // email no es estrictamente obligatorio en tu modelo (por sparse:true), pero lo validamos si viene
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ ok: false, error: 'email inválido' });
    }
    if (!['cliente', 'paseador', 'admin'].includes(role)) {
      return res.status(400).json({ ok: false, error: 'role inválido' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      photoUrl,
      role,
      address, // debe respetar tu sub-esquema si lo envías
    });

    res.status(201).json({ ok: true, item: user.toJSON() });
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ ok: false, error: 'email ya existe' });
    }
    console.error('create app user error', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * SEED RÁPIDO: crea 1 cliente y 1 paseador de ejemplo si no existen
 * POST /api/app-users/_seed
 * Body opcional: { "password": "123456" }
 * NOTA: Usa sólo en desarrollo. Puedes borrar esta ruta cuando ya tengas datos reales.
 */
router.post('/app-users/_seed', async (req, res) => {
  try {
    const rawPass = (req.body && req.body.password) || '123456';
    const passwordHash = await bcrypt.hash(rawPass, 10);

    const baseAddress = {
      street: 'Av. Ejemplo',
      extNumber: '100',
      neighborhood: 'Centro',
      city: 'Cuautitlán Izcalli',
      state: 'Edo. Mex.',
      zip: '54700',
      references: 'Frente al parque',
      geo: { type: 'Point', coordinates: [-99.246, 19.613] },
    };

    const docs = [
      {
        name: 'Cliente Demo',
        email: 'cliente.demo@paseospeludos.com',
        passwordHash,
        role: 'cliente',
        phone: '5511111111',
        address: baseAddress,
      },
      {
        name: 'Paseador Demo',
        email: 'paseador.demo@paseospeludos.com',
        passwordHash,
        role: 'paseador',
        phone: '5522222222',
        address: baseAddress,
      },
    ];

    const created = [];
    for (const d of docs) {
      const exists = await User.findOne({ email: d.email }).lean();
      if (!exists) {
        const u = await User.create(d);
        created.push(u.toJSON());
      }
    }

    res.json({
      ok: true,
      message: created.length ? 'Usuarios de ejemplo creados' : 'Nada que crear (ya existían)',
      createdCount: created.length,
      created,
    });
  } catch (e) {
    console.error('seed users error', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
