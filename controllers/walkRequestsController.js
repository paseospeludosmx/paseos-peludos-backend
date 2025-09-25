// controllers/walkRequestsController.js
const WalkRequest = require('../models/WalkRequest');
const Payment = require('../models/Payment');
const { PRICING, calcularReparto } = require('../config/pricing');
const { commitCashHours } = require('../middlewares/checkCashWeeklyLimit');

const BANK_BENEFICIARY = process.env.BANK_BENEFICIARY || 'Beneficiario Ejemplo S.A. de C.V.';
const BANK_CLABE = process.env.BANK_CLABE || '000000000000000000';
const BANK_NAME = process.env.BANK_NAME || 'BANCO EJEMPLO';

async function createWalkRequest(req, res) {
  try {
    const {
      clientId,
      dogIds = [],
      paymentMethod,                  // 'CASH' | 'BANK_TRANSFER'
      isPromo = false,
      type = 'scheduled',
      when = { startAt: new Date(), durationMins: PRICING.durationMins },
      origin = {},
      notes = ''
    } = req.body;

    if (!clientId) return res.status(400).json({ error: 'Falta clientId' });
    if (!Array.isArray(dogIds) || dogIds.length === 0) {
      return res.status(400).json({ error: 'Debe enviar al menos un perro' });
    }
    if (!['CASH', 'BANK_TRANSFER'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'paymentMethod inválido (CASH o BANK_TRANSFER)' });
    }

    const durationMins = Number(when.durationMins || PRICING.durationMins);
    if (Number.isNaN(durationMins) || durationMins <= 0) {
      return res.status(400).json({ error: 'Duración inválida' });
    }

    const hours = Math.ceil(durationMins / 60);   // bloques de 1h
    const amount = PRICING.basePrice * hours;     // $150 * horas
    const pricingSnapshot = calcularReparto(amount, isPromo);

    // 1) Crear solicitud de paseo
    const walkReq = await WalkRequest.create({
      clientId,
      dogIds,
      type,
      when: { startAt: when.startAt || new Date(), durationMins },
      origin,
      notes,
      paymentMethod,
      isPromo,
      pricingSnapshot,
      status: 'pending'
    });

    // 2) Crear Payment (sin walkerId por ahora)
    const payment = await Payment.create({
      walkId: null,
      clientId,
      walkerId: null,
      method: paymentMethod,
      amount,
      isPromo,
      distribution: pricingSnapshot
    });

    // 3) Si es CASH y pasó el middleware, suma horas
    if (paymentMethod === 'CASH' && req._cashLimitMeta) {
      const { weekStartISO, addHours } = req._cashLimitMeta;
      await commitCashHours(clientId, weekStartISO, addHours);
    }

    const response = {
      ok: true,
      walkRequest: {
        id: walkReq._id,
        status: walkReq.status,
        when: walkReq.when,
        paymentMethod,
        pricingSnapshot
      },
      payment: {
        id: payment._id,
        method: payment.method,
        amount: payment.amount,
        status: payment.status,
        distribution: payment.distribution
      }
    };

    if (paymentMethod === 'BANK_TRANSFER') {
      response.bank = {
        beneficiary: BANK_BENEFICIARY,
        clabe: BANK_CLABE,
        bankName: BANK_NAME,
        instructions: 'Realiza transferencia SPEI y adjunta el comprobante.'
      };
    }

    return res.status(201).json(response);
  } catch (err) {
    console.error('createWalkRequest error:', err);
    return res.status(500).json({ error: 'Error al crear la solicitud de paseo.' });
  }
}

module.exports = { createWalkRequest };
