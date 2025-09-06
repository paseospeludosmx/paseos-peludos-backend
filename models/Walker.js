const mongoose = require('mongoose');

const dayScheduleSchema = new mongoose.Schema({
  day:   { type: String, enum: ['mon','tue','wed','thu','fri','sat','sun'], required: true },
  slots: [{ from: String, to: String }],  // ej. "09:00" - "12:00"
}, { _id: false });

const walkerSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  bio:         { type: String, default: '' },
  zones:       [{ type: String }],                  // colonias/zonas donde trabaja
  availability:[dayScheduleSchema],                 // disponibilidad

  ratePerHour: { type: Number, default: 120, min: 0 },

  // servicios adicionales que tu app muestra en la UI
  services:    [{ type: String, enum: ['paseo', 'guarderia', 'adiestramiento', 'spa', 'estetica'] }],

  // extras útiles
  experienceYears: { type: Number, min: 0 },
  vehicles:   [{ type: String, enum: ['pie','bicicleta','moto','auto'] }],

  verified:   { type: Boolean, default: false },
  ratingAvg:  { type: Number, default: 5, min: 1, max: 5 },
  ratingCount:{ type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Walker', walkerSchema);
