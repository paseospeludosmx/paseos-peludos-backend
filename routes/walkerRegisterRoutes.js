// routes/walkerRegisterRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

let UserModel = null;
try {
  UserModel = require('../models/User'); // si existe, lo usamos
} catch (e) {
  console.warn('ℹ️  models/User no disponible, usaré inserción directa en colección "users".');
}

/**
 * POST /api/walkers/register
 * Body JSON esperado (ajústalo a tu frontend):
 * {
 *   "name": "Juan Paseador",
 *   "email": "juan@demo.com",
 *   "password": "123456",
 *   "phone": "5522334455",
 *   "zones": ["Roma","Condesa"],       // opcional
 *   "availability": [{day:"mon",from:"09:00",to:"13:00"}] // opcional
 * }
 */
router.post('/walkers/register', async (req, res, next) => {
  try {
    if (!req.is('application/json')) {
      const err = new Error('Content-Type debe ser application/json');
      err.status = 415;
      throw err;
    }

    const { name, email, password, phone, zones, availability } = req.body || {};

    if (!name || !email || !password) {
      const err = new Error('name, email y password son obligatorios');
      err.status = 400;
      throw err;
    }

    const hashed = await bcrypt.hash(password, 10);

    // Documento base
    const doc = {
      name,
      email: String(email).toLowerCase().trim(),
      password: hashed,
      phone: phone || null,
      role: 'walker', // o 'paseador' si así lo manejas en front; ajusta aquí si es necesario
      zones: Array.isArray(zones) ? zones : [],
      availability: Array.isArray(availability) ? availability : [],
      createdAt: new Date()
    };

    // ¿Existe ya?
    if (UserModel) {
      const exists = await UserModel.findOne({ email: doc.email }).lean();
      if (exists) {
        const err = new Error('El email ya está registrado');
        err.status = 409;
        throw err;
      }
      const saved = await UserModel.create(doc);
      return res.status(201).json({ ok: true, id: saved._id, role: saved.role });
    } else {
      // Inserción directa a "users" si no hay modelo
      const coll = require('mongoose').connection.collection('users');
      const exists = await coll.findOne({ email: doc.email });
      if (exists) {
        const err = new Error('El email ya está registrado');
        err.status = 409;
        throw err;
      }
      const result = await coll.insertOne(doc);
      return res.status(201).json({ ok: true, id: result.insertedId, role: doc.role });
    }
  } catch (err) {
    console.error('❌ Error al registrar paseador:', err);
    return next(err); // el middleware de errores devolverá detalle si DEBUG_ERRORS=1
  }
});

module.exports = router;
