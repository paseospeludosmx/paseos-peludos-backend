// backend/models/Clarification.js
const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const ClarificationSchema = new Schema({
  walkId: { type: Types.ObjectId, ref: 'Walk' },
  clientId: { type: Types.ObjectId, ref: 'User', required: true },
  walkerId: { type: Types.ObjectId, ref: 'User', required: true },
  category: { type: String, enum: ['NO_PAYMENT', 'PARTIAL_PAYMENT', 'SERVICE_ISSUE', 'OTHER'], required: true },
  status: { type: String, enum: ['OPEN', 'IN_REVIEW', 'RESOLVED', 'ESCALATED'], default: 'OPEN' },
  description: { type: String },
  evidenceUrls: [{ type: String }],
  createdBy: { type: String, enum: ['walker', 'client', 'system'], default: 'system' },
  resolvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Clarification', ClarificationSchema);
