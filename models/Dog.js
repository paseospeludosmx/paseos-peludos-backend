const mongoose = require('mongoose');

const dogSchema = new mongoose.Schema({
  owner:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:      { type: String, required: true, trim: true },
  breed:     { type: String, trim: true },
  ageYears:  { type: Number, min: 0 },
  weightKg:  { type: Number, min: 0 },
  notes:     { type: String },
  photoUrl:  { type: String },
  vaccinated:{ type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Dog', dogSchema);
