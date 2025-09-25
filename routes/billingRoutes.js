// routes/billingRoutes.js
const express = require('express');
const router = express.Router();
const WeeklyCashUsage = require('../models/WeeklyCashUsage');
const { getWeekStartISO } = require('../utils/week');

const MAX_CASH_HOURS_PER_WEEK = 3;

// GET /api/billing/cash-quota?clientId=...
router.get('/billing/cash-quota', async (req, res) => {
  try {
    const clientId = req.query.clientId || req.body.clientId;
    if (!clientId) return res.status(400).json({ error: 'Falta clientId' });

    const weekStartISO = getWeekStartISO(new Date());
    const usage = await WeeklyCashUsage.findOne({ clientId, weekStartISO });
    const used = usage ? usage.hoursBookedCash : 0;
    const remaining = Math.max(0, MAX_CASH_HOURS_PER_WEEK - used);

    res.json({ weekStartISO, limit: MAX_CASH_HOURS_PER_WEEK, used, remaining });
  } catch (e) {
    console.error('cash-quota error:', e);
    res.status(500).json({ error: 'Error al obtener cupo de efectivo' });
  }
});

module.exports = router;
