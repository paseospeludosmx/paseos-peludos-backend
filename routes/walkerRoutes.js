// routes/walkerRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const Walker = require('../models/Walker.js');

// Controladores existentes (cercanía y ubicación)
const {
  getNearbyWalkers,
  updateWalkerLocation,
} = require('../controllers/walkerController');

// (Opcional) por si la disponibilidad/registro estuviera en User y no en Walker
let User = null;
try {
  User = require('../models/User.js'); // Tu modelo con role: 'cliente' | 'paseador' | 'admin'
} catch (_) {
  // sin User, no pasa nada; usaremos colección 'users' directo si hace falta
}

// Helpers
const isMongoId = (id) => /^[a-f\d]{24}$/i.test(id);

// =====================================================
// LISTADO DE PASEADORES (RUTA EXISTENTE — SE RESPETA)
// =====================================================

// Versión corta (si montas este router en /api → GET /api/walkers)
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
router.get('/', listWalkers);             // /api/walkers   (si lo montas en /api/walkers)
router.get('/walkers', listWalkers);      // /api/walkers   (si lo montas en /api)

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
// ✅ DISPONIBILIDAD DEL PASEADOR (SE RESPETA)
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

// =====================================================
// ✅ REGISTRO DE PASEADOR (AHORA AQUÍ, SIN ARCHIVO APARTE)
// =====================================================
// POST /api/walkers/register
router.post('/walkers/register', async (req, res) => {
  try {
    if (!req.is('application/json')) {
      return res.status(415).json({ ok: false, error: 'Content-Type debe ser application/json' });
    }

    const {
      name,
      email,
      password,
      phone,
      zones,
      availability,
      address,
      photoUrl,
    } = req.body || {};

    if (!name || !password) {
      return res.status(400).json({ ok: false, error: 'name y password son obligatorios' });
    }

    let normalizedEmail = undefined;
    if (email) {
      normalizedEmail = String(email).toLowerCase().trim();
      if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
        return res.status(400).json({ ok: false, error: 'email inválido' });
      }
    }

    // ¿Duplicado por email?
    if (normalizedEmail) {
      if (User) {
        const dup = await User.findOne({ email: normalizedEmail }).lean();
        if (dup) return res.status(409).json({ ok: false, error: 'El email ya está registrado' });
      } else {
        const coll = require('mongoose').connection.collection('users');
        const dup = await coll.findOne({ email: normalizedEmail });
        if (dup) return res.status(409).json({ ok: false, error: 'El email ya está registrado' });
      }
    }

    // Hash de contraseña -> tu schema exige passwordHash
    const passwordHash = await bcrypt.hash(password, 10);

    // Documento alineado a TU modelo User (role en español)
    const doc = {
      name,
      email: normalizedEmail,   // tu schema permite sparse:true
      passwordHash,             // requerido por tu modelo
      phone: phone || null,
      role: 'paseador',         // 🔴 EN ESPAÑOL (NO 'walker')
      photoUrl: photoUrl || null,
      address: address || undefined,               // respeta sub-esquema
      zones: Array.isArray(zones) ? zones : [],    // si no está en schema, Mongoose lo ignora
      availability: Array.isArray(availability) ? availability : [],
      createdAt: new Date(),
    };

    if (User) {
      const saved = await User.create(doc);
      return res.status(201).json({ ok: true, item: saved.toJSON() });
    } else {
      // Inserción directa si no hay modelo
      const coll = require('mongoose').connection.collection('users');
      const result = await coll.insertOne(doc);
      return res.status(201).json({ ok: true, item: { _id: result.insertedId, ...doc } });
    }
  } catch (err) {
    console.error('❌ Error al registrar paseador:', err);
    return res.status(500).json({ ok: false, error: 'Error interno al registrar paseador' });
  }
});

module.exports = router;
