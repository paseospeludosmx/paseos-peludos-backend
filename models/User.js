/* models/User.js */
const mongoose = require('mongoose');

/** GeoJSON: coordinates = [lon, lat] */
const geoPointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: {
      type: [Number],
      default: [-99.246, 19.613], // Izcalli aprox [lon, lat]
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 2,
        message: 'address.geo.coordinates debe ser [lon, lat]',
      },
    },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    extNumber: { type: String, trim: true },
    intNumber: { type: String, trim: true },
    neighborhood: { type: String, trim: true }, // colonia
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zip: { type: String, trim: true },
    references: { type: String, trim: true },
    geo: { type: geoPointSchema, default: () => ({}) },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true, // permite usuarios sin email (solo teléfono)
    },

    passwordHash: { type: String, required: true },

    phone: { type: String, trim: true },
    photoUrl: { type: String, trim: true },

    address: addressSchema,

    role: {
      type: String,
      enum: ['cliente', 'paseador', 'admin'],
      default: 'cliente',
      required: true,
    },

    isActive: { type: Boolean, default: true },

    fcmToken: { type: String, trim: true }, // notificaciones push
  },
  { timestamps: true }
);

// índice para $near / $geoWithin
userSchema.index({ 'address.geo': '2dsphere' });

// ocultar campos sensibles al serializar
userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});
userSchema.set('toObject', {
  transform: function (doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
