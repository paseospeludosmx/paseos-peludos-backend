// models/Payment.js
const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const PaymentSchema = new Schema({
  walkId:   { type: Types.ObjectId, ref: 'Walk', required: false },
  clientId: { type: Types.ObjectId, ref: 'User', required: true },

  // Debe ser OPCIONAL para poder crear el pago antes de asignar paseador
  walkerId: { type: Types.ObjectId, ref: 'User', required: false },

  method:   { type: String, enum: ['CASH', 'BANK_TRANSFER'], required: true },
  amount:   { type: Number, required: true, default: 150 },
  currency: { type: String, default: 'MXN' },

  status: {
    type: String,
    enum: ['PENDING', 'REQUIRES_PROOF', 'UNDER_REVIEW', 'PAID', 'FAILED', 'DISPUTED'],
    default: function () {
      return this.method === 'CASH' ? 'PENDING' : 'REQUIRES_PROOF';
    }
  },

  // Comprobante (transferencias)
  proofUrl:  { type: String },
  proofNote: { type: String },

  // Reparto (snapshot)
  distribution: {
    operatives: Number,
    app: Number,
    walker: Number,
    scheme: { type: String, enum: ['FIXED_APP_FEE', 'PROMO_SPLIT'] }
  },

  isPromo:   { type: Boolean, default: false },
  settledAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
