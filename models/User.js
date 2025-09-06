const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: String,
  extNumber: String,
  intNumber: String,
  neighborhood: String,  // colonia
  city: String,
  state: String,
  zip: String,
  references: String,    // referencias del domicilio
}, { _id: false });

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },

  phone:     { type: String, trim: true },
  photoUrl:  { type: String },            // foto de perfil (URL)
  address:   addressSchema,               // domicilio para el servicio

  role:      { type: String, enum: ['cliente', 'paseador', 'admin'], default: 'cliente' },
  isActive:  { type: Boolean, default: true },

  // utilidades móviles
  fcmToken:  { type: String },            // notificaciones push
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
