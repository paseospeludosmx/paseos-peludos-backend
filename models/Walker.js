// models/Walker.js
const mongoose = require('mongoose');

const dayScheduleSchema = new mongoose.Schema({
  day:   { type: String, enum: ['mon','tue','wed','thu','fri','sat','sun'], required: true },
  // puedes dejar los slots vacíos por ahora; más adelante los llenas desde la UI
  slots: [{ from: String, to: String }],
}, { _id: false });

const walkerSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bio:         { type: String, default: '' },
  zones:       [{ type: String }],
  availability:[dayScheduleSchema],            // <— estructura estricta
  ratePerHour: { type: Number, default: 120 },
}, { timestamps: true });

module.exports = mongoose.model('Walker', walkerSchema);
