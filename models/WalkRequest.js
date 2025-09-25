const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const WalkRequestSchema = new Schema({
  clientId: { type: Types.ObjectId, ref: 'User', required: true },
  dogIds: [{ type: Types.ObjectId, ref: 'Dog', required: true }],
  type: { type: String, enum: ['immediate','scheduled','recurring'], default: 'scheduled' },
  when: {
    startAt: { type: Date, required: true },
    durationMins: { type: Number, required: true, default: 60 }
  },
  origin: { lat: Number, lng: Number, address: String },
  notes: String,
  paymentMethod: { type: String, enum: ['CASH','BANK_TRANSFER'], required: true },
  isPromo: { type: Boolean, default: false },
  pricingSnapshot: {
    operatives: Number,
    app: Number,
    walker: Number,
    scheme: { type: String, enum: ['FIXED_APP_FEE','PROMO_SPLIT'] }
  },
  status: { type: String, enum: ['pending','assigned','confirmed','cancelled'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('WalkRequest', WalkRequestSchema);
