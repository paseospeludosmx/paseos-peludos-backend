// backend/controllers/clarificationsController.js
const Clarification = require('../models/Clarification');

exports.createClarification = async (req, res) => {
  try {
    const { walkId, clientId, walkerId, category = 'NO_PAYMENT', description = '', evidenceUrls = [], createdBy = 'system' } = req.body;

    if (!clientId || !walkerId) {
      return res.status(400).json({ error: 'Faltan clientId y walkerId.' });
    }

    const ticket = await Clarification.create({
      walkId: walkId || null,
      clientId,
      walkerId,
      category,
      description,
      evidenceUrls,
      createdBy
    });

    return res.status(201).json({ ok: true, clarificationId: ticket._id, status: ticket.status });
  } catch (err) {
    console.error('createClarification error:', err);
    return res.status(500).json({ error: 'Error al crear aclaración.' });
  }
};

exports.listOpen = async (req, res) => {
  try {
    const items = await Clarification.find({ status: { $in: ['OPEN', 'IN_REVIEW'] } })
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json(items);
  } catch (err) {
    console.error('listOpen error:', err);
    return res.status(500).json({ error: 'Error al listar aclaraciones.' });
  }
};

exports.resolve = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Clarification.findById(id);
    if (!ticket) return res.status(404).json({ error: 'Aclaración no encontrada.' });

    ticket.status = 'RESOLVED';
    ticket.resolvedAt = new Date();
    await ticket.save();

    return res.json({ ok: true, status: ticket.status });
  } catch (err) {
    console.error('resolve error:', err);
    return res.status(500).json({ error: 'Error al resolver aclaración.' });
  }
};
