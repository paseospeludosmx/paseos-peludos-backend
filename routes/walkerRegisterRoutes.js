// routes/walkerRegisterRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

let UserModel = null;
try {
  UserModel = require('../models/User'); // usa TU modelo (role: 'paseador' | 'cliente' | 'admin')
} catch (e) {
  console.warn('ℹ️  models/User no disponible, usaré inserción directa en colección "users".');
}

/**
 * POST /api/walkers/register
 * Body JSON esperado (ajústalo a tu front si hace falta):
 * {
 *   "name": "Juan Paseador",
 *   "email": "juan@demo.com",        // opcional en tu esquema (sparse), pero recomendado
 *   "password": "123456",
 *   "phone": "5522334455",
 *   "zones": ["Roma","Condesa"],     // opcional (si no está en tu schema será ignorado por Mongoose)
 *   "availability": [{day:"mon",from:"09:00",to:"13:00"}], // opcional
 *   "address": { ... }               // opcional, respeta tu sub-esquema (incluye geo)
 * }
 */
router.post('/walkers/register', async (req, res, next) => {
  try {
    if (!req.is('application/json')) {
      const err = new Error('Content-Type debe ser application/json');
      err.status = 415;
      throw err;
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
      const err = new Error('name y password son obligatorios');
      err.status = 400;
      throw err;
    }

    if (email && !/^\S+@\S+\.\S+$/.test(String(email))) {
      const err = new Error('email inválido');
      err.status = 400;
      throw err;
    }

    const hashed = await bcrypt.hash(password, 10);
    const normalizedEmail = email ? String(email).toLowerCase().trim() : undefined;

    // Documento base alineado a TU modelo User
    const doc = {
      name,
      email: normalizedEmail,   // tu schema permite sparse:true
      passwordHash: hashed,     // 🔴 tu schema exige passwordHash (no "password")
      phone: phone || null,
      role: 'paseador',         // 🔴 tu enum está en ESPAÑOL (no 'walker')
      photoUrl: photoUrl || null,
      address: address || undefined, // respeta tu sub-esquema si viene
      // Campos extra que tal vez no están en el schema; Mongoose los ignora si strict:true
      zones: Array.isArray(zones) ? zones : [],
      availability: Array.isArray(availability) ? availability : [],
      createdAt: new Date(),
    };

    // ¿Duplicado por email?
    if (normalizedEmail) {
      if (UserModel) {
        const exists = await UserModel.findOne({ email: normalizedEmail }).lean();
        if (exists) {
          const err = new Error('El email ya está registrado');
          err.status = 409;
          throw err;
        }
      } else {
        const coll = require('mongoose').connection.collection('users');
        const exists = await coll.findOne({ email: normalizedEmail });
        if (exists) {
          const err = new Error('El email ya está registrado');
          err.status = 409;
          throw err;
        }
      }
    }

    // Guardar
    if (UserModel) {
      const saved = await UserModel.create(doc);
      // tu schema oculta passwordHash al serializar
      return res.status(201).json({ ok: true, id: saved._id, role: saved.role, item: saved.toJSON() });
    } else {
      // Inserción directa si no hay modelo (cuidamos passwordHash y role)
      const coll = require('mongoose').connection.collection('users');
      const result = await coll.insertOne(doc);
      return res.status(201).json({ ok: true, id: result.insertedId, role: doc.role });
    }
  } catch (err) {
    console.error('❌ Error al registrar paseador:', err);
    return next(err); // tu middleware global maneja el error (usa DEBUG_ERRORS para ver stack)
  }
});

module.exports = router;
