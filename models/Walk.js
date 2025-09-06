// models/Walk.js
const mongoose = require('mongoose');

const walkSchema = new mongoose.Schema({
  client:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },   // dueño
  walker:   { type: mongoose.Schema.Types.ObjectId, ref: 'Walker', required: true }, // paseador
  dog:      { type: mongoose.Schema.Types.ObjectId, ref: 'Dog' },                    // opcional
  zone:     { type: String, trim: true },
  date:     { type: Date, required: true },
  duration: { type: String, default: '45m' }, // ejemplo: '30m', '45m', '1h'
  notes:    { type: String, trim: true },

  price:    { type: Number, default: 0 },

  status:   { 
    type: String,
    enum: ['pending','confirmed','completed','canceled'],
    default: 'pending'
  },
}, { timestamps: true });

module.exports = mongoose.model('Walk', walkSchema);
