// routes/walkerRegisterRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * REGISTRO DE PASEADOR
 * POST /api/walkers/register
 * Body mínimo:
 * {
 *   "name": "Juan Paseador",
 *   "email": "juan@demo.com",      // opcional (tu esquema lo permite por sparse:true)
 *   "password": "123456",          // requerido (generamos passwordHash)
 *   "phone": "5512345678",         // opcional
 *   "photoUrl": "https://...",
 *   "address": {                   // opcional; respeta tu sub-esquema
 *     "street": "Av. Ejemplo",
 *     "extNumber": "100",
 *     "intNumber": "",
 *     "neighborhood": "Centro",
 *     "city": "Cuautitlán Izcalli",
 *     "state": "Edo. Mex.",
 *     "zip": "54700",
 *     "references": "Frente al parque",
 *     "geo": { "type": "Point", "coordinates": [-99.246, 19.613] } // [lon,lat]
 *   }
 * }
 */
router.post('/walkers/register', async (req, res) => {
  try {
    const { name, email, password, phone, photoUrl, address } = req.body || {};

    // Validaciones mínimas (tu esquema requiere name y passwordHash)
    if (!name || !password) {
      return res.status(400).json({ ok: false, error: 'name y password son obligatorios' });
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ ok: false, error: 'email inválido' });
    }

    // Si viene email, verificamos duplicado (tu modelo tiene unique en email)
    if (email) {
      const exists = await User.findOne({ email }).lean();
      if (exists) {
        return res.status(409).json({ ok: false, error: 'email ya existe' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const walker = await User.create({
      name,
      email, // puede ser undefined y no falla por sparse:true
      passwordHash,
      phone,
      photoUrl,
      role: 'paseador',   // 👈 respeta tu enum en español
      address,            // se valida contra tu sub-esquema (incluye geo)
    });

    // Tu esquema ya oculta passwordHash en toJSON/toObject
    return res.status(201).json({ ok: true, item: walker.toJSON() });
  } catch (e) {
    // Errores comunes: 11000 = duplicado único (email)
    if (e?.code === 11000) {
      return res.status(409).json({ ok: false, error: 'email ya existe' });
    }
    console.error('walker register error:', e);
    return res.status(500).json({ ok: false, error: 'Error interno al registrar paseador' });
  }
});

module.exports = router;
