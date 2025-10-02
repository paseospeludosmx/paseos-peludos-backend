// routes/localAuthRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const User = require('../models/User'); // tu modelo con passwordHash y role

// POST /api/auth/login
// Body: { email, password }
router.post('/auth/login', async (req, res) => {
  try {
    if (!req.is('application/json')) {
      return res.status(415).json({ ok: false, error: 'Content-Type debe ser application/json' });
    }

    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'email y password son obligatorios' });
    }

    const normalized = String(email).toLowerCase().trim();

    const user = await User.findOne({ email: normalized, isActive: { $ne: false } }).lean();
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ ok: false, error: 'Usuario sin contraseña local' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
    const token = jwt.sign(
      { sub: String(user._id), role: user.role || 'cliente' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // limpia campos sensibles antes de responder
    const { passwordHash, __v, ...safe } = user;

    return res.json({ ok: true, token, user: safe });
  } catch (err) {
    console.error('auth/login error:', err);
    return res.status(500).json({ ok: false, error: 'Error interno' });
  }
});

module.exports = router;
