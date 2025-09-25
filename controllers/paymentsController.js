// controllers/paymentsController.js
const Payment = require('../models/Payment');
const { calcularReparto } = require('../config/pricing');

const BANK_BENEFICIARY = process.env.BANK_BENEFICIARY || 'Beneficiario Ejemplo S.A. de C.V.';
const BANK_CLABE = process.env.BANK_CLABE || '000000000000000000';
const BANK_NAME = process.env.BANK_NAME || 'BANCO EJEMPLO';

exports.createPaymentIntent = async (req, res) => {
  try {
    const { walkId, clientId, walkerId, method, amount = 150, isPromo = false } = req.body;
    if (!clientId || !method) return res.status(400).json({ error: 'Faltan clientId o method' });
    if (!['CASH','BANK_TRANSFER'].includes(method)) return res.status(400).json({ error: 'Método inválido' });

    const distribution = calcularReparto(Number(amount), !!isPromo);
    const payment = await Payment.create({
      walkId: walkId || null, clientId, walkerId: walkerId || null,
      method, amount, isPromo, distribution
    });

    const response = {
      paymentId: payment._id, method: payment.method, amount: payment.amount,
      currency: payment.currency, status: payment.status, distribution: payment.distribution
    };
    if (method === 'BANK_TRANSFER') {
      response.bank = { beneficiary: BANK_BENEFICIARY, clabe: BANK_CLABE, bankName: BANK_NAME, instructions: 'Realiza transferencia SPEI y adjunta el comprobante en la app.' };
    }
    return res.status(201).json(response);
  } catch (e) {
    console.error('createPaymentIntent error:', e);
    res.status(500).json({ error: 'Error al crear el pago' });
  }
};

exports.uploadProof = async (req, res) => {
  try {
    const { id } = req.params;
    const { proofUrl, note } = req.body;
    const p = await Payment.findById(id);
    if (!p) return res.status(404).json({ error: 'Pago no encontrado' });
    if (p.method !== 'BANK_TRANSFER') return res.status(400).json({ error: 'Solo transferencias requieren comprobante' });
    p.proofUrl = proofUrl || p.proofUrl;
    p.proofNote = note || p.proofNote;
    p.status = 'UNDER_REVIEW';
    await p.save();
    res.json({ ok: true, status: p.status });
  } catch (e) {
    console.error('uploadProof error:', e);
    res.status(500).json({ error: 'Error al subir comprobante' });
  }
};

exports.markPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const p = await Payment.findById(id);
    if (!p) return res.status(404).json({ error: 'Pago no encontrado' });
    p.status = 'PAID';
    p.settledAt = new Date();
    await p.save();
    res.json({ ok: true, status: p.status, settledAt: p.settledAt });
  } catch (e) {
    console.error('markPaid error:', e);
    res.status(500).json({ error: 'Error al marcar pagado' });
  }
};

exports.markFailed = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const p = await Payment.findById(id);
    if (!p) return res.status(404).json({ error: 'Pago no encontrado' });
    p.status = 'FAILED';
    p.proofNote = reason || p.proofNote;
    await p.save();
    res.json({ ok: true, status: p.status });
  } catch (e) {
    console.error('markFailed error:', e);
    res.status(500).json({ error: 'Error al marcar fallido' });
  }
};

exports.listUnderReview = async (req, res) => {
  try {
    const items = await Payment.find({ method: 'BANK_TRANSFER', status: 'UNDER_REVIEW' })
      .sort({ createdAt: -1 }).limit(200);
    res.json(items);
  } catch (e) {
    console.error('listUnderReview error:', e);
    res.status(500).json({ error: 'Error al listar pagos' });
  }
};

exports.getById = async (req, res) => {
  try {
    const p = await Payment.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Pago no encontrado' });
    res.json(p);
  } catch (e) {
    console.error('getById error:', e);
    res.status(500).json({ error: 'Error al obtener pago' });
  }
};
