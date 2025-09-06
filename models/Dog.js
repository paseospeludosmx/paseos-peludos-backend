// models/Dog.js
const mongoose = require('mongoose');

const dogSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:     { type: String, required: true },
  breed:    { type: String },
  ageYears: { type: Number },
  weightKg: { type: Number },
  notes:    { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Dog', dogSchema);
