// models/Walk.js
const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

/**
 * Walk (Paseo)
 * - Relaciona cliente, paseador y perros
 * - Guarda tiempos, polyline (ruta recorrida), fotos, notas, precio y surge
 */
const PolyPointSchema = new Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    at:  { type: Date,   default: Date.now },
    accuracy: Number,
    speed: Number
  },
  { _id: false }
);

const WalkSchema = new Schema(
  {
    clientId: { type: Types.ObjectId, ref: 'User', required: true },
    walkerId: { type: Types.ObjectId, ref: 'Walker', required: true },
    dogIds:   [{ type: Types.ObjectId, ref: 'Dog' }],

    startAt:  { type: Date, default: Date.now },
    endAt:    { type: Date },

    polyline: [PolyPointSchema],

    photos:   [{ type: String }], // URLs (Cloudinary/S3) — se llenarán en /walks/:id/report
    notes:    { type: String },

    price:    { type: Number, default: 0 },
    surge:    { type: Number, default: 0 }, // 0–1 (ej. 0.30)

    status:   { type: String, enum: ['pending','ongoing','finished','cancelled'], default: 'ongoing' }
  },
  { timestamps: true }
);

// Índices útiles para listados
WalkSchema.index({ walkerId: 1, startAt: -1 });
WalkSchema.index({ clientId: 1, startAt: -1 });
WalkSchema.index({ status: 1 });

module.exports = mongoose.model('Walk', WalkSchema);
