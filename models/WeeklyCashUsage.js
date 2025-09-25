// backend/models/WeeklyCashUsage.js
const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const WeeklyCashUsageSchema = new Schema({
  clientId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  weekStartISO: { type: String, required: true, index: true }, // YYYY-MM-DD (lunes)
  hoursBookedCash: { type: Number, default: 0 } // suma de horas CASH confirmadas
}, { timestamps: true });

WeeklyCashUsageSchema.index({ clientId: 1, weekStartISO: 1 }, { unique: true });

module.exports = mongoose.model('WeeklyCashUsage', WeeklyCashUsageSchema);
