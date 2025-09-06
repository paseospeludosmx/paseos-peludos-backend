const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const Walker = require('../models/Walker.js');

// genera JWT con el id y rol
function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' }
  );
}

exports.registerWalker = async (req, res) => {
  try {
    const { name, email, password, phone, bio, zones, availability, ratePerHour } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'El correo ya está registrado.' });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      role: 'paseador',
      isActive: true
    });

    await Walker.create({
      user: user._id,
      bio: bio || '',
      zones: zones || [],
      availability: availability || undefined,
      ratePerHour: ratePerHour || 120
    });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone }
    });
  } catch (err) {
    console.error('registerWalker error', err);
    res.status(500).json({ message: 'Error al registrar paseador.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas.' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Credenciales inválidas.' });

    if (!user.isActive) return res.status(403).json({ message: 'Usuario inactivo.' });

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone }
    });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ message: 'Error al iniciar sesión.' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'No encontrado' });

    let walker = null;
    if (user.role === 'paseador') {
      walker = await Walker.findOne({ user: user._id });
    }

    res.json({ user, walker });
  } catch (err) {
    console.error('me error', err);
    res.status(500).json({ message: 'Error al obtener perfil.' });
  }
};
