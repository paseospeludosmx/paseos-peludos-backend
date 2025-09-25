// middlewares/checkCashWeeklyLimit.js
const WeeklyCashUsage = require('../models/WeeklyCashUsage');
const { getWeekStartISO } = require('../utils/week');

const MAX_CASH_HOURS_PER_WEEK = 3;

async function checkCashWeeklyLimit(req, res, next) {
  try {
    const { clientId, paymentMethod, when } = req.body;
    if (paymentMethod !== 'CASH') return next();

    if (!clientId || !when || !when.durationMins) {
      return res.status(400).json({ error: 'Faltan clientId y/o when.durationMins' });
    }

    const addHours = (Number(when.durationMins) || 60) / 60;
    const weekStartISO = getWeekStartISO(new Date());
    const usage = await WeeklyCashUsage.findOne({ clientId, weekStartISO });
    const used = usage ? usage.hoursBookedCash : 0;

    if (used + addHours > MAX_CASH_HOURS_PER_WEEK + 1e-6) {
      return res.status(403).json({
        error: 'Límite de 3 horas/semana en efectivo alcanzado. Para más horas usa transferencia.'
      });
    }

    req._cashLimitMeta = { weekStartISO, addHours };
    next();
  } catch (err) {
    console.error('checkCashWeeklyLimit error:', err);
    res.status(500).json({ error: 'Error al validar límite de efectivo' });
  }
}

async function commitCashHours(clientId, weekStartISO, addHours) {
  if (!clientId || !weekStartISO || !addHours) return;
  await WeeklyCashUsage.findOneAndUpdate(
    { clientId, weekStartISO },
    { $inc: { hoursBookedCash: addHours } },
    { upsert: true, new: true }
  );
}

module.exports = checkCashWeeklyLimit;
module.exports.commitCashHours = commitCashHours;
