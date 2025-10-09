const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Falta token' });

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('❌ Falta JWT_SECRET en variables de entorno');
    return res.status(500).json({ message: 'Config del servidor incompleta' });
  }

  try {
    const payload = jwt.verify(token, secret);
    const id = payload.id || payload.sub || payload._id || payload.userId || null;
    req.user = { id, role: payload.role || 'cliente' };
    return next();
  } catch {
    return res.status(401).json({ message: 'Token inválido' });
  }
};
