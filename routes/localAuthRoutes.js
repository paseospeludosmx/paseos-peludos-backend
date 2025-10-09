// routes/localAuthRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const User = require('../models/User');
let Walker = null; try { Walker = require('../models/Walker'); } catch {}

const mustJSON = (req, res, next) => {
  if (!req.is('application/json')) {
    return res.status(415).json({ ok: false, error: 'Content-Type debe ser application/json' });
  }
  next();
};

// POST /api/auth/login
router.post('/auth/login', mustJSON, async (req, res) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) return res.status(500).json({ ok: false, error: 'Server sin JWT_SECRET' });

    const email = String(req.body.email || '').toLowerCase().trim();
    const password = String(req.body.password || '');

    if (!email || !password) return res.status(400).json({ ok: false, error: 'email y password son requeridos' });

    const user = await User.findOne({ email }).lean();
    if (!user || !user.passwordHash) return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });

    const payload = { id: String(user._id), sub: String(user._id), role: user.role || 'cliente' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    const { passwordHash, __v, ...safe } = user;
    return res.json({ ok: true, token, user: safe });
  } catch (err) {
    console.error('auth/login error:', err);
    return res.status(500).json({ ok: false, error: 'Error interno' });
  }
});

// GET /api/auth/me
router.get('/auth/me', require('../middlewares/auth'), async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ ok: false, error: 'No identificado' });
    const user = await User.findById(req.user.id).select('-passwordHash -__v').lean();
    if (!user) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });

    let walker = null;
    if (Walker && user.role === 'paseador') {
      walker = await Walker.findOne({ user: req.user.id }).select('-__v').lean();
    }
    return res.json({ ok: true, user, walker });
  } catch (err) {
    console.error('auth/me error:', err);
    return res.status(500).json({ ok: false, error: 'Error interno' });
  }
});

module.exports = router;
