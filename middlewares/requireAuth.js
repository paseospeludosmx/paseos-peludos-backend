// middlewares/requireAuth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change-me');
    const userId = payload.id || payload._id || payload.sub || payload.userId;
    if (!userId) return res.status(401).json({ error: 'Invalid token payload' });

    const user = await User.findById(userId).select('_id role email name');
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = { id: user._id.toString(), role: user.role, email: user.email, name: user.name };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', detail: err.message });
  }
};
