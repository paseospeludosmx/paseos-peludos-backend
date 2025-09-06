// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Modelos
const User = require('../models/User.js');
const Walker = require('../models/Walker.js');
const Dog = require('../models/Dog.js'); // Debe tener { user: ObjectId, name, breed, ageYears, weightKg, notes }

// ===== Helpers =====
function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' }
  );
}

function pick(obj, keys) {
  const out = {};
  keys.forEach(k => { if (obj[k] !== undefined) out[k] = obj[k]; });
  return out;
}

// ===== Controladores =====

// Registro de PASEADOR
async function registerWalker(req, res) {
  try {
    const {
      // user
      name, email, password, phone, photoUrl,
      address,            // { street, extNumber, neighborhood, ... }
      fcmToken,
      // walker
      bio, zones, availability, ratePerHour,
      services, experienceYears, vehicles
    } = req.body;

    const emailLc = (email || '').toLowerCase().trim();
    const exists = await User.findOne({ email: emailLc });
    if (exists) return res.status(409).json({ message: 'El correo ya está registrado.' });

    const passwordHash = await bcrypt.hash(password, 10);

    const userPayload = pick(
      { name, email: emailLc, passwordHash, phone, photoUrl, address, fcmToken, role: 'paseador', isActive: true },
      ['name','email','passwordHash','phone','photoUrl','address','fcmToken','role','isActive']
    );
    const user = await User.create(userPayload);

    // availability debe venir como arreglo [{ day:'sat', slots:[] }, ...]
    const walkerPayload = pick(
      { user: user._id, bio, zones, availability, ratePerHour, services, experienceYears, vehicles },
      ['user','bio','zones','availability','ratePerHour','services','experienceYears','vehicles']
    );
    await Walker.create(walkerPayload);

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, phone: user.phone, photoUrl: user.photoUrl
      }
    });
  } catch (err) {
    console.error('registerWalker error', err);
    return res.status(500).json({ message: 'Error al registrar paseador.' });
  }
}

// Registro de CLIENTE (dueño)
async function registerClient(req, res) {
  try {
    const { name, email, password, phone, dog } = req.body;

    const emailLc = (email || '').toLowerCase().trim();
    const exists = await User.findOne({ email: emailLc });
    if (exists) return res.status(409).json({ message: 'El correo ya está registrado.' });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: emailLc,
      passwordHash,
      phone: phone || '',
      role: 'cliente',
      isActive: true
    });

    // Perro opcional al momento de registro
    if (dog && dog.name) {
      // Asegura nombres de campos compatibles con el modelo Dog
      await Dog.create({
        user: user._id,
        name: dog.name,
        breed: dog.breed,
        ageYears: dog.ageYears,
        weightKg: dog.weightKg,
        notes: dog.notes || ''
      });
    }

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, phone: user.phone
      }
    });
  } catch (err) {
    console.error('registerClient error', err);
    return res.status(500).json({ message: 'Error al registrar cliente.' });
  }
}

// Login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const emailLc = (email || '').toLowerCase().trim();

    const user = await User.findOne({ email: emailLc });
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas.' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Credenciales inválidas.' });
    if (!user.isActive) return res.status(403).json({ message: 'Usuario inactivo.' });

    const token = signToken(user);
    return res.json({
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, phone: user.phone, photoUrl: user.photoUrl
      }
    });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ message: 'Error al iniciar sesión.' });
  }
}

// Perfil (requiere middleware auth)
async function me(req, res) {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'No encontrado' });

    let walker = null;
    if (user.role === 'paseador') {
      walker = await Walker.findOne({ user: user._id });
    }
    return res.json({ user, walker });
  } catch (err) {
    console.error('me error', err);
    return res.status(500).json({ message: 'Error al obtener perfil.' });
  }
}

module.exports = { registerWalker, registerClient, login, me };
